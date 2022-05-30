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
        uint256 maxCapacity;  
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
        uint256 maxCapacity;   
        uint128 currentRound;
        StructureData.OptionState onGoing;
        StructureData.OptionState expired; 
        mapping(uint8 => uint128) depositPriceAfterExpiryPerRound; 
        mapping(address=>StructureData.DepositReceipt) userDeposits;
        mapping(address=>StructureData.Withdrawal) userWithdrawals;
    }

    struct OptionBuyerState {
       mapping(address=>uint256) optionValueToCollect;
    } 

 
    //the core idea is that, util curent round -3, we don't know the exact new ratio 
    //(current round: pending, current round - 1: selling, current round - 2: sold, current round -3: already expired)
    struct DepositReceipt { 
        uint16 round; 
        uint104 amount;  
        uint128 unredeemmedAmountRoundMinus3;  
        uint128 unredeemmedAmountRoundMinus2;  
        uint128 unredeemmedAmountRoundMinus1;
        
    }

    struct Withdrawal { 
        uint16 round;  
        uint104 redeemingAmount; //amount on sold
        uint128 redeemedAmount; //expired amount
    }

 
}
