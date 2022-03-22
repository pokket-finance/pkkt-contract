// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {StructureData} from "../libraries/StructureData.sol"; 
abstract contract OptionVaultStorageV1 { 
    uint16 public currentRound;
    bool public underSettlement;
    uint8 public optionPairCount;
    uint8 internal assetCount;
    address internal settlerRoleAddress;
    uint256 internal locked;

    mapping(address => StructureData.SettlementCashflowResult)
        public settlementCashflowResult;

    mapping(uint8 => StructureData.OptionPairDefinition) public optionPairs;

    mapping(uint8 => StructureData.OptionPairExecutionAccountingResult)
        public executionAccountingResult;

    mapping(uint8 => StructureData.OptionData) internal optionData;
    mapping(uint8 => address) internal asset;
    mapping(address => StructureData.AssetData) internal assetData;
    
}

abstract contract OptionVaultStorage is OptionVaultStorageV1 {

}