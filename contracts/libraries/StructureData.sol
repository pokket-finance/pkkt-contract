// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library StructureData {
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");
    uint8 public constant MATUREROUND = 1; //7 for daily settlement, 1 for daily settlement
    uint8 public constant PRICE_PRECISION = 4;
    struct OptionParameters { 
        uint128 strikePrice; // strike price if executed
        uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
    }

    struct OptionState {
        uint128 totalAmount;
        uint128 totalTerminate;
        uint128 strikePrice;
        uint16 round;
        uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
        bool executed;
        bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral;
    }

    struct MaturedState {
        uint256 releasedDepositAssetAmount;
        uint256 releasedDepositAssetPremiumAmount;
        uint256 releasedDepositAssetAmountWithPremium;
        uint256 releasedCounterPartyAssetAmount;
        uint256 releasedCounterPartyAssetPremiumAmount;
        uint256 releasedCounterPartyAssetAmountWithPremium;
        uint256 autoRollDepositAssetAmount;
        uint256 autoRollDepositAssetPremiumAmount;
        uint256 autoRollDepositAssetAmountWithPremium;
        uint256 autoRollCounterPartyAssetAmount;
        uint256 autoRollCounterPartyAssetPremiumAmount;
        uint256 autoRollCounterPartyAssetAmountWithPremium;
    }

    struct AssetData {
        uint128 releasedAmount; //debit
        uint128 depositAmount; //credit
        int128 leftOverAmount; //history balance
        /*
         *  actual balance perspective
         *  withdrawable = redeemable + released
         *  balance = withdrawable + leftOver
         */
        uint128 balanceAfterSettle;
        uint128 withdrawableAfterSettle;
        uint128 traderWithdrawn;
    }

    struct OptionData {
        uint128 totalReleasedDepositAssetAmount;
        uint128 totalReleasedCounterPartyAssetAmount;
        uint128 assetToTerminateForNextRound;
        mapping(uint16 => StructureData.OptionState) optionStates;
        address[] usersInvolved;
        mapping(address => StructureData.UserState) userStates;
    }

    struct UserState {
        uint128 pendingAsset; //for current round
        uint128 tempLocked; //asset not sent to trader yet, but closed for deposit
        uint128 ongoingAsset;
        uint128 assetToTerminate;
        uint128 assetToTerminateForNextRound;
        uint128 releasedDepositAssetAmount;
        uint128 releasedCounterPartyAssetAmount;
        bool hasState;
    }

    struct OptionSnapshot {
        uint128 totalPending;
        //total tvl = totalLocked + totalTerminating
        uint128 totalLocked;
        //only set during settlement
        uint128 totalTerminating;
        //amount to terminate in next round,  totalToTerminate <= totalLocked
        uint128 totalToTerminate;
        uint128 totalReleasedDeposit;
        uint128 totalReleasedCounterParty;
    }

    struct UserBalance {
        uint128 pendingDepositAssetAmount;
        //tvl = lockedDepositAssetAmount + terminatingDepositAssetAmount
        uint128 lockedDepositAssetAmount;
        //only set during settlement
        uint128 terminatingDepositAssetAmount;
        //amount to terminate in next round, toTerminateDepositAssetAmount <= lockedDepositAssetAmount
        uint128 toTerminateDepositAssetAmount;
        uint128 releasedDepositAssetAmount;
        uint128 releasedCounterPartyAssetAmount;
    }
    struct OptionPairDefinition {
        uint8 callOptionId;
        uint8 putOptionId;
        uint8 depositAssetAmountDecimals;
        uint8 counterPartyAssetAmountDecimals;
        address depositAsset;
        address counterPartyAsset;
    }
    struct SettlementAccountingResult {
        uint128 depositAmount;
        uint128 autoRollAmount; //T-1 Carried (filled only when not executed)
        uint128 autoRollPremium; //Premium (filled only when not executed)
        //maturedAmount+maturedPremium = requested withdrawal for deposit asset(filled only when not executed and with withdraw request)
        uint128 releasedAmount;
        uint128 releasedPremium;
        //autoRollCounterPartyAmount + autoRollCounterPartyPremium = Execution rolled-out for deposit asset (Execution roll-in for counter party option)
        //filled only when executed
        uint128 autoRollCounterPartyAmount;
        uint128 autoRollCounterPartyPremium;
        //maturedCounterPartyAmount+maturedCounterPartyPremium= requested withdrawal for couter party asset(filled only when executed and with withdraw request)
        uint128 releasedCounterPartyAmount;
        uint128 releasedCounterPartyPremium;  
        bool executed;
    }

    enum OptionExecution {
        NoExecution,
        ExecuteCall,
        ExecutePut
    }

    struct OptionPairExecutionAccountingResult {
        SettlementAccountingResult callOptionResult;
        SettlementAccountingResult putOptionResult;
        OptionExecution execute;
    }

    struct SettlementCashflowResult {
        uint128 newDepositAmount;
        uint128 newReleasedAmount;
        int128 leftOverAmount; //positive, if trader didn't withdraw last time; negative, if trader failed to send back last time;
        address contractAddress; //0 for eth
    }
}
