// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface ISettlementAggregator {
         
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) external; 
    function currentRound() external view returns(uint16);
    //rollToNext + dryRunSettlement
    //todo: specifying quota
    function initiateSettlement() external; 

    //closePrevious + calculate cash flow 
    function settle(StructureData.OptionPairExecution[] memory _execution) external;

    function setOptionParameters(StructureData.OptionParameters[] memory _paramters) external;

    function withdrawAsset(address _trader, address _asset) external;

    function balanceEnough(address _asset) external view returns(bool); 
}