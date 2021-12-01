// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {IMaturedVault} from "./IMaturedVault.sol";
import {StructureData} from "../libraries/StructureData.sol";

interface IExecuteSettlement {

   function setMaturedVault(IMaturedVault _vault) external;
   //calculate the maturity   
   function closePrevious(uint256 _underlyingPrice, uint256 _pricePrecision) external;

   //close pending vault and autoroll if capacity is enough based on the maturity result
   function commitCurrent(address _traderAddress) external; 

   function rollToNext(StructureData.VaultParameters memory _vaultParameters) external;

   
}
