// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";      
import "./interfaces/IOptionVault.sol"; 
import "./interfaces/ISettlementAggregator.sol"; 
import "./interfaces/IExecuteSettlement.sol"; 
import "./interfaces/IPKKTStructureOption.sol";

contract OptionVault is IOptionVault, ISettlementAggregator, AccessControl {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
     
     uint256 public override currentRound; 
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
    uint8 optionPairCount;
    mapping(uint8 => StructureData.OptionPairDefinition) private optionPairs;
    
    mapping(uint8 => StructureData.OptionPairExecutionAccountingResult) public executionAccountingResult; 
 

    constructor(address _settler) {
       // Contract deployer will be able to grant and revoke option role
       _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
       _setupRole(StructureData.SETTLER_ROLE, _settler); 
    }
    
    function addOption(address _optionContract) public override onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(StructureData.OPTION_ROLE, _optionContract);  
    }

    function removeOption(address _optionContract) public override onlyRole(DEFAULT_ADMIN_ROLE){
        revokeRole(StructureData.OPTION_ROLE, _optionContract);  
    }
    function getAddress() public view override returns(address){
        return address(this);
    }

     
    function withdraw(address _target, uint256 _amount, address _contractAddress, bool _redeem) external override onlyRole(StructureData.OPTION_ROLE){
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
 

 
    function addOptionPair(StructureData.OptionPairDefinition memory _pair) external override onlyRole(DEFAULT_ADMIN_ROLE){
        addOption(_pair.callOption);
        addOption(_pair.putOption);   
        
        optionPairs[optionPairCount] = _pair; 
        optionPairCount++; 
        if (assetCount == 0) {
            asset[assetCount] = _pair.callOptionDeposit;
            assetCount ++ ;
            asset[assetCount] = _pair.putOptionDeposit;
            assetCount ++ ;

        }
        else {
            bool callAdded = false;
            bool putAdded = false;
            for(uint8 i = 0; i <assetCount; i++) {
                if (asset[i] == _pair.callOptionDeposit) {
                    callAdded = true;
                }
                if (asset[i] == _pair.putOptionDeposit) {
                    putAdded = true;
                }
            }
            if (!callAdded) { 
                asset[assetCount] = _pair.callOptionDeposit;
                assetCount ++ ;
            }
            if (!putAdded) { 
                asset[assetCount] = _pair.putOptionDeposit;
                assetCount ++ ;
            }
        }
     
    }

    function removeOptionPair(StructureData.OptionPairDefinition memory _pair) external override onlyRole(DEFAULT_ADMIN_ROLE){
        removeOption(_pair.callOption);
        removeOption(_pair.putOption); 
        for(uint8 i = 0; i < assetCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i];
            if (pair.callOption == _pair.callOption &&
                pair.putOption == _pair.putOption) {
                //fake remove
                pair.callOption = address(0);
                pair.putOption = address(0); 
                break;
            }
        }
    }



    uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;


    function initiateSettlement() external override onlyRole(StructureData.SETTLER_ROLE) {
        currentRound = currentRound + 1;  
        for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition memory pair = optionPairs[i];
            if (pair.callOption == address(0) &&
                pair.putOption == address(0)) {
                continue;
            }
            IExecuteSettlement callOption = IExecuteSettlement(pair.callOption);
            IExecuteSettlement putOption = IExecuteSettlement(pair.putOption);
            uint256 pending1 = callOption.rollToNext(MAX_INT);
            uint256 pending2 = putOption.rollToNext(MAX_INT);
            if (pending1 > 0) { 
                depositAmount[pair.callOptionDeposit] = depositAmount[pair.callOptionDeposit].add(pending1);
            }
            if (pending2 > 0) { 
                depositAmount[pair.putOptionDeposit] = depositAmount[pair.putOptionDeposit].add(pending2);
            }
            if (currentRound <= 2) {
                continue;
            }
            StructureData.SettlementAccountingResult memory noneExecuteCallOption = callOption.dryRunSettlement(false);
            StructureData.SettlementAccountingResult memory noneExecutePutOption = putOption.dryRunSettlement(false);
            StructureData.OptionPairExecutionAccountingResult memory pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.NoExecution,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3] = pairResult; 
            StructureData.SettlementAccountingResult memory executeCallOption = callOption.dryRunSettlement(true); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult2 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecuteCall,
                callOptionResult: executeCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3 + 1] = pairResult2; 

            StructureData.SettlementAccountingResult memory executePutOption = putOption.dryRunSettlement(true); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult3 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecutePut,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: executePutOption
            });
            executionAccountingResult[i * 3 + 2] = pairResult3; 
        } 
    }

    function settle(StructureData.OptionPairExecution[] memory _execution) external override onlyRole(StructureData.SETTLER_ROLE) {  

        uint256 count = _execution.length; 
        if (currentRound <= 2) {
            require(count == 0, "no matured round");
        }
        for(uint256 i = 0; i < count; i++) { 
            StructureData.OptionPairExecution memory pair = _execution[i];
            (address callOptionDeposit, address putOptionDeposit) = getDespositAddress(pair.callOption, pair.putOption); 
            //console.log("currentRound %d: callOptionDeposit:%s putOptionDeposit:%s", currentRound, callOptionDeposit,putOptionDeposit );
            IExecuteSettlement callOption = IExecuteSettlement(pair.callOption);
            IExecuteSettlement putOption = IExecuteSettlement(pair.putOption); 
            StructureData.MaturedState memory maturedState;
            StructureData.MaturedState memory maturedState2; 

            if (pair.execute == StructureData.OptionExecution.NoExecution) {
                maturedState = callOption.closePrevious(false);
                maturedState2 = putOption.closePrevious(false); 
            }
            else if (pair.execute == StructureData.OptionExecution.ExecuteCall) {
                maturedState = callOption.closePrevious(true);
                maturedState2 = putOption.closePrevious(false); 
            }
            if (pair.execute == StructureData.OptionExecution.ExecutePut) {
                maturedState = callOption.closePrevious(false);
                maturedState2 = putOption.closePrevious(true); 
            } 
            if (maturedState.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[callOptionDeposit];
                releasedAmount[callOptionDeposit] = releasedDepositAssetAmount.add(maturedState.releasedDepositAssetAmount)
                .add(maturedState.releasedDepositAssetPremiumAmount); 
            }
            else if (maturedState.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[putOptionDeposit];
                releasedAmount[putOptionDeposit] = releasedCounterPartyAssetAmount.add(maturedState.releasedCounterPartyAssetAmount)
                .add(maturedState.releasedCounterPartyAssetPremiumAmount); 
            }  
            
            if (maturedState2.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[putOptionDeposit];
                releasedAmount[putOptionDeposit] = releasedDepositAssetAmount.add(maturedState2.releasedDepositAssetAmount)
                .add(maturedState2.releasedDepositAssetPremiumAmount); 
            }
            else if (maturedState2.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[callOptionDeposit];
                releasedAmount[callOptionDeposit] = releasedCounterPartyAssetAmount.add(maturedState2.releasedCounterPartyAssetAmount)
                .add(maturedState2.releasedCounterPartyAssetPremiumAmount);  
            }  
        }
        if (currentRound > 1) { 
            for(uint8 i = 0; i < optionPairCount; i++) {
                StructureData.OptionPairDefinition memory pair = optionPairs[i];
                if (pair.callOption == address(0) &&
                    pair.putOption == address(0)) {
                    continue;
                }
                IExecuteSettlement callOption = IExecuteSettlement(pair.callOption);
                IExecuteSettlement putOption = IExecuteSettlement(pair.putOption); 
                callOption.commitCurrent();
                putOption.commitCurrent();
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
    } 


    function setOptionParameters(StructureData.OptionParameters[] memory _parameters) external override onlyRole(StructureData.SETTLER_ROLE) {

          uint256 count = _parameters.length;        
          if (currentRound == 1) {
             require(count == 0, "nothing to set");
          }
          for(uint256 i = 0; i < count; i++) {
              StructureData.OptionParameters memory parameter = _parameters[i];
              IExecuteSettlement(parameter.option).setOptionParameters(parameter);
          }
    }

    //todo: whitelist / nonReentrancy check
    function withdrawAsset(address _trader, address _asset) external override onlyRole(StructureData.SETTLER_ROLE) {
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



    function getDespositAddress(address _callOption, address _putOption) private view returns(address _callOptionDesposit, address _putOptionDeposit){
 
        for(uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition memory pair = optionPairs[i];
            if (pair.callOption == _callOption &&
                pair.putOption == _putOption) {
                return (pair.callOptionDeposit, pair.putOptionDeposit);
            }
        }
        revert("invalid callOption/putOption");
    }

    function getAvailableBalance(address _asset) private view returns(uint256) {
       if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(getAddress()); 
       }
       else{
          return getAddress().balance;
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
            StructureData.OptionPairDefinition memory pair = optionPairs[i];
            if (pair.callOption == address(0) &&
                pair.putOption == address(0)) {
                continue;
            }
            if (pair.callOptionDeposit == _asset ||
                pair.putOptionDeposit == _asset) {
               total = total.add(IPKKTStructureOption(pair.callOption).getWithdrawable(_asset))
               .add(IPKKTStructureOption(pair.putOption).getWithdrawable(_asset)); 
            }   
        }
        return total;
    }
    event Received(address indexed source, uint amount);
    receive() external payable { 
        emit Received(msg.sender, msg.value);
    }
}