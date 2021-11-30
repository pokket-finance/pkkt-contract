// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

//the strike price is calculated based on assetPrice * (1 +/- strikePriceRatio/100)
//for hodl, if the asset price is higher than the strike price, the option would be executed, it's a put option
//for alpha vol, if the price is lower than the strike price, the option would be executed, it's a call option
library StructureData {
    struct VaultParameters {
         uint256 quota;
         uint256 strikePriceRatio;
         bool callOrPut;
         uint256 strikePrice;
     }

    struct VaultState {
         uint256 round;
         uint256 totalAmount;
         uint256 matureBlockHeight;
         bool converted;
    }
    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 ongoingAsset; //for previous round

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
}