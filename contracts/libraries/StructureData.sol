// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

library StructureData {
     
     uint8 public constant MATUREROUND= 7; //7 for daily settlement, 1 for daily settlement
    //the strike price is calculated based on assetPrice * (1 +/- strikePriceRatio/100)
    //for hodl, if the asset price is higher than the strike price, the option would be executed, it's a call option  
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
         bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral;
    }
 
   struct MaturedState {
       uint256 maturedDepositAssetAmount;
       uint256 maturedCounterPartyAssetAmount;
       uint256 requestingDepositAssetAmount;
       uint256 requestingCounterPartyAssetAmount;
       bool executed;
       uint256 round;
       
   }

    enum OptionType {
        HodlBooster,
        VolAlpha
    }

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256[MATUREROUND] ongoingAsset; //for previous 7 rounds
        uint8 nextCursor; //nextCursor
        uint232 totalRound; 
        bool hasState;
    }
    function SetOngoingAsset(UserState storage userState, uint256 newValue) internal { 
        uint cursor = userState.nextCursor;
        userState.ongoingAsset[cursor] = newValue;
        uint8 nextCursor = cursor == (MATUREROUND - 1) ? uint8(0) : uint8(cursor + 1);
        userState.nextCursor = nextCursor;
        userState.totalRound = userState.totalRound + 1; //won't overflow
    }
    
    function GetOngoingAsset(UserState storage userState, uint8 backwardRound) internal view returns(uint256) {
        if (userState.totalRound <= backwardRound) return 0;
        require(backwardRound < MATUREROUND);
        int8 previousCursor = int8(userState.nextCursor) - int8(backwardRound) - 1;
        if (previousCursor < 0) {
            previousCursor = previousCursor + int8(MATUREROUND);
        }
        return userState.ongoingAsset[uint8(previousCursor)];
    }
    struct Request {
        uint256 amount;
        address contractAddress; //0 for eth
        address targetAddress; //vault address
    }

}