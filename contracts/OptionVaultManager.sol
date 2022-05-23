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

  
    function setManagerInternal(address _mananger) internal { 
        managerRoleAddress = _mananger; 
    }  

    function addVaultsInternal(
        StructureData.VaultDefinition[] memory _vaultDefinitions
    ) internal { 
        uint256 length = _vaultDefinitions.length;
        uint8 vaultCount_ = vaultCount; 
        for (uint256 i = 0; i < length; i++) {
            StructureData.VaultDefinition
                memory vault = _vaultDefinitions[i]; 
            vault.vaultId = vaultCount_;
            vaultDefinitions[vaultCount_++] = vault;
        }
        vaultCount = vaultCount_;
    }

   //only needed for the initial kick off
    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external override managerOnly {
         for (uint8 i = 0; i < _kickoffs.length; i++){
             StructureData.KickOffOptionParameters kickoff = _kickoffs[i];
             StructureData.VaultState storage data = vaultStates[kickoff.vaultId];
             require(data.cutOffAt <= block.timestamp, "already kicked off"); 
             //todo: number manuipulation
             
             data.cutOffAt = block.timestamp + PERIOD;
             //todo: do we need to check 0?
             data.maxCapacity = _kickoff.maxCapacity;
         }
    }
 
    //parameters for option to sell, todo: whitelist
    function sellOptions(StructureData.OnGoingOptionParameters[] memory _ongoingParameters) 
        for (uint8 i = 0; i < _ongoingParameters.length; i++){
             StructureData.OnGoingOptionParameters ongoingParameters = _ongoingParameters[i];
             require(ongoingParameters.premiumRate > 0, "!premium");
             require(ongoingParameters.strike > 0, "!strike"); 
             StructureData.VaultState storage data = vaultStates[ongoingParameters.optionId];  
             OptionLifecycle.rollToNextRoundIfNeeded(data);  
             StructureData.OptionState storage onGoing = data.onGoing;
             require(onGoing.buyerAddress == address(0), "Already sold"); 
             onGoing.strike = ongoingParameters.strike; 
             onGoing.premiumRate = ongoingParameters.premiumRate;
         }
    }  

   //after buying by sending back the premium, the premium and strike can no longer be changed
    function buyOptions(uint8[] memory _vaultIds) payable external override lock{
        uint256 ethToSend = 0;
        for (uint8 i = 0; i < _vaultIds.length; i++){
            uint8 vaultId = _vaultIds[i];
             StructureData.VaultState storage data = vaultStates[vaultId];
             OptionLifecycle.rollToNextRoundIfNeeded(data);  
             StructureData.OptionState storage onGoing = data.onGoing;
             require(onGoing.amount > 0, "Nothing to sell");
             require(onGoing.buyerAddress == address(0), "Already sold"); 
             uint256 premium = onGoing.amount.premium(onGoing.premiumRate); 
             address asset = vaultDefinitions[vaultId].asset;
             if (asset == address(0)) {
                 ethToSend = ethToSend.add(premium);
             }
             else{

               IERC20(asset).safeTransferFrom(
                msg.sender,
                address(this),
                premium);
             }
             onGoing.buyerAddress = msg.sender;  
         }
         require(ethToSend >= msg.value, "Not enough eth");
         //transfer back extra
         if (ethToSend > msg.value) { 
            msg.sender.transfer(ethToSend-msg.value); 
         }
    }

    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expiryParameters)
        external override managerOnly
    { 
        
        for (uint8 i = 0; i < _expiryParameters.length; i++){
             StructureData.ExpiredOptionParameters expiryParameters = _expiryParameters[i];
             require(expiryParameters.expiryLevel > 0, "No expiryLevel"); 
             StructureData.VaultState storage data = vaultStates[expiryParameters.vaultId];
             OptionLifecycle.rollToNextRoundIfNeeded(data);
             StructureData.OptionState storage expired = data.expired;
             if (expired.totalAmount == 0) {
                 continue;
             } 

             require(expired.strike > 0, "No strike");
             address asset = vaultDefinitions[expiryParameters.vaultId].asset;
             uint256 diff = vaultDefinitions[expiryParameters.vaultId].callOrPut ? 
             (expiryParameters.expiryLevel > expired.strike ?  expiryParameters.expiryLevel - expired.strike : 0) : 
              (expired.strike > expiryParameters.expiryLevel ? expired.strike - expiryParameters.expiryLevel : 0);
             
              //can be withdrawn by trader 
             StructureData.OptionBuyerState buyerState = buyerStates[expired.buyerAddress];

             uint depositPriceAfterExpiry = diff.mul(10 ** OptionLifecycle.ROUND_PRICE_DECIMALS).div(expiryParameters.expiryLevel));
             data.depositPriceAfterExpiryPerRound[data.currentRound - 2] = depositPriceAfterExpiry;

             uint optionHolderValue = expired.amount.mul(diff).div(expiryParameters.expiryLevel);
             buyerState.optionValueToCollect[asset] = buyerState.optionValueToCollect[asset].add(optionHolderValue);

             uint remaining = expired.amount.withPremium(expired.premiumRate).sub(optionHolderValue);
             uint redeemed = remaining.mul(expired.queuedRedeemAmount).div(expired.amount);
             data.totalRedeemed = data.totalRedeemed.add(redeemed);

             data.onGoing.amount = data.onGoing.amount.add(remaining.sub(redeemed)); 
         }
        
    }

    
    function collectOptionHolderValues() external lock { 
        StructureData.OptionBuyerState buyerState = buyerStates[msg.sender];  
        for (uint8 i = 0; i < vaultCount; i++){
             address asset = vaultDefinitions[i].asset;
             uint256 assetAmount = buyerState.optionValueToCollect[asset];
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
