// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

library StructureData {
     
     uint8 public constant MATUREROUND= 1; //7 for daily settlement, 1 for daily settlement
    //the strike price is calculated based on assetPrice * (1 +/- strikePriceRatio/100)
    //for hodl, if the asset price is higher than the strike price, the option would be executed, it's a call option  
    struct OptionParameters {
         uint256 strikePrice;  // strike price if executed
         uint8 pricePrecision;
         uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
     }

    struct OptionState {
         uint256 round;
         uint256 totalAmount; 
         uint256 strikePrice; 
         uint16 premiumRate; //take, 0.01% is represented as 1, precision is 4
         uint8 pricePrecision; 
         bool executed; 
         bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral;
    }
 
   struct MaturedState {
       uint256 maturedDepositAssetAmount;
       uint256 maturedCounterPartyAssetAmount;
       bool executed;
       uint256 round;
       
   }

    enum OptionType {
        HodlBooster,
        VolAlpha
    }

    struct UserState {
        uint256 pendingAsset; //for current round
        uint256 lockedAsset;//asset undersettlement
        uint256[MATUREROUND] ongoingAsset; //for previous 7 rounds
        uint8 nextCursor; //nextCursor
        uint232 totalRound; 
        bool hasState;
        uint256 assetToTerminate;  
        uint256 assetToTerminateForNextRound;  
    }

    struct OptionSnapshot {
        uint256 totalPending;
        uint256 totalLocked;
        uint256 totalOngoing;
        uint256 totalMaturedDeposit;
        uint256 totalMaturedCounterParty;
    }

    struct UserBalance {
        uint256 pendingDepositAssetAmount; 
        uint256 lockedDepositAssetAmount; 
        uint256 ongoingDepositAssetAmount;
        uint256 maturedDepositAssetAmount;
        uint256 maturedCounterPartyAssetAmount;
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

    enum Direction {
        None,
        SendToTrader,
        SendBackToVault
    }
    struct SettlementInstruction {
        uint256 amount;
        address contractAddress; //0 for eth
        address targetAddress; //vault address
        Direction direction;
        bool fullfilled;
    }

    struct MaturedAmount {
        uint256 amount;
        address asset;
    }


    struct SettlementResult {
        //won't change regardless execute or not
        address option;
        uint256 round;
        uint256 depositAmount; 
        uint256 leftOverAmount;
        uint256 leftOverCounterPartyAmount;

        //following will change if execute or not
        bool executed;
        uint256 autoRollAmount; //T-1 Carried (filled only when not executed)
        uint256 autoRollPremium; //Premium (filled only when not executed)
        //maturedAmount+maturedPremium = requested withdrawal for deposit asset(filled only when not executed and with withdraw request)
        uint256 maturedAmount;  
        uint256 maturedPremium;
        //autoRollCounterPartyAmount + autoRollCounterPartyPremium = Execution rolled-out for deposit asset (Execution roll-in for counter party option)
        //filled only when executed
        uint256 autoRollCounterPartyAmount;
        uint256 autoRollCounterPartyPremium;
        //maturedCounterPartyAmount+maturedCounterPartyPremium= requested withdrawal for couter party asset(filled only when executed and with withdraw request)
        uint256 maturedCounterPartyAmount;
        uint256 maturedCounterPartyPremium;


    }
}