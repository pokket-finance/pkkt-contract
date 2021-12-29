// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import './Utils.sol';
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
library StructureData {
     
    using SafeMath for uint256;
     uint8 public constant MATUREROUND= 1; //7 for daily settlement, 1 for daily settlement
     using Utils for uint256;
     struct OptionParameters {
         address option;
         uint256 strikePrice;  // strike price if executed
         uint8 pricePrecision;
         uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
     }

    struct OptionState {
         uint256 round;
         uint256 totalAmount; 
         uint256 totalTerminate;   
         uint256 strikePrice; 
         uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
         uint8 pricePrecision; 
         bool executed; 
         bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral;
    }
 
   struct MaturedState {
       uint256 releasedDepositAssetAmount;
       uint256 releasedDepositAssetPremiumAmount;
       uint256 releasedCounterPartyAssetAmount; 
       uint256 releasedCounterPartyAssetPremiumAmount; 
       uint256 autoRollDepositAssetAmount;
       uint256 autoRollDepositAssetPremiumAmount;
       uint256 autoRollCounterPartyAssetAmount; 
       uint256 autoRollCounterPartyAssetPremiumAmount; 

       uint256 round;
       
   }

    enum OptionType {
        HodlBooster,
        VolAlpha
    }

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 tempLocked;//asset not sent to trader yet, but closed for deposit
        uint256[MATUREROUND] ongoingAsset; //for previous 7 rounds
        uint8 nextCursor; //nextCursor
        uint232 totalRound; 
        bool hasState;
        uint256 assetToTerminate;  
        uint256 assetToTerminateForNextRound;  
    }

    struct OptionSnapshot {
        uint256 totalPending;
        uint256 totalLocked;
        uint256 totalReleasedDeposit;
        uint256 totalReleasedCounterParty; 
    }

    struct UserBalance {
        uint256 pendingDepositAssetAmount; 
        uint256 lockedDepositAssetAmount;  
        uint256 releasedDepositAssetAmount;
        uint256 releasedCounterPartyAssetAmount;
    }

    function SetOngoingAsset(UserState storage userState, uint256 newValue) internal { 
        uint cursor = userState.nextCursor;
        userState.ongoingAsset[cursor] = newValue;
        uint8 nextCursor = cursor == (MATUREROUND - 1) ? uint8(0) : uint8(cursor + 1);
        userState.nextCursor = nextCursor;
        userState.totalRound = userState.totalRound + 1; //won't overflow
    }
    
    function GetOngoingAsset(UserState storage userState, uint8 backwardRound) internal view returns(uint256) {
        if (userState.totalRound <= backwardRound) return 0;
        require(backwardRound < MATUREROUND);
        int8 previousCursor = int8(userState.nextCursor) - int8(backwardRound) - 1;
        if (previousCursor < 0) {
            previousCursor = previousCursor + int8(MATUREROUND);
        }
        return userState.ongoingAsset[uint8(previousCursor)];
    }

    function deriveWithdrawRequest(UserState storage userState, uint256 premiumRate) internal view returns (uint256 _onGoingRoundAmount, uint256 _lockedRoundAmount) {
       if (userState.tempLocked == 0) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       uint256 onGoing = GetOngoingAsset(userState, 0);
       if (onGoing == 0) {
           return (0, userState.assetToTerminateForNextRound);
       }
       onGoing = onGoing.sub(userState.assetToTerminate);
       uint256 virtualOnGoing = onGoing.withPremium(premiumRate);
       if (userState.assetToTerminateForNextRound <= virtualOnGoing) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       else {
           return (virtualOnGoing, userState.assetToTerminateForNextRound.sub(virtualOnGoing));
       }
    }
    function deriveVirtualLocked(UserState storage userState, uint256 premiumRate) internal view returns (uint256) {
        uint256 onGoing = GetOngoingAsset(userState, 0);
        if (onGoing == 0) {
            return userState.tempLocked;
        }
        onGoing = onGoing.sub(userState.assetToTerminate);
        if (userState.tempLocked == 0) {
            return onGoing.withPremium(premiumRate);
        }
        return userState.tempLocked.add(onGoing.withPremium(premiumRate));
        
    }
    struct OptionPairDefinition{
        address callOption;
        address putOption;
        address callOptionDeposit;
        address putOptionDeposit;
    }
    struct SettlementAccountingResult {
        //won't change regardless execute or not
        address option;
        uint256 round;
        uint256 depositAmount;  

        //following will change if execute or not
        bool executed;
        uint256 autoRollAmount; //T-1 Carried (filled only when not executed)
        uint256 autoRollPremium; //Premium (filled only when not executed)
        //maturedAmount+maturedPremium = requested withdrawal for deposit asset(filled only when not executed and with withdraw request)
        uint256 releasedAmount;  
        uint256 releasedPremium;
        //autoRollCounterPartyAmount + autoRollCounterPartyPremium = Execution rolled-out for deposit asset (Execution roll-in for counter party option)
        //filled only when executed
        uint256 autoRollCounterPartyAmount;
        uint256 autoRollCounterPartyPremium;
        //maturedCounterPartyAmount+maturedCounterPartyPremium= requested withdrawal for couter party asset(filled only when executed and with withdraw request)
        uint256 releasedCounterPartyAmount;
        uint256 releasedCounterPartyPremium; 

    }

    enum OptionExecution{
        NoExecution,
        ExecuteCall,
        ExecutePut
    }

    struct OptionPairExecutionAccountingResult {  
        SettlementAccountingResult callOptionResult;
        SettlementAccountingResult putOptionResult;
        OptionExecution execute;
    }

    struct OptionPairExecution {
        address callOption;
        address putOption;
        OptionExecution execute; 
    }

    

    struct SettlementCashflowResult{ 
        address contractAddress; //0 for eth 
        uint256 newDepositAmount;
        uint256 newReleasedAmount;
        int256 leftOverAmount; //positive, if trader didn't withdraw last time; negative, if trader failed to send back last time; 
    }
 
}