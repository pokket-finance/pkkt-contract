// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface ISettlementAggregator {
         
    
    function toggleOptionPairDeposit(uint8 _pairId) external; 
    
    //rollToNext + dryRunSettlement
    //todo: specifying quota
    function initiateSettlement() external; 

    //closePrevious + calculate cash flow 
    function settle(StructureData.OptionExecution[] memory _execution) external;

    function setOptionParameters(uint256[] memory _paramters) external;

    function withdrawAssets() external;
    
    function sendBackAssets() payable external;

    function balanceEnough(address _asset) external view returns(bool); 

    function getMoneyMovements() external view returns(StructureData.MoneyMovementResult[] memory);
}