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

  
    function setManagerInternal(address _manager) internal { 
        require(_manager != address(0), "!manager");
        managerRoleAddress = _manager; 
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
         for (uint256 i = 0; i < _kickoffs.length; i++){
             StructureData.KickOffOptionParameters memory kickoff = _kickoffs[i];
             StructureData.VaultState storage data = vaultStates[kickoff.vaultId];
             require(data.cutOffAt <= block.timestamp, "already kicked off");  
             
             data.cutOffAt = uint32(block.timestamp.add(OptionLifecycle.PERIOD));
             data.maxCapacity = kickoff.maxCapacity;
         }
    }
 
    //parameters for option to sell, todo: whitelist
    function sellOptions(StructureData.OnGoingOptionParameters[] memory _ongoingParameters) external override{
        for (uint256 i = 0; i < _ongoingParameters.length; i++){
             StructureData.OnGoingOptionParameters memory ongoingParameters = _ongoingParameters[i];
             require(ongoingParameters.premiumRate > 0, "!premium");
             require(ongoingParameters.strike > 0, "!strike"); 
             StructureData.VaultState storage data = vaultStates[ongoingParameters.vaultId];  
             OptionLifecycle.rollToNextRoundIfNeeded(data);
             require(data.currentRound > 1, "No selling round"); 
             StructureData.OptionState storage onGoing = data.onGoing;
             require(onGoing.buyerAddress == address(0), "Already sold"); 
             onGoing.strike = ongoingParameters.strike; 
             onGoing.premiumRate = ongoingParameters.premiumRate;
         }
    }  

   //after buying by sending back the premium, the premium and strike can no longer be changed
   //todo: whitelist check
    function buyOptions(uint8[] memory _vaultIds) payable external override lock{
        uint256 ethToSend = 0;
        for (uint256 i = 0; i < _vaultIds.length; i++){
            uint8 vaultId = _vaultIds[i];
             StructureData.VaultState storage data = vaultStates[vaultId];
             OptionLifecycle.rollToNextRoundIfNeeded(data);  
             StructureData.OptionState storage onGoing = data.onGoing;
             require(onGoing.amount > 0, "Nothing to sell");
             require(onGoing.buyerAddress == address(0), "Already sold"); 
             uint256 premium = uint256(onGoing.amount).premium(onGoing.premiumRate); 
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
            payable(msg.sender).transfer(ethToSend-msg.value); 
         }
    }

    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expiryParameters)
        external override managerOnly { 
        
        for (uint256 i = 0; i < _expiryParameters.length; i++){
             StructureData.ExpiredOptionParameters memory expiryParameters = _expiryParameters[i];
             require(expiryParameters.expiryLevel > 0, "!expiryLevel"); 
             StructureData.VaultState storage data = vaultStates[expiryParameters.vaultId];
             OptionLifecycle.rollToNextRoundIfNeeded(data);
             require(data.currentRound > 2, "No expired round");
             StructureData.OptionState storage expired = data.expired;
             if (expired.amount == 0 || expired.buyerAddress == address(0)) { 
                 continue;
             } 

             require(expired.strike > 0, "!strike");
             address asset = vaultDefinitions[expiryParameters.vaultId].asset;
             uint256 diff = vaultDefinitions[expiryParameters.vaultId].callOrPut ? 
             (expiryParameters.expiryLevel > expired.strike ?  expiryParameters.expiryLevel - expired.strike : 0) : 
              (expired.strike > expiryParameters.expiryLevel ? expired.strike - expiryParameters.expiryLevel : 0);
             
              //can be withdrawn by trader 
             StructureData.OptionBuyerState storage buyerState = buyerStates[expired.buyerAddress];

             uint256 depositPriceAfterExpiry = diff.mul(10 ** OptionLifecycle.ROUND_PRICE_DECIMALS).div(expiryParameters.expiryLevel);
             data.depositPriceAfterExpiryPerRound[data.currentRound - 2] = uint128(depositPriceAfterExpiry);

             uint256 optionHolderValue = diff.mul(expired.amount).div(expiryParameters.expiryLevel);
             buyerState.optionValueToCollect[asset] = uint128(optionHolderValue.add(buyerState.optionValueToCollect[asset]));

             uint256 remaining = uint256(expired.amount).withPremium(expired.premiumRate).sub(optionHolderValue);
             uint256 redeemed = remaining.mul(expired.queuedRedeemAmount).div(expired.amount);
             data.totalRedeemed = uint128(redeemed.add(data.totalRedeemed));

             data.onGoing.amount = uint128(remaining.sub(redeemed).add(data.onGoing.amount)); 
         }
        
    }

    
    function collectOptionHolderValues() external override lock { 
        StructureData.OptionBuyerState storage buyerState = buyerStates[msg.sender];  
        for (uint256 i = 0; i < vaultCount; i++){
             address asset = vaultDefinitions[uint8(i)].asset;
             uint256 assetAmount = buyerState.optionValueToCollect[asset];
             if (assetAmount > 0) {
                 buyerState.optionValueToCollect[asset] = 0;
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
