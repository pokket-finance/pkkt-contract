// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "hardhat/console.sol";

import {StructureData} from "./libraries/StructureData.sol";   
import "hardhat/console.sol";

//todo: use wrapped eth in the future for multiple chain
abstract contract PKKTStructure is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20; 
    StructureData.Parameters public parameters;
    IERC20 public underlying; 
    bool public isEth;
    bool public isSettelled;
    event Deposit(address indexed account, uint256 amount, bool fromWallet); 

    event InitiateWithdraw(address indexed account, uint256 amount);
    
    event CancelWithdraw(address indexed account, uint256 amount);

    event Redeem(address indexed account, uint256 amount);

    event CompleteWithdraw(address indexed account, uint256 amount);


    constructor(IERC20 _underlying) {
        underlying = _underlying;
        isEth = address(underlying) == address(0);
    }

    function depositETH() external payable {
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
        _depositFor(msg.value, msg.sender);
    }

    function deposit(uint256 _amount) external { 
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(_amount, msg.sender);
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), _amount);
    }
  
    function _depositFor(uint256 _amount, address _creditor) private {
        
        //todo:implement
        emit Deposit(_creditor, _amount, true);
    }

     
    function redeem(uint256 _amount) external {
        require(_amount > 0, "!amount");
        //todo:implement
        _redeem(_amount, false);
    }
 
    function maxRedeem() external {
        _redeem(0, true);
    }

 
    function _redeem(uint256 _amount, bool _isMax) internal {
        
        //todo:implement

        if (isEth) {
            payable(msg.sender).transfer(_amount);
        }
        else {
            
            IERC20(underlying).safeTransfer(msg.sender, _amount); 
        }
        emit Redeem(msg.sender, _amount); 
    }
  
    function initiateWithdraw(uint256 _amount) external {
        _initiateWithdraw(_amount, false);
   
    }
 
    function maxInitiateWithdraw() external {
        _initiateWithdraw(0, true);
    }

 
    function _initiateWithdraw(uint256 _amount, bool _isMax) internal {
        require(_amount > 0, "!amount"); 

        //todo:implement
        emit InitiateWithdraw(msg.sender, _amount);

    }
  
    function redeposit(uint256 _amount) external {
       
         _redeposit(_amount, false); 
    }

        
 
    function maxRedeposit() external {
         _redeposit(0, true); 
    } 
 
 
    function _redeposit(uint256 _amount, bool _isMax) internal {
       
        //todo:implement
        emit Deposit(msg.sender, _amount, false); 
    }

    function initiateSettlement(StructureData.Parameters memory _parameters) external onlyOwner {
        isSettelled = false;
        //todo: calculate here

        parameters = _parameters;
    }
    
    function finishSettlement() external onlyOwner {

        require(!isSettelled, "Settlement already finished");
        //todo
        isSettelled = true;
    }

}