// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {StructureData} from "../libraries/StructureData.sol"; 
abstract contract OptionVaultStorageV1 { 
    uint256 internal locked;
    address public managerRoleAddress;
    uint8 internal optionCount;
    uint16 public currentRound;
    bool public underSettlement;
 
    mapping(uint8 => StructureData.OptionDefinition) public optionDefinitions;
 
    mapping(uint8 => StructureData.OptionState) internal optionData;
    mapping(address => StructureData.OptionBuyerState) internal buyerData;
    
}

abstract contract OptionVaultStorage is OptionVaultStorageV1 {

}