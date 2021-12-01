// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";


interface IStructurePool {
   

   function getBalance(address _assetContract) external returns(uint256); 

   function withdraw(uint256 _amount, address _assetContract) external;

}
