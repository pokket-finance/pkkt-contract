// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";  
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";  
import {StructureData} from "./libraries/StructureData.sol";   
import {Utils} from "./libraries/Utils.sol";   
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol"; 
import "./interfaces/IPKKTStructureOption.sol";  
import "./OptionVault.sol"; 
contract PKKTHodlBoosterOption is OptionVault, IPKKTStructureOption {
    
    using SafeERC20 for IERC20; 
    using Utils for uint128;  
    using OptionLifecycle for StructureData.UserState;
     
     //private data for complete withdrawal and redeposit  
     
    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    constructor( address _settler, StructureData.OptionPairDefinition[] memory _optionPairDefinitions) OptionVault(_settler) {  
        addOptionPairs(_optionPairDefinitions);
    }

    function validateOptionById(uint8 _optionId) private view {  
        require(_optionId != 0 && _optionId <= optionPairCount*2); 
    }
 

    function getAccountBalance(uint8 _optionId) external view override returns (StructureData.UserBalance memory) {
   
       return OptionLifecycle.getAccountBalance(optionData[_optionId], msg.sender, underSettlement, currentRound); 
    }
 
    function getOptionSnapShot(uint8 _optionId) external override view returns(StructureData.OptionSnapshot memory) { 
       return OptionLifecycle.getOptionSnapShot(optionData[_optionId], underSettlement, currentRound);  
    }


    function initiateWithraw(uint8 _optionId, uint128 _assetToTerminate) external override {
        //require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        //require(currentRound > 1, "No on going"); 
        validateOptionById(_optionId); 
        OptionLifecycle.initiateWithrawStorage(optionData[_optionId], msg.sender, _assetToTerminate, underSettlement, currentRound);
    }

    function cancelWithdraw(uint8 _optionId, uint128 _assetToTerminate) external override  { 
        //require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        //require(currentRound > 1, "No on going");
        validateOptionById(_optionId); 
      
        OptionLifecycle.cancelWithdrawStorage(optionData[_optionId], msg.sender, _assetToTerminate, underSettlement, currentRound);

    } 
    

    
    function withdraw(uint8 _optionId, uint128 _amount, address _asset) external override  { 
       //require(_amount > 0, "!amount");   
       
        validateOptionById(_optionId);
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       //require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "!asset"); 
       OptionLifecycle.withdrawStorage(optionData[_optionId], msg.sender, _amount, currentRound, 
            (_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)); 
       clientWithdraw(msg.sender, _amount, _asset, false);
        emit Withdraw(_optionId, msg.sender, _asset, _amount);
    }
 

 
    //deposit eth
    function depositETH(uint8 _optionId) external override payable  { 
       //require(currentRound > 0, "!Started"); 
       require(msg.value > 0); 
       
       validateOptionById(_optionId);
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset;
       require(depositAsset == address(0));
 
        //todo: convert to weth  
       OptionLifecycle.depositFor(optionData[_optionId], msg.sender, uint128(msg.value), 0, currentRound, true);
       
        emit Deposit(_optionId, msg.sender, currentRound, uint128(msg.value));
       //payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _optionId, uint128 _amount) external override{   
        //require(currentRound > 0, "!Started"); 
        //require(_amount > 0, "!amount"); 
        validateOptionById(_optionId);
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
        address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset; 
        require(depositAsset != address(0)); 
        
        OptionLifecycle.depositFor(optionData[_optionId], msg.sender, _amount, 0, currentRound, true);
        emit Deposit(_optionId, msg.sender, currentRound, _amount);
        IERC20(depositAsset).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
 
  
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    //function getRoundData(uint8 _optionId, uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
    //    return optionStates[_optionId][optionHeights[_blockHeight]];
    //} 

 
    /*function getRoundDataByBlock(uint8 _optionId, uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
        return optionData[_optionId].optionStates[optionHeights[_blockHeight]];
    }*/

    function getOptionStateByRound(uint8 _optionId, uint16 _round) external view override returns(StructureData.OptionState memory) {

        return optionData[_optionId].optionStates[_round];
    }

   //then, make decision based on dry run result and close t-1 round
   function closePreviousByOption(uint8 _optionId, bool _execute) internal override  
   returns(StructureData.MaturedState memory _maturedState) {    
        //uint16 maturedRound = currentRound - 2;
        StructureData.OptionData storage option = optionData[_optionId]; 
        StructureData.OptionState storage previousOptionState = option.optionStates[currentRound - 2];   
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
        bool isCall = pair.callOptionId == _optionId;
        StructureData.MaturedState memory maturedState = OptionLifecycle.calculateMaturity(_execute, previousOptionState, isCall,
            isCall ? pair.depositAssetAmountDecimals : pair.counterPartyAssetAmountDecimals, 
            isCall ? pair.counterPartyAssetAmountDecimals : pair.depositAssetAmountDecimals);     
        previousOptionState.executed = _execute; 
         
        if (_execute) {
            option.totalReleasedCounterPartyAssetAmount = option.totalReleasedCounterPartyAssetAmount
            .add(maturedState.releasedCounterPartyAssetAmountWithPremium); 
        }
        else {
            option.totalReleasedDepositAssetAmount= option.totalReleasedDepositAssetAmount
            .add(maturedState.releasedDepositAssetAmountWithPremium);

        }
        if (previousOptionState.totalAmount > 0) { 
             
            uint128 totalAutoRollBase = previousOptionState.totalAmount.sub(previousOptionState.totalTerminate);
            if (_execute) { 
                autoRollToCounterPartyByOption(option, _optionId, totalAutoRollBase, previousOptionState, 
                maturedState.releasedCounterPartyAssetAmountWithPremium, maturedState.autoRollCounterPartyAssetAmountWithPremium);
            }
            else { 
                autoRollByOption(option, _optionId,  totalAutoRollBase, previousOptionState, 
                maturedState.releasedDepositAssetAmountWithPremium, maturedState.autoRollDepositAssetAmountWithPremium);
            }
        }    
        //emit CloseOption(_optionId, currentRound - 2);
        return maturedState;
   }
 
 

   function autoRollToCounterPartyByOption(StructureData.OptionData storage option, uint8 _optionId, uint128 _totalAutoRollBase, StructureData.OptionState storage _optionState, 
    uint128 _totalReleased, uint128 _totalAutoRoll) private {  
        //uint256 lockedRound = currentRound - 1;  
        uint8 counterPartyOptionId = _optionId % 2 == 1 ? (_optionId + 1) : (_optionId - 1);
        //uint256 assetToTerminateForNextRoundByOption = assetToTerminateForNextRound[_optionId];
        //debit assetToTerminateForNextRound if executed
        if (option.assetToTerminateForNextRound > 0 && _totalAutoRoll > 0) { 
             option.assetToTerminateForNextRound = option.assetToTerminateForNextRound.subOrZero(  
             _totalAutoRollBase.withPremium(_optionState.premiumRate));

        }
        uint256 userCount = option.usersInvolved.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = option.usersInvolved[i];
            StructureData.UserState storage userState = option.userStates[userAddress];  
             
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            } 
            uint128 amountToTerminate = Utils.getAmountToTerminate(_totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) {
                userState.releasedCounterPartyAssetAmount  = 
                userState.releasedCounterPartyAssetAmount.add(amountToTerminate);
            } 
            uint128 remainingAmount = Utils.getAmountToTerminate(_totalAutoRoll, userState.ongoingAsset.sub(userState.assetToTerminate), _totalAutoRollBase);
            if (remainingAmount > 0){    
                (uint128 onGoingTerminate,) = userState.deriveWithdrawRequest(_optionState.premiumRate);
                if (onGoingTerminate != 0) {
                    uint128 virtualOnGoing =  userState.ongoingAsset.withPremium(_optionState.premiumRate);
                    onGoingTerminate = Utils.getAmountToTerminate(remainingAmount, onGoingTerminate, virtualOnGoing);
                } 
                
                OptionLifecycle.depositFor(optionData[counterPartyOptionId], userAddress, remainingAmount, onGoingTerminate, currentRound - 1, false);
                emit Deposit(counterPartyOptionId,userAddress, currentRound - 1, remainingAmount);
            } 
            userState.assetToTerminate = 0;
        }  
   }
 
   function autoRollByOption(StructureData.OptionData storage option, uint8 _optionId, uint128 _totalAutoRollBase,  StructureData.OptionState storage _optionState, 
   uint128 _totalReleased, uint128 _totalAutoRoll) private {
        //uint256 lockedRound = currentRound - 1; 
        
        uint256 userCount = option.usersInvolved.length;
          for (uint i=0; i < userCount; i++) {
            address userAddress = option.usersInvolved[i];
            StructureData.UserState storage userState = option.userStates[userAddress];   
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            }
                
            uint128 amountToTerminate = Utils.getAmountToTerminate(_totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) { 
                userState.releasedDepositAssetAmount  = 
                userState.releasedDepositAssetAmount.add(amountToTerminate); 
            }
            uint128 remainingAmount = Utils.getAmountToTerminate(_totalAutoRoll, userState.ongoingAsset.sub(userState.assetToTerminate), _totalAutoRollBase);
            if (remainingAmount > 0) { 
                
                OptionLifecycle.depositFor(option, userAddress, remainingAmount, 0, currentRound - 1, false); 
                emit Deposit(_optionId, userAddress, currentRound - 1, remainingAmount);
            } 
                
            userState.assetToTerminate = 0;
        }  
   }
 
}