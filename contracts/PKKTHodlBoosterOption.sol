// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
import {StructureData} from "./libraries/StructureData.sol";  
import "./PKKTStructureOption.sol"; 
import "hardhat/console.sol";
contract PKKTHodlBoosterOption is PKKTStructureOption {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;  

  constructor(
        string memory name,
        string memory symbol,
        address _underlying,
        address _stableCoin,
        uint8 _underlyingDecimals,
        uint8 _stableCoinDecimals
    ) PKKTStructureOption(name, symbol, _underlying, _stableCoin, _underlyingDecimals, _stableCoinDecimals) {  
          
    }

     function _calculateMaturity(uint256 _underlyingPrice, StructureData.OptionState memory _optionState) internal override
     returns(uint256 maturedAssetAmount, uint256 maturedStableCoinAmount, bool executed) {
        maturedAssetAmount = 0;
        maturedStableCoinAmount = 0;
        uint256 multipler = uint256(10**4).add(_optionState.interestRate);
        bool shouldConvert = _optionState.strikePrice > _underlyingPrice; 
        if (shouldConvert) { 
           maturedStableCoinAmount = 
           _optionState.totalAmount.mul(_optionState.strikePrice).mul(multipler).mul(10**stableCoinAmountDecimals).
           div(10**4).div(10**_optionState.pricePrecision);
        }
        else {
          maturedAssetAmount = _optionState.totalAmount.mul(multipler).div(10**4);
        }


        uint256 userCount = ongoingUserAddresses.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = ongoingUserAddresses[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if (!shouldConvert) { 
                uint256 assetAmount = maturedAssetAmount.mul(userState.ongoingAsset).div(_optionState.totalAmount);
                //todo: record to vault
            }
            else {  
               uint256 stableCoinAmount = maturedStableCoinAmount.mul(userState.ongoingAsset).div(_optionState.totalAmount);
               //todo: record to vault
            } 
         }
         return (maturedAssetAmount, maturedStableCoinAmount, shouldConvert);
     }
}