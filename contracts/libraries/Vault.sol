// SPDX-License-Identifier: UNLICENSED 
pragma solidity 0.6.12;

library Vault { 
    struct UserVaultInfo {
        uint256 pendingAmount;  
        uint256 ongoingAmount;  
        uint256 toMatureAmount;
        uint256 requestingAmount;
        uint256 maturedAmount; 
        uint256 pendingPKKTReward;  
        uint256 currentNativeInterestRate;
        uint256 currentPokketInterestRate;
        bool isEmpty;
    } 
 

    struct SettlementSettings {
        uint256 underlyingInterestRate;
        uint256 pkketInterestRate;
        address traderAddress;
    }
}
