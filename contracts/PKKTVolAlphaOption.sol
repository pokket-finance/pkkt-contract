// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
import {StructureData} from "./libraries/StructureData.sol";  
import "./PKKTStructureVault.sol";
import "hardhat/console.sol";
contract PKKTVolAlphaVault is PKKTStructureVault {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    address public underlying;

  constructor(
        string memory name,
        string memory symbol,
        uint256 decimals,
        address _stableCoin, 
        address _underlying
    ) PKKTStructureVault(name, symbol, decimals, _stableCoin) {  
         underlying = _underlying;
    }
}