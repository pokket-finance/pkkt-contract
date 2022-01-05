// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/ISettlementAggregator.sol";  
import "./interfaces/IPKKTStructureOption.sol";

abstract contract OptionVault is ISettlementAggregator, AccessControl, ReentrancyGuard {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
     
     uint256 public override currentRound;  
     bool public underSettlement;    
    /*
     * cash flow perspective (based on asset address)
     */ 
    uint8 assetCount;
    mapping(uint8=>address) private asset;
    mapping(address=>StructureData.SettlementCashflowResult) public settlementCashflowResult; 
    mapping(address=>uint256) private releasedAmount; //debit
    mapping(address=>uint256) private depositAmount; //credit
    mapping(address=>int256) private leftOverAmount;  //history balance
    
    /*
     *  actual balance perspective
     *  withdrawable = redeemable + released
     *  balance = withdrawable + leftOver  
     */
    mapping(address=>uint256) private assetBalanceAfterSettle;
    mapping(address=>uint256) private assetWithdrawableAfterSettle;
    mapping(address=>uint256) private assetTraderWithdrawn;

    /*
     * accounting perspective(based on option pair)
     */ 
    uint8 public optionPairCount;
    mapping(uint8=>StructureData.OptionPairDefinition) public optionPairs;
    
    mapping(uint8 => StructureData.OptionPairExecutionAccountingResult) public executionAccountingResult; 
 

    constructor( address _settler) {
        require(_settler != address(0), "Empty settler address");
        
        // Contract deployer will be able to grant and revoke trading role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Address capable of initiating and finizalizing settlement
        _setupRole(StructureData.SETTLER_ROLE, _settler);
    }
    
   
     
    function clientWithdraw(address _target, uint256 _amount, address _contractAddress, bool _redeem) internal {
         if (!_redeem) {
             require(balanceEnough(_contractAddress), "Released amount not available yet");
         }
        _withdraw(_target, _amount, _contractAddress);
    } 
     function _withdraw(address _target, uint256 _amount, address _contractAddress) private{

        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        }
        else { 
            IERC20(_contractAddress).safeTransfer(_target, _amount); 
        }
    }  
 

 
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) public override onlyRole(DEFAULT_ADMIN_ROLE){
         
        uint256 length = _optionPairDefinitions.length;
        for(uint256 i = 0; i < length; i++) {
            StructureData.OptionPairDefinition memory pair = _optionPairDefinitions[i];
            pair.callOptionId = optionPairCount / 2 + 1;
            pair.putOptionId = optionPairCount / 2 + 2;
            optionPairs[optionPairCount] = pair; 
            optionPairCount++; 
            if (assetCount == 0) {
                asset[assetCount] = pair.depositAsset;
                assetCount ++ ;
                asset[assetCount] = pair.counterPartyAsset;
                assetCount ++ ;

            }
            else {
                bool callAdded = false;
                bool putAdded = false;
                for(uint8 j = 0; j <assetCount; j++) {
                    if (asset[j] == pair.depositAsset) {
                        callAdded = true;
                    }
                    if (asset[j] == pair.counterPartyAsset) {
                        putAdded = true;
                    }
                }
                if (!callAdded) { 
                    asset[assetCount] = pair.depositAsset;
                    assetCount ++ ;
                }
                if (!putAdded) { 
                    asset[assetCount] = pair.counterPartyAsset;
                    assetCount ++ ;
                }
            }
        }  
    } 


    uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;


    function initiateSettlement() external override onlyRole(StructureData.SETTLER_ROLE) {
        require(!underSettlement, "Being settled"); 
        currentRound = currentRound + 1;   
        underSettlement = true;  
        for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i];  
            uint256 pending1 = rollToNextByOption(MAX_INT, pair.callOptionId);
            uint256 pending2 = rollToNextByOption(MAX_INT, pair.putOptionId);
            if (pending1 > 0) { 
                depositAmount[pair.depositAsset] = depositAmount[pair.depositAsset].add(pending1);
            }
            if (pending2 > 0) { 
                depositAmount[pair.counterPartyAsset] = depositAmount[pair.counterPartyAsset].add(pending2);
            }
            if (currentRound <= 2) {
                continue;
            }
            StructureData.SettlementAccountingResult memory noneExecuteCallOption = dryRunSettlementByOption(false, pair.callOptionId);
            StructureData.SettlementAccountingResult memory noneExecutePutOption = dryRunSettlementByOption(false, pair.putOptionId);
            StructureData.OptionPairExecutionAccountingResult memory pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.NoExecution,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3] = pairResult; 
            StructureData.SettlementAccountingResult memory executeCallOption = dryRunSettlementByOption(true, pair.callOptionId); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult2 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecuteCall,
                callOptionResult: executeCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3 + 1] = pairResult2; 

            StructureData.SettlementAccountingResult memory executePutOption = dryRunSettlementByOption(true, pair.putOptionId); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult3 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecutePut,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: executePutOption
            });
            executionAccountingResult[i * 3 + 2] = pairResult3; 
        } 
         
       if (currentRound <= 1) {
           underSettlement = false;
       }
    }

    function settle(StructureData.OptionPairExecution[] memory _execution) external override onlyRole(StructureData.SETTLER_ROLE) {  

        require(underSettlement, "Not being settled"); 
        uint256 count = _execution.length; 
        if (currentRound <= 2) {
            require(count == 0, "no matured round");
        }
         

        for(uint256 i = 0; i < count; i++) { 
            StructureData.OptionPairExecution memory execution = _execution[i];  
            StructureData.OptionPairDefinition storage pair = optionPairs[execution.pairId];
            StructureData.MaturedState memory maturedState;
            StructureData.MaturedState memory maturedState2; 

            if (execution.execute == StructureData.OptionExecution.NoExecution) {
                maturedState = closePreviousByOption(false, pair.callOptionId);
                maturedState2 = closePreviousByOption(false, pair.putOptionId);
            }
            else if (execution.execute == StructureData.OptionExecution.ExecuteCall) {
                maturedState = closePreviousByOption(true, pair.callOptionId);
                maturedState2 = closePreviousByOption(false, pair.putOptionId);
            }
            if (execution.execute == StructureData.OptionExecution.ExecutePut) {
                maturedState = closePreviousByOption(false, pair.callOptionId);
                maturedState2 = closePreviousByOption(true, pair.putOptionId);
            } 
            if (maturedState.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[pair.depositAsset];
                releasedAmount[pair.depositAsset] = releasedDepositAssetAmount.add(maturedState.releasedDepositAssetAmount)
                .add(maturedState.releasedDepositAssetPremiumAmount); 
            }
            else if (maturedState.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[pair.counterPartyAsset];
                releasedAmount[pair.counterPartyAsset] = releasedCounterPartyAssetAmount.add(maturedState.releasedCounterPartyAssetAmount)
                .add(maturedState.releasedCounterPartyAssetPremiumAmount); 
            }  
            
            if (maturedState2.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[pair.depositAsset];
                releasedAmount[pair.depositAsset] = releasedDepositAssetAmount.add(maturedState2.releasedDepositAssetAmount)
                .add(maturedState2.releasedDepositAssetPremiumAmount); 
            }
            else if (maturedState2.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[pair.counterPartyAsset];
                releasedAmount[pair.counterPartyAsset] = releasedCounterPartyAssetAmount.add(maturedState2.releasedCounterPartyAssetAmount)
                .add(maturedState2.releasedCounterPartyAssetPremiumAmount);  
            }  
        }
        if (currentRound > 1) { 
            uint8 optionCount = optionPairCount * 2;
            for(uint8 i = 1; i <= optionCount; i++) { 
                commitCurrentByOption(i); 
            } 
        }

 
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            uint256 released = releasedAmount[assetAddress];
            uint256 deposit = depositAmount[assetAddress]; 
            int256 leftOver = leftOverAmount[assetAddress]; 
            
            //no snaphot previously, so, no balance change
            int256 balanceChange = currentRound == 2 ? int256(0) : (getBalanceChange(assetAddress) - int256(deposit) + int256(released));
            leftOver = leftOver + balanceChange;

            assetTraderWithdrawn[assetAddress] = 0;
            assetBalanceAfterSettle[assetAddress] = getAvailableBalance(assetAddress);
            assetWithdrawableAfterSettle[assetAddress] = collectWithdrawable(assetAddress);
            //console.log("asset %s balance:%d withdrawable:%d", assetAddress, assetBalanceAfterSettle[assetAddress], assetWithdrawableAfterSettle[assetAddress]);

            //console.log("asset %s released:%d deposit:%d", assetAddress, released, deposit);
            
            StructureData.SettlementCashflowResult memory instruction = StructureData.SettlementCashflowResult({
                newReleasedAmount: released,
                newDepositAmount: deposit,
                leftOverAmount: leftOver,
                contractAddress: assetAddress
            }); 
            settlementCashflowResult[assetAddress] = instruction;
            releasedAmount[assetAddress] = 0;
            depositAmount[assetAddress] = 0;
            //todo: check overflow
            leftOverAmount[assetAddress] = leftOver + int256(deposit) - int256(released);
        }

        underSettlement = false; 
    } 


    function setOptionParameters(StructureData.OptionParameters[] memory _parameters) external override onlyRole(StructureData.SETTLER_ROLE) {

          uint256 count = _parameters.length;        
          if (currentRound <= 1) {
             require(count == 0, "nothing to set");
          }         
          require(!underSettlement, "Being settled"); 
          for(uint256 i = 0; i < count; i++) {
              StructureData.OptionParameters memory parameter = _parameters[i];
              setOptionParametersByOption(parameter);
          }
    }

    //todo: whitelist / nonReentrancy check
    function withdrawAsset(address _trader, address _asset) external override onlyRole(StructureData.SETTLER_ROLE) nonReentrant{
        int256 balance  = leftOverAmount[_asset]; 
        require(balance > 0, "nothing to withdraw");
        assetTraderWithdrawn[_asset] = uint256(balance);
         _withdraw(_trader, uint256(balance), _asset);
         leftOverAmount[_asset] = 0;
    }

    function balanceEnough(address _asset) public override view returns(bool) {
        int256 balance  = leftOverAmount[_asset]; 
        if (balance >= 0) {
            return true;
        }
        uint256 availableBalance = getAvailableBalance(_asset); 
        if (availableBalance == 0) {
            return false;
        }
         
        return (balance + getBalanceChange(_asset)) >= 0;
    }



    function getAvailableBalance(address _asset) private view returns(uint256) {
       if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(address(this)); 
       }
       else{
          return address(this).balance;
       }
    } 
     
    function getBalanceChange(address _asset) private view returns(int256){
        int256 availableBalance = int256(getAvailableBalance(_asset));  
        int256 balanceAfterSettle = int256(assetBalanceAfterSettle[_asset]);
        int256 withdrawableAfterSettle = int256(assetWithdrawableAfterSettle[_asset]);
        int256 withdrawableNow = int256(collectWithdrawable(_asset)); 
        int256 traderWithdraw = int256(assetTraderWithdrawn[_asset]); 
        int256 leastBalance =  balanceAfterSettle + withdrawableNow - withdrawableAfterSettle; 
        return availableBalance - leastBalance + traderWithdraw; 
    }
 
    function collectWithdrawable(address _asset) private view returns(uint256) {
         
         uint256 total = 0;
         for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i]; 
            if (pair.depositAsset == _asset ||
                pair.counterPartyAsset == _asset) {
               total = total.add(getWithdrawable(_asset, pair.callOptionId))
               .add(getWithdrawable(_asset, pair.putOptionId)); 
            }   
        }
        return total;
    }
    event Received(address indexed source, uint amount);
    receive() external payable { 
        emit Received(msg.sender, msg.value);
    }


    function rollToNextByOption(uint256 _quota, uint8 _optionId) internal virtual returns(uint256 _pendingAmount);
    function dryRunSettlementByOption(bool _execute, uint8 _optionId) internal virtual view returns(StructureData.SettlementAccountingResult memory _result);
    function closePreviousByOption(bool _execute, uint8 _optionId) internal virtual returns(StructureData.MaturedState memory _maturedState);
    function commitCurrentByOption(uint8 _optionId) internal virtual;
    function setOptionParametersByOption(StructureData.OptionParameters memory _optionParameters) internal virtual; 
    function getWithdrawable(address _asset, uint8 _optionId) public virtual view returns(uint256);
}