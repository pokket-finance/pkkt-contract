// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;

interface IOptionVault { 
    function getAddress() external returns(address);
    function withdraw(address _target, uint256 _amount, address _contractAddress) external;
    
}
