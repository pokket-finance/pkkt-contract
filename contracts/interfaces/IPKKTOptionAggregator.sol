// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
import "./IPKKTStructureOption.sol";
 
interface IPKKTOptionAggregator {
     
    function addOption(IPKKTStructureOption _option) external;
    function getRequests() external view returns(StructureData.Request[] memory);
    function finishSettlement() external;
 
}