// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";

interface IOptionVault { 
    function addOption(address _optionContract) external;
    function removeOption(address _optionContract) external;
    function getAddress() external view returns(address);
    function withdraw(address _target, uint256 _amount, address _contractAddress) external;

    function prepareSettlement() external;
    
    function setCommittedState(StructureData.OptionState memory _currentState, address _depositAsset, address _counterPartyAsset)  external;   
    function setMaturityState(StructureData.MaturedState memory _maturedState, address _depositAsset, address _counterPartyAsset) external; 
    
    function startSettlement(address _traderAddress) external;
    function finishSettlement() external;

    function allSettled() external view returns(bool);

    
    
}
