// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

library StructureData {
    
//the strike price is calculated based on assetPrice * (1 +/- strikePriceRatio/100)
//for hodl, if the asset price is higher than the strike price, the option would be executed, it's a put option
//for alpha vol, if the price is lower than the strike price, the option would be executed, it's a call option
    struct OptionParameters {
         uint256 quota;  
         uint8 pricePrecision;
         int16 strikePriceRatio;  // take, 10% is represented as 1000, precision is 4
         uint16 interestRate; //take, 0.01% is represented as 1, precision is 4
     }

    struct OptionState {
         uint256 round;
         uint256 totalAmount; 
         uint256 strikePrice;
         uint256 underlyingPrice;
         uint16 interestRate; //take, 0.01% is represented as 1, precision is 4
         uint8 pricePrecision; 
         bool executed; 
    }
 

    enum OptionType {
        HodlBooster,
        VolAlpha
    }

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 ongoingAsset; //for previous round 
    }

    struct Request {
        uint256 amount;
        address contractAddress; //0 for eth
    }

}