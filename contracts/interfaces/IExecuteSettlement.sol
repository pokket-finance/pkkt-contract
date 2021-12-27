// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  
interface IExecuteSettlement { 
 
    //open a new option
   function rollToNext(uint256 _quota) external returns(uint256 _pendingAmount); 
 
   //calculate the result of on going option    
   function closePrevious(bool _execute) external returns(StructureData.MaturedState memory _maturedState);

   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent() external ; 

   function setOptionParameters(StructureData.OptionParameters memory _optionParameters) external;
   
   function dryRunSettlement(bool _execute) external view returns(StructureData.SettlementAccountingResult memory _result);
}
