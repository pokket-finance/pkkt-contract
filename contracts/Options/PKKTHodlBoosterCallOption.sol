// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
import {StructureData} from "../libraries/StructureData.sol";  
import "./PKKTHodlBoosterOption.sol"; 
import "hardhat/console.sol";
contract PKKTHodlBoosterCallOption is PKKTHodlBoosterOption {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;  
    using StructureData for StructureData.UserState;

   function initialize(
      string memory name,
      string memory symbol,
      address _underlying,
      address _stableCoin,
      uint8 _underlyingDecimals,
      uint8 _stableCoinDecimals,
      address _vaultAddress
    ) public initializer {
      PKKTHodlBoosterOption.initialize(
         name,
         symbol,
         _underlying,
         _stableCoin,
         _underlyingDecimals,
         _stableCoinDecimals, 
         _vaultAddress,
         true
      );
   }

     function _calculateMaturity(bool _execute, StructureData.OptionState memory _optionState) internal override
     returns(StructureData.MaturedState memory) {
       StructureData.MaturedState memory state = StructureData.MaturedState({
          maturedDepositAssetAmount: 0,
          maturedCounterPartyAssetAmount: 0,
          executed: _execute,
          round: _optionState.round
       }); 
        uint256 multipler = uint256(RATIOMULTIPLIER).add(_optionState.premiumRate); 
        if (_execute) {  
           state.maturedCounterPartyAssetAmount = _optionState.totalAmount.mul(_optionState.strikePrice).
           mul(multipler).mul(10**counterPartyAssetAmountDecimals).
           div(RATIOMULTIPLIER).div(10**(_optionState.pricePrecision + depositAssetAmountDecimals)); 
        }
        else {
           state.maturedDepositAssetAmount = _optionState.totalAmount.mul(multipler).div(RATIOMULTIPLIER);

        }
 
        uint256 userCount = usersInvolved.length; 
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            //since the onGoingAsset for current round is not filled yet, we make 5 instead of 6 backward
            uint256 ongoingAsset = userState.GetOngoingAsset(StructureData.MATUREROUND - 1);  
            if (ongoingAsset == 0) {
               pendingMaturedCounterPartyAssetAmount[userAddress] = 
               pendingMaturedDepositAssetAmount[userAddress] = 0;
               continue;
            }
            if (_execute) {  
               uint256 stableCoinAmount = state.maturedCounterPartyAssetAmount.mul(ongoingAsset).div(_optionState.totalAmount);
               pendingMaturedCounterPartyAssetAmount[userAddress] = stableCoinAmount; 
               pendingMaturedDepositAssetAmount[userAddress] = 0;
            }
            else {  
                uint256 assetAmount = state.maturedDepositAssetAmount.mul(ongoingAsset).div(_optionState.totalAmount);
                pendingMaturedDepositAssetAmount[userAddress] = assetAmount;   
                pendingMaturedCounterPartyAssetAmount[userAddress] = 0;
            } 
         }
         return state;
     }
}