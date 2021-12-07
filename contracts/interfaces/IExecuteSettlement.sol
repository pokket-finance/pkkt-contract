// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";

interface IExecuteSettlement {
 
   //calculate the result of on going option    
   function closePrevious(uint256 _underlyingPrice) external;

   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent(address _traderAddress) external; 

    //open a new option
   function rollToNext(StructureData.OptionParameters memory _optionParameters) external;
  
   function getRequest() external view returns(StructureData.Request[] memory);
   //finish the settlement once all requestedcoins are sent
   function finishSettlement() external;

   function allSettled() external view returns(bool);

}
