// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {StructureData} from "../libraries/StructureData.sol"; 
abstract contract OptionVaultStorageV1 { 
    uint256 internal locked;
    address public managerRoleAddress;
    address public adminRoleAddress;
    uint8 public optionPairCount;
    uint8 internal assetCount;
    uint16 public currentRound;
    bool public underSettlement;

    mapping(address => StructureData.SettlementCashflowResult)
        public settlementCashflowResult; 
    mapping(address => StructureData.AssetData) internal assetData;

    mapping(uint8 => StructureData.OptionPairDefinition) public optionPairs;

    mapping(uint8 => StructureData.OptionPairExecutionAccountingResult)
        public executionAccountingResult; 

    mapping(uint8 => StructureData.OptionData) internal optionData;
    mapping(uint8 => address) internal asset;
    
}

abstract contract OptionVaultStorage is OptionVaultStorageV1 {

}