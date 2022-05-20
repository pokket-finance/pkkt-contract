// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
//import "hardhat/console.sol";

import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import {OptionVaultStorage} from "./storage/OptionVaultStorage.sol";
import "./interfaces/IOptionVaultManager.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract OptionVaultManager is
    OptionVaultStorage, 
    IOptionVaultManager
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Utils for uint256;
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice 7 day period between each options sale.
    uint256 public constant PERIOD = 7 days;
  
    function setManagerInternal(address _mananger) internal { 
        managerRoleAddress = _mananger; 
    }  

    function addOptionsInternal(
        StructureData.OptionDefition[] memory _optionDefitions
    ) internal { 
        uint256 length = _optionDefitions.length;
        uint8 optionCount_ = optionCount;
        uint8 assetCount_ = assetCount;
        for (uint256 i = 0; i < length; i++) {
            StructureData.OptionDefition
                memory option = _optionDefitions[i]; 
            option.optionId = optionCount_;
            options[optionCount_++] = option;
        }
        optionCount = optionCount_;
    }

   //only needed for the initial kick off
    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external override managerOnly {
         for (uint8 i = 0; i < _kickoffs.length; i++){
             StructureData.KickOffOptionParameters kickoff = _kickoffs[i];
             StructureData.OptionData storage data = optionData[kickoff.optionId];
             require(data.cutOffAt <= block.timestamp, "already kicked off"); 
             //todo: number manuipulation
             
             data.cutOffAt = block.timestamp + PERIOD;
             data.currentRound = 1;
             //todo: do we need to check 0?
             data.maxCapacity = _kickoff.maxCapacity;
         }
    }
 
    //parameters for option to sell, todo: whitelist
    function sellOptions(StructureData.CutOffOptionParameters[] memory _cutoff) 
    external override managerOnly{
        for (uint8 i = 0; i < _cutoff.length; i++){
             StructureData.CutOffOptionParameters cutoff = _cutoff[i];
             require(cutoff.premiumRate > 0, "!premium");
             require(cutoff.strike > 0, "!strike"); 
             StructureData.OptionData storage data = optionData[cutoff.optionId]; 
             require(data.strike == 0, "already been cut off"); 
             data.strike = cutoff.strike;
             data.premiumRate = cutoff.premiumRate;
         }
    }  
    function buyOptions(uint8[] memory _optionIds) payable external override lock{
        uint256 ethToSend = 0;
        for (uint8 i = 0; i < _optionIds.length; i++){
             StructureData.OptionData storage data = optionData[_optionIds[i]];
             require(data.totalToSell > 0, "Nothing to sell");
             require(data.soldToAddress == address(0), "Already sold"); 
             uint256 premium = data.totalToSell.premium(data.premiumRate); 
             address asset = optionDefinitions[_optionIds[i]].asset;
             if (asset == address(0)) {
                 ethToSend = ethToSend.add(premium);
             }
             else{

               IERC20(asset).safeTransferFrom(
                msg.sender,
                address(this),
                premium);
             }
             data.buyerAddress = msg.sender; 
         }
         require(ethToSend >= msg.value, "Not enough eth");
         //transfer back extra
         if (ethToSend > msg.value) { 
            msg.sender.transfer(ethToSend-msg.value); 
         }
    }

    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expired)
        external override managerOnly
    { 
        
        for (uint8 i = 0; i < _expired.length; i++){
             StructureData.ExpiredOptionParameters expired = _expired[i];
             StructureData.OptionData storage data = optionData[_expired.optionId];
             require(data.strike > 0, "No strike");
             require(expired.expiryLevel > 0, "No expiryLevel");

             
             uint256 diff = data.callOrPut ? 
             (expired.expiryLevel > data.strike ?  expired.expiryLevel - data.strike : 0) : 
              (data.strike > expired.expiryLevel ? data.strike - expired.expiryLevel : 0);
             data.buyerAddress = address(0);
             
              //can be withdrawn by trader 
             StructureData.OptionBuyerState buyerState = buyerData[data.buyerAddress];
             buyerState[data.asset] = buyerState[data.asset].add(data.totalToExpire.mul(diff).div(expired.expiryLevel));
         }
        
    }

    
    function collectOptionHolderValues() external lock { 
        StructureData.OptionBuyerState buyerState = buyerData[msg.sender];  
        for (uint8 i = 0; i < optionCount; i++){
             address asset = optionData[i].asset;
             uint256 assetAmount = buyerState[asset];
             if (assetAmount > 0) {
                 buyerState[asset] = 0;
                 OptionLifecycle.withdraw(msg.sender, assetAmount, asset);
             }
         } 
    }
    modifier lock {
        require(locked == 0, "locked");
        locked = 1;
        _;
        locked = 0;
    }
    modifier managerOnly() {
         require(managerRoleAddress == msg.sender, "!manager"); 
         _;
    } 
}
