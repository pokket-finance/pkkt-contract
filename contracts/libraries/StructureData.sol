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
        uint8 optionId; 
        uint256 maxCapacity;  
    }

    //parameters for cutoff option
    struct CutOffOptionParameters {  
        uint128 strike; // strike price 
        uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
        uint8 optionId; 
    }

    //parameters for expired option 
    struct ExpiredOptionParameters{
        uint128 expiryLevel;
        uint8 optionId; 
    }


    //information that won't change
    struct OptionDefinition {
        uint8 optionId; 
        uint8 assetAmountDecimals; 
        address asset;
        bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral; 
    } 

    //current option status
    struct OptionState {
        //t+2 round
        uint128 totalToExpire;
        //t+1 round
        uint128 totalToSell;
        uint128 totalTerminate;
        //t round
        uint128 totalPending; 
        uint32 cutOffAt;
        uint16 currentRound;
        uint128 strike;
        uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4 
        uint256 maxCapacity;  
        address buyerAddress; 
        mapping(address=>StructureData.UserState) userStates;
    }

    struct OptionBuyerState {
       mapping(address=>uint256) optionValueToCollect;
    } 


    struct UserState {
        uint128 pendingAsset;  
        uint128 assetToSell; 
        uint128 assetToExpire; 
        uint128 assetExpired; 
        bool hasState;
    }


    //readonly query results
    
    struct MaturedState {
        uint256 releasedAssetAmount;
        uint256 releasedAssetPremiumAmount;
        uint256 releasedAssetAmountWithPremium; 
        uint256 autoRollAssetAmount;
        uint256 autoRollAssetPremiumAmount;
        uint256 autoRollAssetAmountWithPremium; 
    }


    struct OptionSnapshot {
        uint128 totalPending;
        //total tvl = totalLocked + totalTerminating
        uint128 totalLocked;
        //only set during settlement
        uint128 totalTerminating;
        //amount to terminate in next round,  totalToTerminate <= totalLocked
        uint128 totalToTerminate;
        uint128 totalReleased; 
    }

    struct UserBalance {
        uint128 pendingDepositAssetAmount;
        //tvl = lockedDepositAssetAmount + terminatingDepositAssetAmount
        uint128 lockedDepositAssetAmount;
        //only set during settlement
        uint128 terminatingDepositAssetAmount;
        //amount to terminate in next round, toTerminateDepositAssetAmount <= lockedDepositAssetAmount
        uint128 toTerminateDepositAssetAmount;
        uint128 releasedDepositAssetAmount;
        uint128 releasedCounterPartyAssetAmount;
    }
     
 
}
