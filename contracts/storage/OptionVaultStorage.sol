// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {StructureData} from "../libraries/StructureData.sol"; 
abstract contract OptionVaultStorageV1 { 
    uint256 internal locked;
    address public managerRoleAddress;
    uint8 public vaultCount;  
    uint8 internal assetCount;
 
    mapping(uint8 => StructureData.VaultDefinition) public vaultDefinitions;
    mapping(uint8 => address) internal assets;
  
    mapping(uint8 => StructureData.VaultState) internal vaultStates;
    mapping(uint8 => mapping(uint16 => StructureData.SoldVaultState)) internal soldVaultStates;

    mapping(address => StructureData.OptionBuyerState) internal buyerStates;
 
     
}

abstract contract OptionVaultStorage is OptionVaultStorageV1 {
    mapping(address=>bool) internal whitelist;
    mapping(uint8 => address) internal traders;
    uint8 internal traderCount;
}