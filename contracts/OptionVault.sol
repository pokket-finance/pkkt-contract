// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";  
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
//import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";   
import {Utils} from "./libraries/Utils.sol";   
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol"; 
import "./interfaces/ISettlementAggregator.sol";   

abstract contract OptionVault is AccessControl, ReentrancyGuard, ISettlementAggregator {
    
 

    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Utils for uint128; 
     
     uint16 public override currentRound;  
    bool public underSettlement;    
    uint8 public optionPairCount;

    mapping(address=>StructureData.SettlementCashflowResult) public settlementCashflowResult; 

    mapping(uint8=> StructureData.OptionPairDefinition) public optionPairs;
    
    mapping(uint8 =>StructureData.OptionPairExecutionAccountingResult) public executionAccountingResult; 
  
    mapping(uint256=>uint16) public optionHeights;  
    
    mapping(uint8=>StructureData.OptionData) internal optionData;
    uint8 private assetCount; 
    mapping(uint8=>address) private asset;
    mapping(address=>StructureData.AssetData) private assetData;  

    constructor( address _settler) {
        require(_settler != address(0));
        
        // Contract deployer will be able to grant and revoke trading role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Address capable of initiating and finizalizing settlement
        _setupRole(StructureData.SETTLER_ROLE, _settler);
    }
    
   
     
    function clientWithdraw(address _target, uint256 _amount, address _contractAddress, bool _redeem) internal nonReentrant {
         if (!_redeem) {
             require(balanceEnough(_contractAddress));
         }
        OptionLifecycle.withdraw(_target, _amount, _contractAddress);
    } 


    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) 
    public override { 
         _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        uint256 length = _optionPairDefinitions.length;
        uint8 optionPairCount_ = optionPairCount;
        uint8 assetCount_ = assetCount;
        for(uint256 i = 0; i < length; i++) {
            StructureData.OptionPairDefinition memory pair = _optionPairDefinitions[i];
            pair.callOptionId = optionPairCount_ * 2 + 1;
            pair.putOptionId = pair.callOptionId + 1;
            optionPairs[optionPairCount_++] = pair;   
            if (assetCount_ == 0) {
                asset[assetCount_++] = pair.depositAsset; 
                asset[assetCount_++] = pair.counterPartyAsset;  
            }
            else {
                bool callAdded = false;
                bool putAdded = false;
                for(uint8 j = 0; j <assetCount_; j++) {
                    if (asset[j] == pair.depositAsset) {
                        callAdded = true;
                    }
                    if (asset[j] == pair.counterPartyAsset) {
                        putAdded = true;
                    }
                }
                if (!callAdded) { 
                    asset[assetCount_++] = pair.depositAsset; 
                }
                if (!putAdded) { 
                    asset[assetCount_++] = pair.counterPartyAsset; 
                }
            }
        }
        optionPairCount = optionPairCount_;  
        assetCount = assetCount_;
    } 

 

    function initiateSettlement() external override {
        
         _checkRole(StructureData.SETTLER_ROLE, msg.sender);
        require(!underSettlement); 
        currentRound = currentRound + 1;   
        underSettlement = true;  
        for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i];  
            StructureData.OptionData storage callOption = optionData[pair.callOptionId];
            uint128 pending1 = OptionLifecycle.rollToNextByOption(callOption, currentRound, true);
            StructureData.OptionData storage putOption = optionData[pair.putOptionId];
            uint128 pending2 = OptionLifecycle.rollToNextByOption(putOption, currentRound, false);
            if (pending1 > 0) { 
                assetData[pair.depositAsset].depositAmount = assetData[pair.depositAsset].depositAmount.add(pending1);
            }
            if (pending2 > 0) { 
                assetData[pair.counterPartyAsset].depositAmount = assetData[pair.counterPartyAsset].depositAmount.add(pending2);
            }
            if (currentRound <= 2) {
                continue;
            }
            
            StructureData.SettlementAccountingResult memory noneExecuteCallOption = 
            OptionLifecycle.dryRunSettlementByOption(callOption, pair.callOptionId, true, pair.depositAssetAmountDecimals, pair.counterPartyAssetAmountDecimals, currentRound, false);
            StructureData.SettlementAccountingResult memory noneExecutePutOption = 
            OptionLifecycle.dryRunSettlementByOption(putOption, pair.putOptionId, false, pair.counterPartyAssetAmountDecimals, pair.depositAssetAmountDecimals, currentRound, false);
           
            StructureData.OptionPairExecutionAccountingResult memory pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.NoExecution,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3] = pairResult; 
            StructureData.SettlementAccountingResult memory executeCallOption =  
            OptionLifecycle.dryRunSettlementByOption(callOption, pair.callOptionId, true, pair.depositAssetAmountDecimals, pair.counterPartyAssetAmountDecimals, currentRound, true);
            pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecuteCall,
                callOptionResult: executeCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3 + 1] = pairResult; 

            StructureData.SettlementAccountingResult memory executePutOption =
            OptionLifecycle.dryRunSettlementByOption(putOption, pair.putOptionId, false, pair.counterPartyAssetAmountDecimals, pair.depositAssetAmountDecimals, currentRound, true);
            pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecutePut,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: executePutOption
            });
            executionAccountingResult[i * 3 + 2] = pairResult; 
        } 
         
       if (currentRound == 1) {
           underSettlement = false;
           return;
       }
       if (currentRound == 2) {
            
           settle(new StructureData.OptionPairExecution[](0));
       }
    }

    function settle(StructureData.OptionPairExecution[] memory _execution) public override{   
        
         _checkRole(StructureData.SETTLER_ROLE, msg.sender);
        require(underSettlement); 
        uint256 count = _execution.length; 
        if (currentRound <= 2) {
            require(count == 0);
        }
         

        for(uint256 i = 0; i < count; i++) { 
            StructureData.OptionPairExecution memory execution = _execution[i];  
            StructureData.OptionPairDefinition storage pair = optionPairs[execution.pairId];
            StructureData.MaturedState memory maturedState= 
            closePreviousByOption(pair.callOptionId, execution.execute == StructureData.OptionExecution.ExecuteCall);
            if (maturedState.releasedDepositAssetAmount > 0) { 
                assetData[pair.depositAsset].releasedAmount = assetData[pair.depositAsset].releasedAmount
                .add(maturedState.releasedDepositAssetAmountWithPremium);
            }
            else if (maturedState.releasedCounterPartyAssetAmount > 0) { 
                assetData[pair.counterPartyAsset].releasedAmount = assetData[pair.counterPartyAsset].releasedAmount
                .add(maturedState.releasedCounterPartyAssetAmountWithPremium);
            } 


            maturedState = closePreviousByOption(pair.putOptionId, execution.execute == StructureData.OptionExecution.ExecutePut);
             if (maturedState.releasedDepositAssetAmount > 0) { 
                assetData[pair.counterPartyAsset].releasedAmount = assetData[pair.counterPartyAsset].releasedAmount
                .add(maturedState.releasedDepositAssetAmountWithPremium);
            }
            else if (maturedState.releasedCounterPartyAssetAmount > 0) { 
                assetData[pair.depositAsset].releasedAmount = assetData[pair.depositAsset].releasedAmount
                .add(maturedState.releasedCounterPartyAssetAmountWithPremium);
            } 
        }
        if (currentRound > 1) {  
            for(uint8 i = 1; i <= optionPairCount * 2; i++) {  
            
                StructureData.OptionData storage option = optionData[i]; 
                OptionLifecycle.commitByOption(option, currentRound - 1); 
            }
            optionHeights[block.number] = currentRound - 1;
        }

 
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            StructureData.AssetData storage assetSubData = assetData[assetAddress];  
            //no snaphot previously, so, no balance change 
            int128 leftOver = assetSubData.leftOverAmount + 
            (currentRound == 2 ? int128(0) : (getBalanceChange(assetAddress) - int128(assetSubData.depositAmount) + int128(assetSubData.releasedAmount)));

            assetSubData.traderWithdrawn = 0; 
            assetSubData.balanceAfterSettle = uint128(OptionLifecycle.getAvailableBalance(assetAddress, address(this)));
            assetSubData.withdrawableAfterSettle = collectWithdrawable(assetAddress); 
            StructureData.SettlementCashflowResult memory instruction = StructureData.SettlementCashflowResult({
                newReleasedAmount: assetSubData.releasedAmount,
                newDepositAmount: assetSubData.depositAmount,
                leftOverAmount: leftOver,
                contractAddress: assetAddress
            }); 
            settlementCashflowResult[assetAddress] = instruction;
            //todo: check overflow
            assetSubData.leftOverAmount = leftOver + int128(assetSubData.depositAmount) - int128(assetSubData.releasedAmount);
            assetSubData.depositAmount = 0;
            assetSubData.releasedAmount = 0;
        }

        underSettlement = false; 
    } 


    function setOptionParameters(StructureData.OptionParameters[] memory _parameters) external override {

         _checkRole(StructureData.SETTLER_ROLE, msg.sender);
          uint256 count = _parameters.length;        
          //if (currentRound <= 1) {
             //require(count == 0, "nothing to set");
          //}         
          //require(!underSettlement, "Being settled"); 
          for(uint256 i = 0; i < count; i++) {
              StructureData.OptionParameters memory parameter = _parameters[i];
              StructureData.OptionState storage optionState = optionData[parameter.optionId].optionStates[currentRound - 1]; 
              require(optionState.strikePrice == 0);
              optionState.strikePrice = parameter.strikePrice;
              optionState.premiumRate = parameter.premiumRate; 
          }
    }

    //todo: whitelist / nonReentrancy check
    function withdrawAsset(address _trader, address _asset) external override {
        
         _checkRole(StructureData.SETTLER_ROLE, msg.sender);
        StructureData.AssetData storage assetSubData = assetData[_asset];  
        uint128 balance  = uint128(assetSubData.leftOverAmount); 
        //require(balance > 0, "nothing to withdraw");
        OptionLifecycle.withdraw(_trader, balance, _asset);
        assetSubData.traderWithdrawn = balance;
        assetSubData.leftOverAmount = 0;
    }

    function balanceEnough(address _asset) public view override returns(bool) {
        StructureData.AssetData storage assetSubData = assetData[_asset];  
        int128 balance  = assetSubData.leftOverAmount; 
        if (balance >= 0) {
            return true;
        } 
        if (OptionLifecycle.getAvailableBalance(_asset, address(this)) == 0) {
            return false;
        }
         
        return (balance + getBalanceChange(_asset)) >= 0;
    }

 
    function getBalanceChange(address _asset) private view returns(int128){
        StructureData.AssetData storage assetSubData = assetData[_asset];       
       // int128 leastBalance = int128(assetSubData.balanceAfterSettle + collectWithdrawable(_asset) - assetSubData.withdrawableAfterSettle); 
        //return  int128(uint128(getAvailableBalance(_asset))) - leastBalance + int128(assetSubData.traderWithdrawn); 
        return  int128(uint128(OptionLifecycle.getAvailableBalance(_asset,address(this))).add(assetSubData.traderWithdrawn).add(assetSubData.withdrawableAfterSettle))
         - int128(assetSubData.balanceAfterSettle.add(collectWithdrawable(_asset)));
    }
 
    function collectWithdrawable(address _asset) private view returns(uint128) {
         
         uint128 total = 0;
         for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i]; 
            if (pair.depositAsset == _asset ||
                pair.counterPartyAsset == _asset) {
                StructureData.OptionData storage callOption = optionData[pair.callOptionId];
                total = total.add(pair.depositAsset == _asset ? 
                    callOption.optionStates[currentRound].totalAmount.add(callOption.totalReleasedDepositAssetAmount):
                    callOption.totalReleasedCounterPartyAssetAmount);
                
                StructureData.OptionData storage putOption = optionData[pair.putOptionId];    
                total = total.add(pair.counterPartyAsset == _asset ? 
                    putOption.optionStates[currentRound].totalAmount.add(putOption.totalReleasedDepositAssetAmount):
                    putOption.totalReleasedCounterPartyAssetAmount); 
            }   
        }
        return total;
    } 
    receive() external payable {  
    }
  
    function closePreviousByOption(uint8 _optionId, bool _execute) internal virtual returns(StructureData.MaturedState memory _maturedState);  

 
}