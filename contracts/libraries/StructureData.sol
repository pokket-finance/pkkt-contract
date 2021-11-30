// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

library StructureData {
    
//the strike price is calculated based on assetPrice * (1 +/- strikePriceRatio/100)
//for hodl, if the asset price is higher than the strike price, the option would be executed, it's a put option
//for alpha vol, if the price is lower than the strike price, the option would be executed, it's a call option
    struct VaultParameters {
         uint256 quota;
         uint256 strikePriceRatio;
         uint256 interestRate;
         bool callOrPut;
         uint256 strikePrice;
     }

    struct VaultState {
         uint256 round;
         uint256 totalAmount; 
         uint256 assetPrice;
         bool converted;
    }
    
    enum StableCoin {
         None,
         USDT,
         USDC,
         DAI,
         BUSD
    }

    enum VaultType {
        Hodl,
        AlphaVol
    }

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 ongoingAsset; //for previous round
        StableCoin currentConvertedCoin;
        StableCoin previousConvertedCoin; 
    }

}