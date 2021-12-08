// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";      
import "./interfaces/IOptionVault.sol"; 

contract OptionVault is IOptionVault, Ownable {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    function getAddress() external view override returns(address){
        return address(this);
    }

    //todo: check balance
    function withdraw(address _target, uint256 _amount, address _contractAddress) external override {
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