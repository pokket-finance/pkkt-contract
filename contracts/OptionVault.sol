// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";      
import "./interfaces/IOptionVault.sol"; 

contract OptionVault is IOptionVault, AccessControl {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");

    constructor() {
       // Contract deployer will be able to grant and revoke option role
       _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
    }
    
    function addOption(address _optionContract) external override onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(OPTION_ROLE, _optionContract); 
    }

    function removeOption(address _optionContract) external override onlyRole(DEFAULT_ADMIN_ROLE){
        revokeRole(OPTION_ROLE, _optionContract); 
    }
    function getAddress() external view override returns(address){
        return address(this);
    }

    
    //todo: check balance
    function withdraw(address _target, uint256 _amount, address _contractAddress) external override onlyRole(OPTION_ROLE){
        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        }
        else { 
            IERC20(_contractAddress).safeTransfer(_target, _amount); 
        }
    }

    
    event Received(address, uint);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}