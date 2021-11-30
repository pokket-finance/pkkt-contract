// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "../interfaces/IPKKTStructureVault.sol";
import "../interfaces/IExecuteSettlement.sol";
import "../interfaces/IMaturedVault.sol";

/*contract MockPKKTHodlVault is ERC20, IPKKTStructureVault, IExecuteSettlement, IMaturedVault {
    uint8 private _decimals;
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, supply);
    }

 
}*/