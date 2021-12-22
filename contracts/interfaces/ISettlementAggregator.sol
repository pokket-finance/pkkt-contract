// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface ISettlementAggregator {
         
    function addOptionPair(StructureData.OptionPairDefinition memory _pair) external;
    function removeOptionPair(StructureData.OptionPairDefinition memory _pair) external;

    //rollToNext + dryRunSettlement
    function initiateSettlement(bool _dryRun) external; 

    //closePrevious + calculate cash flow 
    function settle(StructureData.OptionPairExecution[] memory _execution) external;

    function commitCurrent(StructureData.OptionParameters[] memory _paramters) external;


}