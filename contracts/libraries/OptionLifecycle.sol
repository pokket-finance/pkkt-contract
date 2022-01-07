// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";  
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import "./Utils.sol";
import "./StructureData.sol";

library OptionLifecycle {
    
    using SafeERC20 for IERC20;
    using Utils for uint128;
    using Utils for uint256;
    using SafeMath for uint256;
    using StructureData for StructureData.UserState;

    function deriveWithdrawRequest(StructureData.UserState memory userState, uint256 premiumRate) internal pure returns (uint128 _onGoingRoundAmount, uint128 _lockedRoundAmount) {
       if (userState.tempLocked == 0) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       uint128 onGoing = userState.ongoingAsset;
       if (onGoing == 0) {
           return (0, userState.assetToTerminateForNextRound);
       } 
       uint128 virtualOnGoing = (onGoing - userState.assetToTerminate).withPremium(premiumRate);
       if (userState.assetToTerminateForNextRound <= virtualOnGoing) {
           return (userState.assetToTerminateForNextRound, 0);
       }
       else {
           return (virtualOnGoing, userState.assetToTerminateForNextRound - virtualOnGoing);
       }
    }

    function deriveVirtualLocked(StructureData.UserState memory userState, uint16 premiumRate) internal pure returns (uint128) {
        uint128 onGoing = userState.ongoingAsset;
        if (onGoing == 0) {
            return userState.tempLocked;
        }
        onGoing = (onGoing - userState.assetToTerminate).withPremium(premiumRate);
        if (userState.tempLocked == 0) {
            return onGoing;
        }
        return userState.tempLocked + onGoing;
        
    }

    function getAvailableBalance(address _asset, address _source) external view returns(uint256) {
       if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(_source); 
       }
       else{
          return _source.balance;
       }
    }

    function withdraw(address _target, uint256 _amount, address _contractAddress) external {
        require(_amount > 0);
        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        }
        else { 
            IERC20(_contractAddress).safeTransfer(_target, _amount); 
        }
    }  

     function calculateMaturity(bool _execute, StructureData.OptionState memory _optionState, bool _callOrPut, 
     uint8 _depositAssetAmountDecimals, uint8 _counterPartyAssetAmountDecimals) public  pure
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
           (10**(StructureData.PRICE_PRECISION + _depositAssetAmountDecimals))  :  

            uint256(_optionState.totalAmount).mul(10**(StructureData.PRICE_PRECISION + _counterPartyAssetAmountDecimals)).div( 
            uint256(_optionState.strikePrice)).div(10** _depositAssetAmountDecimals)); 
 
           uint128 maturedCounterPartyAssetPremiumAmount = maturedCounterPartyAssetAmount.premium(_optionState.premiumRate); 
           if (_optionState.totalTerminate > 0) { 
               state.releasedCounterPartyAssetAmount = maturedCounterPartyAssetAmount.getAmountToTerminate(_optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetPremiumAmount = maturedCounterPartyAssetPremiumAmount.getAmountToTerminate( _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetAmountWithPremium = state.releasedCounterPartyAssetAmount + state.releasedCounterPartyAssetPremiumAmount;
           }
           state.autoRollCounterPartyAssetAmount = maturedCounterPartyAssetAmount - state.releasedCounterPartyAssetAmount;
           state.autoRollCounterPartyAssetPremiumAmount = maturedCounterPartyAssetPremiumAmount - state.releasedCounterPartyAssetPremiumAmount;
           state.autoRollCounterPartyAssetAmountWithPremium = state.autoRollCounterPartyAssetAmount + state.autoRollCounterPartyAssetPremiumAmount;
        }
        else { 
           uint128 maturedDepositAssetAmount = _optionState.totalAmount;
           uint128 maturedDepositAssetPremiumAmount = maturedDepositAssetAmount.premium(_optionState.premiumRate);
           if (_optionState.totalTerminate > 0) { 
               state.releasedDepositAssetAmount = maturedDepositAssetAmount.getAmountToTerminate(_optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetPremiumAmount = maturedDepositAssetPremiumAmount.getAmountToTerminate(_optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetAmountWithPremium = state.releasedDepositAssetAmount + state.releasedDepositAssetPremiumAmount;
           }
           state.autoRollDepositAssetAmount = maturedDepositAssetAmount - state.releasedDepositAssetAmount;
           state.autoRollDepositAssetPremiumAmount = maturedDepositAssetPremiumAmount - state.releasedDepositAssetPremiumAmount;
           state.autoRollCounterPartyAssetAmountWithPremium = state.autoRollDepositAssetAmount + state.autoRollDepositAssetPremiumAmount;

        }
         return state;
     }
 
    function commitByOption(StructureData.OptionData storage _option, uint16 _roundToCommit) external {
            
            uint256 userCount = _option.usersInvolved.length;
            for (uint i=0; i < userCount; i++) {
                 StructureData.UserState storage userState = _option.userStates[_option.usersInvolved[i]];
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
            
            _option.optionStates[_roundToCommit].totalTerminate = _option.optionStates[_roundToCommit].totalTerminate.add(_option.assetToTerminateForNextRound); 
            _option.assetToTerminateForNextRound = 0;         
    }

   function rollToNextByOption(StructureData.OptionData storage _option, uint16 _currentRound, bool _callOrPut) external returns(uint128 _pendingAmount){    
      
       //if (currentRound > 2) {
        //   require(optionStates[_optionId][currentRound-2].strikePrice > 0,  "!StrikePrice");
        //}  
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: _currentRound,
                            totalAmount: 0,
                            totalTerminate: 0,
                            premiumRate:  0, 
                            strikePrice: 0,
                            executed: false,
                            callOrPut: _callOrPut
                        });
        _option.optionStates[_currentRound] = currentOption; 
       if (_currentRound > 1) {
                
            uint256 userCount = _option.usersInvolved.length;
            for (uint i=0; i < userCount; i++) { 
                StructureData.UserState storage userState = _option.userStates[_option.usersInvolved[i]]; 
                if(userState.pendingAsset != 0) {  
                    userState.tempLocked = userState.pendingAsset;   
                }   
                userState.pendingAsset = 0;
            }
       } 
       //emit OpenOption(_optionId, currentRound); 
       return _currentRound > 1 ? _option.optionStates[_currentRound-1].totalAmount : 0;
    }

   function dryRunSettlementByOption(StructureData.OptionData storage _option, uint8 _optionId, 
   bool _isCall, uint8 _depositAssetAmountDecimals,  uint8 _counterPartyAssetAmountDecimals, 
   uint16 _currentRound, bool _execute) external view returns(StructureData.SettlementAccountingResult memory _result) {
   
        StructureData.SettlementAccountingResult memory result = StructureData.SettlementAccountingResult({ 
            round: _currentRound - 1,
            depositAmount:  _option.optionStates[_currentRound - 1].totalAmount,
            executed: _execute,
            autoRollAmount: 0,
            autoRollPremium: 0,
            releasedAmount: 0,
            releasedPremium: 0,
            autoRollCounterPartyAmount: 0,
            autoRollCounterPartyPremium: 0,
            releasedCounterPartyAmount: 0,
            releasedCounterPartyPremium: 0, 
            optionId: _optionId
        });
       if (_currentRound > 2) { 
             
            StructureData.OptionState storage previousOptionState =  _option.optionStates[_currentRound - 2];
            StructureData.MaturedState memory maturedState = calculateMaturity(_execute, previousOptionState, _isCall,
            _depositAssetAmountDecimals, _counterPartyAssetAmountDecimals); 
            if (_execute) { 
                result.autoRollCounterPartyAmount = maturedState.autoRollCounterPartyAssetAmount;
                result.autoRollCounterPartyPremium = maturedState.autoRollCounterPartyAssetPremiumAmount;
                result.releasedCounterPartyAmount = maturedState.releasedCounterPartyAssetAmount;
                result.releasedCounterPartyPremium = maturedState.releasedCounterPartyAssetPremiumAmount;
            }
            else { 
                result.autoRollAmount = maturedState.autoRollDepositAssetAmount;
                result.autoRollPremium = maturedState.autoRollDepositAssetPremiumAmount;
                result.releasedAmount = maturedState.releasedDepositAssetAmount;
                result.releasedPremium = maturedState.releasedDepositAssetPremiumAmount;
            } 
       } 
       return result;
   }

    function getAccountBalance(StructureData.OptionData storage _option, address _user, bool _underSettlement, uint16 _currentRound) external view
    returns(StructureData.UserBalance memory) {

      StructureData.UserState storage userState = _option.userStates[_user];  

       StructureData.UserBalance memory result = StructureData.UserBalance({
           pendingDepositAssetAmount:userState.pendingAsset,
           releasedDepositAssetAmount: userState.releasedDepositAssetAmount,
           releasedCounterPartyAssetAmount: userState.releasedCounterPartyAssetAmount,
           lockedDepositAssetAmount:0,
           terminatingDepositAssetAmount: 0,
           toTerminateDepositAssetAmount: 0
       });
       if (_underSettlement) {  
           if (_currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex 
                uint16 premiumRate = _option.optionStates[_currentRound - 2].premiumRate;
                result.lockedDepositAssetAmount = deriveVirtualLocked(userState, premiumRate);
                result.terminatingDepositAssetAmount = userState.assetToTerminate.withPremium(premiumRate);
                result.toTerminateDepositAssetAmount = userState.assetToTerminateForNextRound;
          }
           else { 
                result.lockedDepositAssetAmount = userState.tempLocked;               
                result.toTerminateDepositAssetAmount = userState.assetToTerminateForNextRound;
           }
       }
       else {
           result.lockedDepositAssetAmount = userState.ongoingAsset;
           result.toTerminateDepositAssetAmount = userState.assetToTerminate;
       }
       return result;

    }

    function getOptionSnapShot( StructureData.OptionData storage _option, bool _underSettlement, uint16 _currentRound) external view returns(StructureData.OptionSnapshot memory) { 
         
       StructureData.OptionState memory lockedOption;
       StructureData.OptionState memory onGoingOption; 
       StructureData.OptionSnapshot memory result = StructureData.OptionSnapshot({
            totalPending: _option.optionStates[_currentRound].totalAmount,
            totalReleasedDeposit :  _option.totalReleasedDepositAssetAmount,
            totalReleasedCounterParty : _option.totalReleasedCounterPartyAssetAmount,
            totalLocked : 0,
            totalTerminating : 0,
            totalToTerminate: 0
       }); 
       if (_underSettlement) { 
           lockedOption = _option.optionStates[_currentRound - 1];
            result.totalToTerminate = _option.assetToTerminateForNextRound;
           if (_currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex
              onGoingOption = _option.optionStates[_currentRound - 2];
              result.totalTerminating = onGoingOption.totalTerminate.withPremium(onGoingOption.premiumRate); 
              result.totalLocked = lockedOption.totalAmount.add(  
                onGoingOption.totalAmount.withPremium(onGoingOption.premiumRate)).sub(result.totalTerminating);
           }
           else {
               result.totalLocked = lockedOption.totalAmount;  
           }
       }
       else if (_currentRound > 1) {
           onGoingOption = _option.optionStates[_currentRound - 1];
           result.totalLocked = onGoingOption.totalAmount;
           result.totalToTerminate = onGoingOption.totalTerminate;
       }
       return result;
    }


    function initiateWithrawStorage(StructureData.OptionData storage _option, address _user, uint128 _assetToTerminate,
     bool _underSettlement, uint16 _currentRound) external { 
        StructureData.UserState storage userState = _option.userStates[_user];   
        if (_underSettlement) {  
            uint128 newAssetToTerminate = userState.assetToTerminateForNextRound.add(_assetToTerminate); 
            if (_currentRound == 2) {
                require(newAssetToTerminate <=  userState.tempLocked); 
                StructureData.OptionState storage previousOption = _option.optionStates[_currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);  
            }
            else {
                StructureData.OptionState storage onGoingOption = _option.optionStates[_currentRound - 2];
                uint128 totalLocked = deriveVirtualLocked(userState, onGoingOption.premiumRate); 
                require(newAssetToTerminate <=  totalLocked);   
                //store temporarily
                _option.assetToTerminateForNextRound = _option.assetToTerminateForNextRound
                .add(_assetToTerminate); 
            } 
            userState.assetToTerminateForNextRound = newAssetToTerminate;
        }
        else {
            uint128 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate);
            require(newAssetToTerminate <=  userState.ongoingAsset);
            userState.assetToTerminate = newAssetToTerminate;
            StructureData.OptionState storage previousOption = _option.optionStates[_currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);
        } 
    }

    function cancelWithdrawStorage(StructureData.OptionData storage _option, address _user, uint128 _assetToTerminate,
     bool _underSettlement, uint16 _currentRound) external  {   
         StructureData.UserState storage userState = _option.userStates[_user];   
        if (_underSettlement) {  
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.sub(_assetToTerminate); 
            if (_currentRound == 2) {   
               StructureData.OptionState storage previousOption = _option.optionStates[_currentRound - 1];
                previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);  
            }
            else { 
                //store temporarily
                _option.assetToTerminateForNextRound = _option.assetToTerminateForNextRound.sub(_assetToTerminate); 
            }  
        }
        else {  
            userState.assetToTerminate = userState.assetToTerminate.sub( _assetToTerminate); 
            StructureData.OptionState storage previousOption = _option.optionStates[_currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);
        }

    } 
   
    function withdrawStorage(StructureData.OptionData storage _option, address _user, uint128 _amount, uint16 _currentRound, bool _isCounterParty) external  { 
       //require(_amount > 0, "!amount");    
       StructureData.UserState storage userState = _option.userStates[_user];  
       if (!_isCounterParty) {
           //todo: 0 out released amount if missing balance from trader
           uint128 releasedAmount = userState.releasedDepositAssetAmount;
           if (releasedAmount <= _amount) {  
               uint128 redeemAmount = _amount.sub(releasedAmount);
               userState.pendingAsset = userState.pendingAsset.sub(redeemAmount);
               userState.releasedDepositAssetAmount = 0; 
               _option.totalReleasedDepositAssetAmount = _option.totalReleasedDepositAssetAmount.sub(releasedAmount);
               StructureData.OptionState storage optionState = _option.optionStates[_currentRound];
               optionState.totalAmount = optionState.totalAmount.sub(redeemAmount);  
           }
           else { 
               userState.releasedDepositAssetAmount = releasedAmount.sub(_amount); 
               _option.totalReleasedDepositAssetAmount = _option.totalReleasedDepositAssetAmount.sub(_amount);
           }
       }
       else {
 
           //same result as completeWithdraw  
           userState.releasedCounterPartyAssetAmount = userState.releasedCounterPartyAssetAmount.sub(_amount);
           _option.totalReleasedCounterPartyAssetAmount = _option.totalReleasedCounterPartyAssetAmount.sub( _amount);
       } 
    }

   function depositFor( StructureData.OptionData storage _option, address _userAddress, uint128 _amount, uint128 _toTerminate, uint16 _round, bool _isOpenRound) external { 
        //require(optionState.totalAmount + (_amount) <= quota[_optionId], "Not enough quota");
         
       StructureData.OptionState storage optionState = _option.optionStates[_round];
       StructureData.UserState storage userState = _option.userStates[_userAddress];   
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            _option.usersInvolved.push(_userAddress);
        } 
        if (!_isOpenRound) { 
            userState.tempLocked = userState.tempLocked.add(_amount); 
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.add(_toTerminate);
            _option.assetToTerminateForNextRound = _option.assetToTerminateForNextRound.add(_toTerminate);
        }
        else { 
            userState.pendingAsset = userState.pendingAsset.add(_amount); 
        }
        optionState.totalAmount = optionState.totalAmount.add(_amount); 
    }


}