// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface IOptionVaultManager {

    function addToWhitelist(address[] memory _whitelistAddresses) external;     
    function removeFromWhitelist(address[] memory _delistAddresses) external;
    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external;
    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expired) external;
    function collectOptionHolderValues() external;
    function optionHolderValues() external view returns(StructureData.CollectableValue[] memory);
    function sellOptions(StructureData.OnGoingOptionParameters[] memory _cutoff) external;
    function buyOptions(uint8[] memory _vaultIds) payable external;
}