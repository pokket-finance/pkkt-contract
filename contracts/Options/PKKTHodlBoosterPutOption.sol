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
         _stableCoin,
         _underlying,
         _stableCoinDecimals,
         _underlyingDecimals, 
         _vaultAddress,
         true
      );    
    }


}