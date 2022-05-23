// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4; 
import {StructureData} from "../libraries/StructureData.sol";

interface IDOVOption {
  

    //deposit eth
    function depositETH(uint8 _vaultId) external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint8 _vaultId, uint256 _amount) external;

    //complete withdraw happens on the option vault
    function initiateWithraw(uint8 _vaultId, uint256 _redeemAmount) external; 

    function cancelWithdraw(uint8 _vaultId, uint256 _redeemAmount) external;
 
    
    function withdraw(uint8 _vaultId, uint256 _amount, address _asset) external; 
 
 
 
 
}

