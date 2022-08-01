// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library StructureData {
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
   

    //struct kick off parameters 
    struct KickOffOptionParameters { 
        uint8 vaultId; 
        uint128 maxCapacity;  
        uint8 environment;
    }

    //parameters for cutoff option
    struct OnGoingOptionParameters {  
        uint128 strike; // strike price 
        uint104 premiumRate; //take, 0.01% is represented as 1, precision is 4
        uint8 vaultId; 
    }

    //parameters for expired option 
    struct ExpiredOptionParameters{
        uint128 expiryLevel;
        uint8 vaultId; 
    }

    struct CapacityParameters {
        uint8 vaultId;
        uint128 maxCapacity;
    }
    //information that won't change
    struct VaultDefinition {
        uint8 vaultId; 
        uint8 assetAmountDecimals; 
        address asset;
        address underlying;
        bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral; 
    } 

    struct OptionState {
        uint128 amount;
        uint128 queuedRedeemAmount;
        uint128 strike;
        uint104 premiumRate;
        address buyerAddress; 
    }
 
    struct VaultState { 
        uint128 totalPending; 
        uint128 totalRedeemed;
        uint32 cutOffAt;  
        uint16 currentRound;
        uint128 maxCapacity;   
        uint8 environment;
        StructureData.OptionState onGoing;
        StructureData.OptionState expired; 
        mapping(uint16 => uint128) depositPriceAfterExpiryPerRound; 
        mapping(address=>StructureData.UserState) userStates;
    }

    struct OptionBuyerState {
       mapping(address=>uint256) optionValueToCollect;  
    } 

    struct UserState {
        uint128 pending;
        uint128 redeemed;
        uint128 expiredAmount;
        uint128 expiredQueuedRedeemAmount;
        uint128 onGoingAmount;
        uint128 onGoingQueuedRedeemAmount;
        uint16 lastUpdateRound;
        bool expiredAmountCaculated;
    }
 
    struct VaultSnapShot {
        uint128 totalPending; 
        uint128 totalRedeemed;
        uint32 cutOffAt;  
        uint16 currentRound;
        uint128 maxCapacity;   
        StructureData.OptionState onGoing;
        StructureData.OptionState expired;
    
    }


    struct SoldVaultState {
        uint128 amount;
        uint128 strike;
        uint128 expiryLevel; //set when setting expiry level
        uint128 optionHolderValue; //set when setting expiry level 
        uint104 premiumRate;
        address buyerAddress;
    }
    struct ExpiredVaultState {
        uint128 amount;
        uint128 strike;
        uint128 expiryLevel;
        uint128 optionHolderValue; 
        uint16 round; 
        uint104 premiumRate;
        uint8 vaultId;  
    }
    struct CollectableValue {
       address asset;
       uint256 amount;
    }
}
