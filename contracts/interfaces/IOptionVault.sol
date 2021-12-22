// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";

interface IOptionVault { 
    function addOption(address _optionContract) external;
    function removeOption(address _optionContract) external;
    function getAddress() external view returns(address);
    function withdraw(address _target, uint256 _amount, address _contractAddress) external;
     
}
