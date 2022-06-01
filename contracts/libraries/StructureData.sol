// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library StructureData {
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    uint8 public constant MATUREROUND = 1; //7 for daily settlement, 1 for daily settlement
    uint8 public constant PRICE_PRECISION = 4; 
   

    //struct kick off parameters 
    struct KickOffOptionParameters { 
        uint8 vaultId; 
        uint128 maxCapacity;  
    }

    //parameters for cutoff option
    struct OnGoingOptionParameters {  
        uint128 strike; // strike price 
        uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
        uint8 vaultId; 
    }

    //parameters for expired option 
    struct ExpiredOptionParameters{
        uint128 expiryLevel;
        uint8 vaultId; 
    }


    //information that won't change
    struct VaultDefinition {
        uint8 vaultId; 
        uint8 assetAmountDecimals; 
        address asset;
        bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral; 
    } 

    struct OptionState {
        uint128 amount;
        uint128 queuedRedeemAmount;
        uint128 strike;
        uint16 premiumRate;
        address buyerAddress; 
    }
 
    struct VaultState { 
        uint128 totalPending; 
        uint128 totalRedeemed;
        uint32 cutOffAt;  
        uint16 currentRound;
        uint128 maxCapacity;   
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
    }
 
 
}
