// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface ISettlementAggregator {
         
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) external; 

    function toggleOptionPairDeposit(uint8 _pairId) external;
    
    function currentRound() external view returns(uint16);
    //rollToNext + dryRunSettlement
    //todo: specifying quota
    function initiateSettlement() external; 

    //closePrevious + calculate cash flow 
    function settle(StructureData.OptionExecution[] memory _execution) external;

    function setOptionParameters(uint256[] memory _paramters) external;

    function withdrawAsset(address _trader, address _asset) external;

    function batchWithdrawAssets(address _trader, address[] memory _assets) external;

    function balanceEnough(address _asset) external view returns(bool); 
}