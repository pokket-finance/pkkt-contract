// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  
interface IExecuteSettlement {
 
   //calculate the result of on going option    
   function closePrevious(uint256 _underlyingPrice) external;

   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent() external; 

    //open a new option
   function rollToNext(StructureData.OptionParameters memory _optionParameters) external; 

}
