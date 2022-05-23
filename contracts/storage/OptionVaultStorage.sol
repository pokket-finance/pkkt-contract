// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {StructureData} from "../libraries/StructureData.sol"; 
abstract contract OptionVaultStorageV1 { 
    uint256 internal locked;
    address public managerRoleAddress;
    uint8 internal vaultCount;  
 
    mapping(uint8 => StructureData.VaultDefinition) public vaultDefinitions;
  
    mapping(uint8 => StructureData.VaultState) internal vaultStates;

    mapping(address => StructureData.OptionBuyerState) internal buyerStates;
 
     
}

abstract contract OptionVaultStorage is OptionVaultStorageV1 {

}