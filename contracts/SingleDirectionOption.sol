// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import "./interfaces/IDOVOption.sol";
import "./OptionVaultManager.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SingleDirectionOption is OptionVaultManager, IDOVOption {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeMath for uint256;
    using Utils for uint256;
    using OptionLifecycle for StructureData.UserState;
 

    modifier validateOptionById(uint8 _optionId) {
        require(_optionId != 0 && _optionId < optionCount);
        _;
    }


    function initiateWithraw(uint8 _optionId, uint256 _assetToTerminate)
        external
        override 
        validateOptionById(_optionId)
    {
        //require(_assetToTerminate > 0 , "!_assetToTerminate");
        //require(currentRound > 1, "No on going"); 
        OptionLifecycle.initiateWithrawStorage(
            optionData[_optionId],
            msg.sender,
            _assetToTerminate,
            underSettlement,
            currentRound
        );
    }

    function cancelWithdraw(uint8 _optionId, uint256 _assetToTerminate)
        external
        override
        validateOptionById(_optionId)
    {
        //require(_assetToTerminate > 0 , "!_assetToTerminate");
        //require(currentRound > 1, "No on going"); 

        OptionLifecycle.cancelWithdrawStorage(
            optionData[_optionId],
            msg.sender,
            _assetToTerminate
        );
    }
    
    //withdraw pending and expired amount
    function withdraw(
        uint8 _optionId,
        uint256 _amount
    ) external override 
        validateOptionById(_optionId) lock{
        address asset = optionDefinitions[_optionId].asset;  
        OptionLifecycle.withdrawStorage(
            optionData[_optionId],
            msg.sender,
            _amount);
        OptionLifecycle.withdraw(msg.sender, _amount, asset);
    }

    //deposit eth
    function depositETH(uint8 _optionId) external payable override 
        validateOptionById(_optionId){ 

        require(msg.value > 0, "no value"); 
        address asset = optionDefinitions[_optionId].asset; 
        require(asset == address(0), "!ETH");
        StructureData.OptionData storage data = optionData[_optionId];
        require(data.cutOffAt > 0, "!started");
        
        uint256 totalWithDepositedAmount = data.totalToSell.add(totalPending).add(msg.value); 
        require(totalWithDepositedAmount <= data.maxCapacity, "Exceeds cap");  
        OptionLifecycle.depositFor(
            data,
            msg.sender,
            msg.value);
  
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _optionId, uint256 _amount) external override 
        validateOptionById(_optionId){
        require(msg.value > 0, "no value"); 
        address asset = optionDefinitions[_optionId].asset; 
        require(asset != address(0), "ETH");
        StructureData.OptionData storage data = optionData[_optionId];
        require(data.cutOffAt > 0, "!started");
        
        uint256 totalWithDepositedAmount = data.totalToSell.add(totalPending).add(msg.value); 
        require(totalWithDepositedAmount <= data.maxCapacity, "Exceeds cap");  

        OptionLifecycle.depositFor(
            data,
            msg.sender); 
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
    }
 

}
