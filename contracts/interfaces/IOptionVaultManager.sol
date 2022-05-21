// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface IOptionVaultManager {
         
    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external;
    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expired) external;
    function collectOptionHolderValues() external;
    function sellOptions(StructureData.CutOffOptionParameters[] memory _cutoff) external;
    function buyOptions(uint8[] memory _optionIds) payable external;
}