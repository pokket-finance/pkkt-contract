// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface IOptionVaultManager {
    //manager methods
    function addToWhitelist(address[] memory _whitelistAddresses) external;     
    function removeFromWhitelist(address[] memory _delistAddresses) external;
    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external;
    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expired) external;
    function sellOptions(StructureData.OnGoingOptionParameters[] memory _cutoff) external;
    function setCapacities(StructureData.CapacityParameters[] memory _capacities) external;
    //trader methods
    function collectOptionHolderValues() external;
    function optionHolderValues() external view returns(StructureData.CollectableValue[] memory);
    function expiredHistory() external view returns(StructureData.ExpiredVaultState[] memory);
    function buyOptions(uint8[] memory _vaultIds) payable external; 
    function whitelistTraders() external view returns(address[] memory);

    event OptionExpired(address indexed _buyerAddress,  uint8 _vaultId, uint256 _amount, uint128 _strike, 
    uint128 _expiryLevel, uint16 _premiumRate, uint256 _optionHolderValue, uint16 _currentRound);
}