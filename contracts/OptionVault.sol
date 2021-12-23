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
    address[] private asset;  
    mapping(address=>bool) private assetExistence;
    mapping(address=>StructureData.SettlementCashflowResult) public settlementCashflowResult; 
    mapping(address=>uint256) private releasedAmount; //debit
    mapping(address=>uint256) private depositAmount; //credit
    mapping(address=>int256) private leftOverAmount;  //history balance
    
    /*
     * actual balance perspective
     */
    mapping(address=>uint256) private assetBalanceBeforeSettle;
    mapping(address=>uint256) private assetRedeemableBeforeSettle;

    /*
     * accounting perspective(based on option pair)
     */ 
    StructureData.OptionPairDefinition[] private optionPairs;
    StructureData.OptionPairExecutionAccountingResult[] public executionAccountingResult; 


    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    constructor(address _settler) {
       // Contract deployer will be able to grant and revoke option role
       _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
       _setupRole(SETTLER_ROLE, _settler); 
    }
    
    function addOption(address _optionContract) public override onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(OPTION_ROLE, _optionContract);  
    }

    function removeOption(address _optionContract) public override onlyRole(DEFAULT_ADMIN_ROLE){
        revokeRole(OPTION_ROLE, _optionContract);  
    }
    function getAddress() public view override returns(address){
        return address(this);
    }

     
    function withdraw(address _target, uint256 _amount, address _contractAddress, bool _redeem) external override onlyRole(OPTION_ROLE){
         if (!_redeem) {
             require(balanceEnough(_contractAddress), "Released amount not available yet");
         }
        _withdraw(_target, _amount, _contractAddress);
    }
    function addAssetIfNeeded(address _asset) private{
        if (!assetExistence[_asset]) {
            assetExistence[_asset] = true;
            asset.push(_asset);
        }
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
        optionPairs.push(_pair);
        //IPKKTStructureOption(_pair.callOption).setCounterPartyOption(_pair.putOption);
        //IPKKTStructureOption(_pair.putOption).setCounterPartyOption(_pair.callOption);
        addAssetIfNeeded(_pair.callOptionDeposit);
        addAssetIfNeeded(_pair.putOptionDeposit); 
    }

    function removeOptionPair(StructureData.OptionPairDefinition memory _pair) external override onlyRole(DEFAULT_ADMIN_ROLE){
        removeOption(_pair.callOption);
        removeOption(_pair.putOption);
        uint256 count = optionPairs.length;
        for(uint256 i = 0; i < count; i++) {
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


    function initiateSettlement() external override onlyRole(SETTLER_ROLE) {
        currentRound = currentRound + 1;
        if (currentRound > 1) { 
            delete executionAccountingResult;
        } 
        uint256 count = optionPairs.length; 
        for(uint256 i = 0; i < count; i++) {
            StructureData.OptionPairDefinition memory pair = optionPairs[i];
            if (pair.callOption == address(0) &&
                pair.putOption == address(0)) {
                continue;
            }
            IExecuteSettlement callOption = IExecuteSettlement(pair.callOption);
            IExecuteSettlement putOption = IExecuteSettlement(pair.putOption);
            uint256 pending1 = callOption.rollToNext(MAX_INT);
            uint256 pending2 = putOption.rollToNext(MAX_INT);

            if (currentRound == 1) {
                if (pending1 > 0) { 
                    depositAmount[pair.callOptionDeposit] = depositAmount[pair.callOptionDeposit].add(pending1);
                }
                if (pending2 > 0) { 
                    depositAmount[pair.putOptionDeposit] = depositAmount[pair.putOptionDeposit].add(pending2);
                }
                continue;
            }
            StructureData.SettlementAccountingResult memory noneExecuteCallOption = callOption.dryRunSettlement(false);
            StructureData.SettlementAccountingResult memory noneExecutePutOption = putOption.dryRunSettlement(false);
            StructureData.OptionPairExecutionAccountingResult memory pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.NoExecution,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult.push(pairResult); 
            StructureData.SettlementAccountingResult memory executeCallOption = callOption.dryRunSettlement(true); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult2 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecuteCall,
                callOptionResult: executeCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult.push(pairResult2);

            StructureData.SettlementAccountingResult memory executePutOption = putOption.dryRunSettlement(true); 
            StructureData.OptionPairExecutionAccountingResult memory pairResult3 = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecutePut,
                callOptionResult: noneExecuteCallOption,
                putOptionResult: executePutOption
            });
            executionAccountingResult.push(pairResult3);  
        } 
    }

    function settle(StructureData.OptionPairExecution[] memory _execution) external override onlyRole(SETTLER_ROLE) {  

        uint256 count = _execution.length; 
        if (currentRound <= 2) {
            require(count == 0, "no matured round");
        }
        for(uint256 i = 0; i < count; i++) { 
            StructureData.OptionPairExecution memory pair = _execution[i];
            (address callOptionDeposit, address putOptionDeposit) = getDespositAddress(pair.callOption, pair.putOption); 
            IExecuteSettlement callOption = IExecuteSettlement(pair.callOption);
            IExecuteSettlement putOption = IExecuteSettlement(pair.putOption); 
            StructureData.MaturedState memory maturedState;
            StructureData.MaturedState memory maturedState2;
            uint256 deposit;
            uint256 deposit2;

            if (pair.execute == StructureData.OptionExecution.NoExecution) {
                (maturedState, deposit) = callOption.closePrevious(false);
                (maturedState2, deposit2) = putOption.closePrevious(false); 
            }
            else if (pair.execute == StructureData.OptionExecution.ExecuteCall) {
                (maturedState, deposit) = callOption.closePrevious(true);
                (maturedState2, deposit2) = putOption.closePrevious(false); 
            }
            if (pair.execute == StructureData.OptionExecution.ExecutePut) {
                (maturedState, deposit) = callOption.closePrevious(false);
                (maturedState2, deposit2) = putOption.closePrevious(true); 
            }

            if (maturedState.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[callOptionDeposit];
                releasedAmount[callOptionDeposit] = releasedDepositAssetAmount.add(maturedState.releasedDepositAssetAmount); 
            }
            if (maturedState.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[putOptionDeposit];
                releasedAmount[putOptionDeposit] = releasedCounterPartyAssetAmount.add(maturedState.releasedCounterPartyAssetAmount); 
            }  
            if (deposit > 0) { 
                depositAmount[callOptionDeposit] = depositAmount[callOptionDeposit].add(deposit);
            }
            
            if (maturedState2.releasedDepositAssetAmount > 0) {
                uint256 releasedDepositAssetAmount  = releasedAmount[putOptionDeposit];
                releasedAmount[putOptionDeposit] = releasedDepositAssetAmount.add(maturedState2.releasedDepositAssetAmount); 
            }
            if (maturedState2.releasedCounterPartyAssetAmount > 0) {
                uint256 releasedCounterPartyAssetAmount = releasedAmount[callOptionDeposit];
                releasedAmount[callOptionDeposit] = releasedCounterPartyAssetAmount.add(maturedState2.releasedCounterPartyAssetAmount); 
            }  
            if (deposit2 > 0) { 
                depositAmount[putOptionDeposit] = depositAmount[putOptionDeposit].add(deposit2);
            }
        }

        uint256 assetCount = asset.length; 
        for(uint256 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            
            int256 leftOver = leftOverAmount[assetAddress]; 
            if (leftOver < 0) //missing balance, fix it if trader deposits
            {
               int256 balanceChange = getBalanceChange(assetAddress);
               leftOver = leftOver + balanceChange;
            }

            assetBalanceBeforeSettle[assetAddress] = getAvailableBalance(assetAddress);
            assetBalanceBeforeSettle[assetAddress] = collectWithdrawable(assetAddress);
            uint256 released = releasedAmount[assetAddress];
            uint256 deposit = depositAmount[assetAddress];
            
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


    function commitCurrent(StructureData.OptionParameters[] memory _parameters) external override onlyRole(SETTLER_ROLE) {

          uint256 count = _parameters.length;        
          if (currentRound == 1) {
             require(count == 0, "no locked round");
          }
          for(uint256 i = 0; i < count; i++) {
              StructureData.OptionParameters memory parameter = _parameters[i];
              IExecuteSettlement(parameter.option).commitCurrent(parameter);
          }
    }

    function withdrawAsset(address _trader, address _asset) external override onlyRole(SETTLER_ROLE) {
        int256 balance  = leftOverAmount[_asset]; 
        require(balance > 0, "nothing to withdraw");
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
        uint256 count = optionPairs.length; 
        for(uint256 i = 0; i < count; i++) {
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
        uint256 availableBalance = getAvailableBalance(_asset);  
        uint256 balanceBeforeSettle = assetBalanceBeforeSettle[_asset];
        uint256 redeemableBeforeSettle = assetRedeemableBeforeSettle[_asset];
        uint256 redeemableNow = collectWithdrawable(_asset); 
        uint256 leastBalance = balanceBeforeSettle.add(redeemableNow).sub(redeemableBeforeSettle); 
        return int256(availableBalance) - int256(leastBalance); 
    }
 
    function collectWithdrawable(address _asset) private view returns(uint256) {
         uint256 count = optionPairs.length;
         uint256 total = 0;
        for(uint256 i = 0; i < count; i++) {
            StructureData.OptionPairDefinition memory pair = optionPairs[i];
            if (pair.callOption == address(0) &&
                pair.putOption == address(0)) {
                continue;
            }
            if (pair.callOptionDeposit == _asset ||
                pair.putOptionDeposit == _asset) {
               total = total.add(IPKKTStructureOption(pair.callOption).getWithdrawable(_asset)); 
               total = total.add(IPKKTStructureOption(pair.putOption).getWithdrawable(_asset)); 
            }   
        }
        return total;
    }
    event Received(address indexed source, uint amount);
    receive() external payable { 
        emit Received(msg.sender, msg.value);
    }
}