// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import './Utils.sol';
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
library StructureData {
     
    using SafeMath for uint256;
    
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");
     uint8 public constant MATUREROUND= 1; //7 for daily settlement, 1 for daily settlement
     using Utils for uint256;
     struct OptionParameters {
         uint256 strikePrice;  // strike price if executed
         address option;
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

    /*struct UserState {
        uint256 pendingAsset; //for current round
        uint256 tempLocked;//asset not sent to trader yet, but closed for deposit
        uint256[MATUREROUND] ongoingAsset; //for previous 7 rounds
        uint256 assetToTerminate;  
        uint256 assetToTerminateForNextRound;  
        uint8 nextCursor; //nextCursor
        uint232 totalRound; 
        bool hasState;
    }*/

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 tempLocked;//asset not sent to trader yet, but closed for deposit
        uint256 ongoingAsset; 
        uint256 assetToTerminate;  
        uint256 assetToTerminateForNextRound;   
        uint232 totalRound; 
        bool hasState;
    }

    struct OptionSnapshot {
        uint256 totalPending; 
        //total tvl = totalLocked + totalTerminating
        uint256 totalLocked; 
        //only set during settlement
        uint256 totalTerminating;
        //amount to terminate in next round,  totalToTerminate <= totalLocked
        uint256 totalToTerminate;
        uint256 totalReleasedDeposit;
        uint256 totalReleasedCounterParty; 
    }

    struct UserBalance {
        uint256 pendingDepositAssetAmount; 
        //tvl = lockedDepositAssetAmount + terminatingDepositAssetAmount
        uint256 lockedDepositAssetAmount;  
        //only set during settlement
        uint256 terminatingDepositAssetAmount;
        //amount to terminate in next round, toTerminateDepositAssetAmount <= lockedDepositAssetAmount
        uint256 toTerminateDepositAssetAmount;
        uint256 releasedDepositAssetAmount;
        uint256 releasedCounterPartyAssetAmount;
    }

 

    function deriveWithdrawRequest(UserState memory userState, uint256 premiumRate) internal pure returns (uint256 _onGoingRoundAmount, uint256 _lockedRoundAmount) {
       if (userState.tempLocked == 0) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       uint256 onGoing = userState.ongoingAsset;
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
    function deriveVirtualLocked(UserState memory userState, uint256 premiumRate) internal pure returns (uint256) {
        uint256 onGoing = userState.ongoingAsset;
        if (onGoing == 0) {
            return userState.tempLocked;
        }
        onGoing = onGoing.sub(userState.assetToTerminate).withPremium(premiumRate);
        if (userState.tempLocked == 0) {
            return onGoing;
        }
        return userState.tempLocked.add(onGoing);
        
    }

        

     function calculateMaturity(bool _execute, StructureData.OptionState memory _optionState, bool _callOrPut, 
     uint8 _depositAssetAmountDecimals, uint8 _counterPartyAssetAmountDecimals) internal pure
     returns(StructureData.MaturedState memory) {
       StructureData.MaturedState memory state = StructureData.MaturedState({
          releasedDepositAssetAmount: 0,
          releasedDepositAssetPremiumAmount: 0,
          autoRollDepositAssetAmount: 0,
          autoRollDepositAssetPremiumAmount: 0,
          releasedCounterPartyAssetAmount: 0, 
          releasedCounterPartyAssetPremiumAmount: 0,
          autoRollCounterPartyAssetAmount: 0,
          autoRollCounterPartyAssetPremiumAmount: 0,
          round: _optionState.round
       });  
        if (_execute) {  

           uint256 maturedCounterPartyAssetAmount = _callOrPut ? 
            _optionState.totalAmount.mul(_optionState.strikePrice).mul(10**_counterPartyAssetAmountDecimals).
           div(10**(_optionState.pricePrecision + _depositAssetAmountDecimals))  :  

           _optionState.totalAmount.mul(10**(_optionState.pricePrecision + _counterPartyAssetAmountDecimals)).
           div(_optionState.strikePrice).div(10** _depositAssetAmountDecimals); 
 
           uint256 maturedCounterPartyAssetPremiumAmount = maturedCounterPartyAssetAmount.premium(_optionState.premiumRate); 
           if (_optionState.totalTerminate > 0) { 
               state.releasedCounterPartyAssetAmount = Utils.getAmountToTerminate(maturedCounterPartyAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetPremiumAmount = Utils.getAmountToTerminate(maturedCounterPartyAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
           }
           state.autoRollCounterPartyAssetAmount = maturedCounterPartyAssetAmount.sub(state.releasedCounterPartyAssetAmount);
           state.autoRollCounterPartyAssetPremiumAmount = maturedCounterPartyAssetPremiumAmount.sub(state.releasedCounterPartyAssetPremiumAmount);
        }
        else { 
           uint256 maturedDepositAssetAmount = _optionState.totalAmount;
           uint256 maturedDepositAssetPremiumAmount = maturedDepositAssetAmount.premium(_optionState.premiumRate);
           if (_optionState.totalTerminate > 0) { 
               state.releasedDepositAssetAmount = Utils.getAmountToTerminate(maturedDepositAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetPremiumAmount = Utils.getAmountToTerminate(maturedDepositAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
           }
           state.autoRollDepositAssetAmount = maturedDepositAssetAmount.sub(state.releasedDepositAssetAmount);
           state.autoRollDepositAssetPremiumAmount = maturedDepositAssetPremiumAmount.sub(state.releasedDepositAssetPremiumAmount);

        }
         return state;
     }


    struct OptionPairDefinition{
        address callOption;
        address putOption;
        address callOptionDeposit;
        address putOptionDeposit;
    }
    struct SettlementAccountingResult {
        uint256 round;
        uint256 depositAmount;  
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
 
        address option; 
        bool executed;

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
        uint256 newDepositAmount;
        uint256 newReleasedAmount;
        int256 leftOverAmount; //positive, if trader didn't withdraw last time; negative, if trader failed to send back last time; 
        address contractAddress; //0 for eth 
    }
 
}