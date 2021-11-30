// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";

interface IMaturedVault {

   function getBalance(address _assetContract) external returns(uint256); 

   function withdraw(uint256 _amount, address _assetContract) external;

   function deposit(uint256 _amount, address _assetContract, StructureData.VaultType _vaultType, StructureData.StableCoin _convertedCoin) external;
}
