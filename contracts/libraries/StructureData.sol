// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";  
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
library StructureData {
      
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");
     uint8 public constant MATUREROUND= 1; //7 for daily settlement, 1 for daily settlement 
     uint8 public constant PRICE_PRECISION = 4;
    using SafeERC20 for IERC20;
      uint256 public constant RATIOMULTIPLIER = 10000;
     using SafeMath for uint256;
     struct OptionParameters {
         uint128 strikePrice;  // strike price if executed
         uint8 optionId; 
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
       uint128 releasedDepositAssetAmount;
       uint128 releasedDepositAssetPremiumAmount;
       uint128 releasedDepositAssetAmountWithPremium;
       uint128 releasedCounterPartyAssetAmount; 
       uint128 releasedCounterPartyAssetPremiumAmount; 
       uint128 releasedCounterPartyAssetAmountWithPremium;
       uint128 autoRollDepositAssetAmount;
       uint128 autoRollDepositAssetPremiumAmount;
       uint128 autoRollDepositAssetAmountWithPremium;
       uint128 autoRollCounterPartyAssetAmount; 
       uint128 autoRollCounterPartyAssetPremiumAmount; 
       uint128 autoRollCounterPartyAssetAmountWithPremium;

       uint16 round;
       
   }

   struct AssetData {
       uint128 releasedAmount; //debit
       uint128 depositAmount; //credit
       int128 leftOverAmount;  //history balance
           
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
        uint128 pendingAsset; //for current round
        uint128 tempLocked;//asset not sent to trader yet, but closed for deposit
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

    function getAmountToTerminate(uint256 _maturedAmount, uint256 _assetToTerminate, uint256 _assetAmount) internal pure returns(uint128) {
       if (_assetToTerminate == 0 || _assetAmount == 0 || _maturedAmount == 0) return 0;
       return uint128(_assetToTerminate >= _assetAmount ?  _maturedAmount  : _maturedAmount.mul(_assetToTerminate).div(_assetAmount));
   }

   function withPremium(uint256 _baseAmount, uint256 _premimumRate) internal pure returns(uint128) {
       return uint128(_baseAmount.mul(RATIOMULTIPLIER + _premimumRate).div(RATIOMULTIPLIER));
   }
   
   function premium(uint256 _baseAmount, uint256 _premimumRate) internal pure returns(uint128) {
       return  uint128(_baseAmount.mul(_premimumRate).div(RATIOMULTIPLIER));
   }
   
   function subOrZero(uint128 _base, uint128 _substractor) internal pure returns (uint128) {
       return _base >= _substractor ? _base - _substractor : 0;
   }


    function deriveWithdrawRequest(UserState memory userState, uint256 premiumRate) external pure returns (uint128 _onGoingRoundAmount, uint128 _lockedRoundAmount) {
       if (userState.tempLocked == 0) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       uint128 onGoing = userState.ongoingAsset;
       if (onGoing == 0) {
           return (0, userState.assetToTerminateForNextRound);
       } 
       uint128 virtualOnGoing = withPremium(onGoing - userState.assetToTerminate, premiumRate);
       if (userState.assetToTerminateForNextRound <= virtualOnGoing) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       else {
           return (virtualOnGoing, userState.assetToTerminateForNextRound - virtualOnGoing);
       }
    }
    function deriveVirtualLocked(UserState memory userState, uint16 premiumRate) external pure returns (uint128) {
        uint128 onGoing = userState.ongoingAsset;
        if (onGoing == 0) {
            return userState.tempLocked;
        }
        onGoing = withPremium(onGoing - userState.assetToTerminate, premiumRate);
        if (userState.tempLocked == 0) {
            return onGoing;
        }
        return userState.tempLocked + onGoing;
        
    }

    function getAvailableBalance(address _asset) external view returns(uint256) {
       if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(address(msg.sender)); 
       }
       else{
          return address(msg.sender).balance;
       }
    }
    function withdraw(address _target, uint256 _amount, address _contractAddress) external {
        require(_amount > 0, "!amount");
        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        }
        else { 
            IERC20(_contractAddress).safeTransfer(_target, _amount); 
        }
    }  
     function calculateMaturity(bool _execute, StructureData.OptionState memory _optionState, bool _callOrPut, 
     uint8 _depositAssetAmountDecimals, uint8 _counterPartyAssetAmountDecimals) external  pure
     returns(StructureData.MaturedState memory) {
       StructureData.MaturedState memory state = StructureData.MaturedState({
          releasedDepositAssetAmount: 0,
          releasedDepositAssetPremiumAmount: 0,
          releasedDepositAssetAmountWithPremium: 0,
          autoRollDepositAssetAmount: 0,
          autoRollDepositAssetPremiumAmount: 0,
          autoRollDepositAssetAmountWithPremium: 0,
          releasedCounterPartyAssetAmount: 0, 
          releasedCounterPartyAssetPremiumAmount: 0,
          releasedCounterPartyAssetAmountWithPremium: 0,
          autoRollCounterPartyAssetAmount: 0,
          autoRollCounterPartyAssetPremiumAmount: 0,
          autoRollCounterPartyAssetAmountWithPremium: 0,
          round: _optionState.round
       });  
        if (_execute) {  

           uint128 maturedCounterPartyAssetAmount = uint128(_callOrPut ? 
            uint256(_optionState.totalAmount).mul(uint256(_optionState.strikePrice)).mul(10**_counterPartyAssetAmountDecimals).div
           (10**(PRICE_PRECISION + _depositAssetAmountDecimals))  :  

            uint256(_optionState.totalAmount).mul(10**(PRICE_PRECISION + _counterPartyAssetAmountDecimals)).div( 
            uint256(_optionState.strikePrice)).div(10** _depositAssetAmountDecimals)); 
 
           uint128 maturedCounterPartyAssetPremiumAmount = premium(maturedCounterPartyAssetAmount,_optionState.premiumRate); 
           if (_optionState.totalTerminate > 0) { 
               state.releasedCounterPartyAssetAmount = getAmountToTerminate(maturedCounterPartyAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetPremiumAmount = getAmountToTerminate(maturedCounterPartyAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetAmountWithPremium = state.releasedCounterPartyAssetAmount + state.releasedCounterPartyAssetPremiumAmount;
           }
           state.autoRollCounterPartyAssetAmount = maturedCounterPartyAssetAmount - state.releasedCounterPartyAssetAmount;
           state.autoRollCounterPartyAssetPremiumAmount = maturedCounterPartyAssetPremiumAmount - state.releasedCounterPartyAssetPremiumAmount;
           state.autoRollCounterPartyAssetAmountWithPremium = state.autoRollCounterPartyAssetAmount + state.autoRollCounterPartyAssetPremiumAmount;
        }
        else { 
           uint128 maturedDepositAssetAmount = _optionState.totalAmount;
           uint128 maturedDepositAssetPremiumAmount = premium(maturedDepositAssetAmount,_optionState.premiumRate);
           if (_optionState.totalTerminate > 0) { 
               state.releasedDepositAssetAmount = getAmountToTerminate(maturedDepositAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetPremiumAmount = getAmountToTerminate(maturedDepositAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetAmountWithPremium = state.releasedDepositAssetAmount + state.releasedDepositAssetPremiumAmount;
           }
           state.autoRollDepositAssetAmount = maturedDepositAssetAmount - state.releasedDepositAssetAmount;
           state.autoRollDepositAssetPremiumAmount = maturedDepositAssetPremiumAmount - state.releasedDepositAssetPremiumAmount;
           state.autoRollCounterPartyAssetAmountWithPremium = state.autoRollDepositAssetAmount + state.autoRollDepositAssetPremiumAmount;

        }
         return state;
     }

    function updateUserState(StructureData.UserState storage userState) external {
         if (userState.assetToTerminateForNextRound != 0){ 
                userState.assetToTerminate = userState.assetToTerminateForNextRound;
                userState.assetToTerminateForNextRound = 0;
            } 
            else if (userState.assetToTerminate != 0){
                userState.assetToTerminate = 0;
            }            
            if(userState.tempLocked == 0) {  
                userState.ongoingAsset = 0;
                return;
            } 
            //transfer each user a share of the option to trigger transfer event
            //can be used to calculate the user option selling operations
            //utilizing some web3 indexed services, take etherscan api/graphql etc.
            //_transfer(address(this), userAddress, userState.tempLocked);
            //emit OptionTransfer(_optionId, userAddress, optionState.premiumRate, optionState.round);
            userState.ongoingAsset = userState.tempLocked; 
            userState.tempLocked = 0; 
    }
 
    function add(uint128 a, uint128 b) internal pure returns (uint128) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint128 a, uint128 b) internal pure returns (uint128) {
        return a - b;
    }
    struct OptionPairDefinition{
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
 
        uint16 round;
        uint8 optionId; 
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
        uint8 pairId;
        OptionExecution execute; 
    }

    

    struct SettlementCashflowResult{ 
        uint128 newDepositAmount;
        uint128 newReleasedAmount;
        int128 leftOverAmount; //positive, if trader didn't withdraw last time; negative, if trader failed to send back last time; 
        address contractAddress; //0 for eth 
    }
 
}