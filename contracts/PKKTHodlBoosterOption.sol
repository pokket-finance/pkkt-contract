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
     returns(uint256 _maturedAssetAmount, uint256 _maturedStableCoinAmount, bool _executed) {
        _maturedAssetAmount = 0;
        _maturedStableCoinAmount = 0;
        uint256 multipler = uint256(RATIOMULTIPLIER).add(_optionState.interestRate);
        bool shouldConvert = _optionState.strikePrice < _underlyingPrice; 
        
       //console.log("%s %d %d", name(), _optionState.strikePrice, _underlyingPrice);
        if (shouldConvert) { 
           _maturedStableCoinAmount = 
           _optionState.totalAmount.mul(_optionState.strikePrice).mul(multipler).mul(10**stableCoinAmountDecimals).
           div(RATIOMULTIPLIER).div(10**_optionState.pricePrecision);
          //console.log("%s %d", name(),maturedStableCoinAmount);
        }
        else {
          _maturedAssetAmount = _optionState.totalAmount.mul(multipler).div(RATIOMULTIPLIER);
          
          //console.log("%s %d", name(),maturedAssetAmount);
        }

        uint256 userCount = ongoingUserAddresses.length; 
        for (uint i=0; i < userCount; i++) {
            address userAddress = ongoingUserAddresses[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if (!shouldConvert) { 
                uint256 assetAmount = _maturedAssetAmount.mul(userState.ongoingAsset).div(_optionState.totalAmount);
                maturedAsset[userAddress] = maturedAsset[userAddress].add(assetAmount);  
            }
            else {  
               uint256 stableCoinAmount = _maturedStableCoinAmount.mul(userState.ongoingAsset).div(_optionState.totalAmount);
               maturedStableCoin[userAddress] = maturedStableCoin[userAddress].add(stableCoinAmount);
                
            } 
         }
         return (_maturedAssetAmount, _maturedStableCoinAmount, shouldConvert);
     }
}