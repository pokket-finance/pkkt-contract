// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
import {StructureData} from "../libraries/StructureData.sol";  
import "./PKKTHodlBoosterOption.sol"; 
import "hardhat/console.sol";
contract PKKTHodlBoosterPutOption is PKKTHodlBoosterOption {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;  
    using StructureData for StructureData.UserState;

  constructor(
        string memory name,
        string memory symbol,
        address _underlying,
        address _stableCoin,
        uint8 _underlyingDecimals,
        uint8 _stableCoinDecimals,
        address _vaultAddress
    ) PKKTHodlBoosterOption(name, symbol, _stableCoin, _underlying,_stableCoinDecimals, _underlyingDecimals,  _vaultAddress, true) {  
          
    }

   
     function _calculateMaturity(uint256 _underlyingPrice, StructureData.OptionState memory _optionState) internal override
     returns(StructureData.MaturedState memory) {
       StructureData.MaturedState memory state = StructureData.MaturedState({
          maturedDepositAssetAmount: 0,
          maturedCounterPartyAssetAmount: 0,
          executed: false,
          round: _optionState.round
       }); 
        uint256 multipler = uint256(RATIOMULTIPLIER).add(_optionState.interestRate); 
        bool shouldConvert = _optionState.strikePrice > _underlyingPrice; 
        state.executed = shouldConvert; 
        if (shouldConvert) {  
           state.maturedCounterPartyAssetAmount = _optionState.totalAmount.
           mul(multipler).mul(10**(_optionState.pricePrecision + counterPartyAssetAmountDecimals)).div(_optionState.strikePrice).
           div(RATIOMULTIPLIER).div(10** depositAssetAmountDecimals); 
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
            if (shouldConvert) {  
               uint256 assetCoinAmount = state.maturedCounterPartyAssetAmount.mul(ongoingAsset).div(_optionState.totalAmount);
               pendingMaturedCounterPartyAssetAmount[userAddress] = assetCoinAmount;  
               pendingMaturedDepositAssetAmount[userAddress] = 0;
            }
            else {   
                uint256 stableCoinAmount = state.maturedDepositAssetAmount.mul(ongoingAsset).div(_optionState.totalAmount);
                pendingMaturedDepositAssetAmount[userAddress] = stableCoinAmount;  
                pendingMaturedCounterPartyAssetAmount[userAddress] = 0;
            } 
         }
         return state;
     }
}