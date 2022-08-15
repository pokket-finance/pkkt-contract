// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol"; 
//import "hardhat/console.sol";

import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import {OptionVaultStorage} from "./storage/OptionVaultStorage.sol";
import "./interfaces/ISettlementAggregator.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract OptionVaultBase is
    OptionVaultStorage, 
    ISettlementAggregator
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Utils for uint256;
    using SafeCast for uint256;
    using SafeCast for int256;

    event ManagerChanged(address indexed oldManager, address indexed newManager); 

    event AdminChanged(address indexed oldAdmin, address indexed newAdmin); 


    function clientWithdraw(
        address _target,
        uint256 _amount,
        address _contractAddress,
        bool _redeem
    ) internal lock {
        if (!_redeem) {
            require(balanceEnough(_contractAddress));
        }
        OptionLifecycle.withdraw(_target, _amount, _contractAddress);
    }
    function setAdminInternal(address _admin) internal {
        address oldAdminAddress = adminRoleAddress;
        adminRoleAddress = _admin;
        emit AdminChanged(oldAdminAddress, _admin);
    }  
    function setManagerInternal(address _manager) internal {
        address oldManagerAddress = managerRoleAddress;
        managerRoleAddress = _manager;
        emit ManagerChanged(oldManagerAddress, _manager);
    }  
    function addOptionPairsInternal(
        StructureData.OptionPairDefinition[] memory _optionPairDefinitions
    ) internal { 
        uint256 length = _optionPairDefinitions.length;
        uint8 optionPairCount_ = optionPairCount;
        uint8 assetCount_ = assetCount;
        for (uint256 i = 0; i < length; i++) {
            StructureData.OptionPairDefinition
                memory pair = _optionPairDefinitions[i];
            pair.callOptionId = optionPairCount_ * 2 + 1;
            pair.putOptionId = pair.callOptionId + 1;
            optionPairs[optionPairCount_++] = pair;
            if (assetCount_ == 0) {
                asset[assetCount_++] = pair.depositAsset;
                asset[assetCount_++] = pair.counterPartyAsset;
            } else {
                bool callAdded = false;
                bool putAdded = false;
                for (uint8 j = 0; j < assetCount_; j++) {
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


    function toggleOptionPairDeposit(uint8 _pairId) external override onlyAdmin {
        StructureData.OptionPairDefinition storage pair = optionPairs[_pairId];
        pair.manualDepositDisabled = !pair.manualDepositDisabled;
    }
    
    function initiateSettlement() external override onlyAdmin { 
        require(!underSettlement);
        currentRound = currentRound + 1;
        underSettlement = true;
        for (uint8 i = 0; i < optionPairCount; i++) {
            StructureData.OptionPairDefinition storage pair = optionPairs[i];
            StructureData.OptionData storage callOption = optionData[
                pair.callOptionId
            ];
            uint128 pending1 = OptionLifecycle.rollToNextByOption(
                callOption,
                currentRound,
                true
            );
            StructureData.OptionData storage putOption = optionData[
                pair.putOptionId
            ];
            uint128 pending2 = OptionLifecycle.rollToNextByOption(
                putOption,
                currentRound,
                false
            );
            if (pending1 > 0) {
                assetData[pair.depositAsset].depositAmount = uint256(assetData[
                    pair.depositAsset
                ].depositAmount).add(pending1).toUint128();
            }
            if (pending2 > 0) {
                assetData[pair.counterPartyAsset].depositAmount = uint256(assetData[
                    pair.counterPartyAsset
                ].depositAmount).add(pending2).toUint128();
            }
            if (currentRound <= 2) {
                continue;
            }

            StructureData.SettlementAccountingResult
                memory noneExecuteCallOption = OptionLifecycle
                    .dryRunSettlementByOption(
                        callOption, 
                        true,
                        pair.depositAssetAmountDecimals,
                        pair.counterPartyAssetAmountDecimals,
                        currentRound,
                        false
                    );
            StructureData.SettlementAccountingResult
                memory noneExecutePutOption = OptionLifecycle
                    .dryRunSettlementByOption(
                        putOption, 
                        false,
                        pair.counterPartyAssetAmountDecimals,
                        pair.depositAssetAmountDecimals,
                        currentRound,
                        false
                    );

            StructureData.OptionPairExecutionAccountingResult
                memory pairResult = StructureData
                    .OptionPairExecutionAccountingResult({
                        execute: StructureData.OptionExecution.NoExecution,
                        callOptionResult: noneExecuteCallOption,
                        putOptionResult: noneExecutePutOption
                    });
            executionAccountingResult[i * 3] = pairResult;
            StructureData.SettlementAccountingResult
                memory executeCallOption = OptionLifecycle
                    .dryRunSettlementByOption(
                        callOption, 
                        true,
                        pair.depositAssetAmountDecimals,
                        pair.counterPartyAssetAmountDecimals,
                        currentRound,
                        true
                    );
            pairResult = StructureData.OptionPairExecutionAccountingResult({
                execute: StructureData.OptionExecution.ExecuteCall,
                callOptionResult: executeCallOption,
                putOptionResult: noneExecutePutOption
            });
            executionAccountingResult[i * 3 + 1] = pairResult;

            StructureData.SettlementAccountingResult
                memory executePutOption = OptionLifecycle
                    .dryRunSettlementByOption(
                        putOption, 
                        false,
                        pair.counterPartyAssetAmountDecimals,
                        pair.depositAssetAmountDecimals,
                        currentRound,
                        true
                    );
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
            for(uint8 i = 1; i <= optionPairCount * 2; i++) { 
                OptionLifecycle.commitByOption(optionData[i], 1); 
            }            
            updateAsset();
            underSettlement = false;
        }
    }

    function settle(StructureData.OptionExecution[] memory _executions)
        external
        override 
        onlyManager
    { 
        require(underSettlement);
        uint256 count = _executions.length;
        require(count == optionPairCount);
        uint16 previousRound = currentRound - 1;
        for (uint8 i = 0; i < count; i++) {
            StructureData.OptionExecution execution = _executions[i];
            StructureData.OptionPairDefinition storage pair = optionPairs[i];

            StructureData.OptionData storage callOption = optionData[
                pair.callOptionId
            ];
            StructureData.OptionData storage putOption = optionData[
                pair.putOptionId
            ];
            StructureData.MaturedState memory maturedState;
            StructureData.OptionState
                storage previousCallOptionState = callOption.optionStates[
                    previousRound - 1
                ];
            if (previousCallOptionState.totalAmount > 0) { 
                maturedState = OptionLifecycle.closePreviousByOption(
                    callOption,
                    previousCallOptionState,
                    true,
                    pair.depositAssetAmountDecimals,
                    pair.counterPartyAssetAmountDecimals,
                    execution == StructureData.OptionExecution.ExecuteCall
                );
                if (maturedState.releasedDepositAssetAmount > 0) {
                    assetData[pair.depositAsset].releasedAmount = uint256(assetData[
                        pair.depositAsset
                    ].releasedAmount).add(
                            maturedState.releasedDepositAssetAmountWithPremium
                        ).toUint128();
                } else if (maturedState.releasedCounterPartyAssetAmount > 0) {
                    assetData[pair.counterPartyAsset]
                        .releasedAmount = uint256(assetData[pair.counterPartyAsset]
                        .releasedAmount)
                        .add(
                            maturedState
                                .releasedCounterPartyAssetAmountWithPremium
                        ).toUint128();
                }
                if (execution == StructureData.OptionExecution.ExecuteCall) {
                    autoRollToCounterPartyByOption(
                        callOption,
                        previousCallOptionState,
                        putOption,
                        pair.putOptionId,
                        maturedState.releasedCounterPartyAssetAmountWithPremium,
                        maturedState.autoRollCounterPartyAssetAmountWithPremium
                    );
                } else {
                    autoRollByOption(
                        callOption,
                        pair.callOptionId,
                        previousCallOptionState,
                        maturedState.releasedDepositAssetAmountWithPremium,
                        maturedState.autoRollDepositAssetAmountWithPremium
                    );
                }
            }
            else { 
               previousCallOptionState.executed =  execution == StructureData.OptionExecution.ExecuteCall;
            }

            StructureData.OptionState storage previousPutOptionState = putOption
                .optionStates[previousRound - 1];

            if (previousPutOptionState.totalAmount > 0) { 
                maturedState = OptionLifecycle.closePreviousByOption(
                    putOption,
                    previousPutOptionState,
                    false,
                    pair.counterPartyAssetAmountDecimals,
                    pair.depositAssetAmountDecimals,
                    execution == StructureData.OptionExecution.ExecutePut
                );
                if (maturedState.releasedDepositAssetAmount > 0) {
                    assetData[pair.counterPartyAsset]
                        .releasedAmount = uint256(assetData[pair.counterPartyAsset]
                        .releasedAmount)
                        .add(
                            maturedState.releasedDepositAssetAmountWithPremium
                        ).toUint128();
                } else if (maturedState.releasedCounterPartyAssetAmount > 0) {
                    assetData[pair.depositAsset].releasedAmount = uint256(assetData[
                        pair.depositAsset
                    ].releasedAmount).add(
                            maturedState
                                .releasedCounterPartyAssetAmountWithPremium
                        ).toUint128();
                }
                if (execution == StructureData.OptionExecution.ExecutePut) {
                    autoRollToCounterPartyByOption(
                        putOption,
                        previousPutOptionState,
                        callOption,
                        pair.callOptionId,
                        maturedState.releasedCounterPartyAssetAmountWithPremium,
                        maturedState.autoRollCounterPartyAssetAmountWithPremium
                    );
                } else {
                    autoRollByOption(
                        putOption,
                        pair.putOptionId,
                        previousPutOptionState,
                        maturedState.releasedDepositAssetAmountWithPremium,
                        maturedState.autoRollDepositAssetAmountWithPremium
                    );
                }
            }
            else { 
               previousPutOptionState.executed =  execution == StructureData.OptionExecution.ExecutePut;
            }
            OptionLifecycle.commitByOption(callOption, previousRound);
            OptionLifecycle.commitByOption(putOption, previousRound);
        }

        updateAsset();
        underSettlement = false;
    }

    function updateAsset() private {
        for (uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            StructureData.AssetData storage assetSubData = assetData[
                assetAddress
            ];
            //no snaphot previously, so, no balance change 
            StructureData.SettlementCashflowResult
                memory instruction = StructureData.SettlementCashflowResult({
                    newReleasedAmount: assetSubData.releasedAmount,
                    newDepositAmount: assetSubData.depositAmount,
                    leftOverAmount: assetSubData.leftOverAmount,
                    contractAddress: assetAddress,
                    sentOrWithdrawn: false
                });
            settlementCashflowResult[assetAddress] = instruction;
            //todo: check overflow
            assetSubData.leftOverAmount =
                int128(assetSubData.leftOverAmount +
                int128(assetSubData.depositAmount) -
                int128(assetSubData.releasedAmount));
            assetSubData.depositAmount = 0;
            assetSubData.releasedAmount = 0;
        }
    }

    function setOptionParameters(
        uint256[] memory _parameters
    ) external override onlyAdmin { 
        uint256 count = _parameters.length; 
        require(!underSettlement);
        require(currentRound > 1);
        require(count == optionPairCount*2);
        for (uint8 i = 0; i < count; i++) {
            uint256 parameter = _parameters[i];
            StructureData.OptionState storage optionState = optionData[i+1].optionStates[currentRound - 1];
            OptionLifecycle.setOptionParameters(parameter, optionState); 
        }
    }

    
    function withdrawAssets() external override lock onlyManager{  
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            StructureData.AssetData storage assetSubData = assetData[assetAddress];
            if (assetSubData.leftOverAmount <= 0) continue;
            uint128 leftOver = uint128(assetSubData.leftOverAmount);
            OptionLifecycle.withdraw(msg.sender, uint256(leftOver), assetAddress); 
            moneyMovements[assetAddress][currentRound] = StructureData.MoneyMovementData({
                blockTime:block.timestamp,
                movementAmount:assetSubData.leftOverAmount,
                manager:msg.sender
            });
            assetSubData.leftOverAmount = 0;
            settlementCashflowResult[assetAddress].sentOrWithdrawn = true;
        }  
    }
    
    //todo: improve performance later
    function sendBackAssets() external payable override lock onlyManager{  
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            StructureData.AssetData storage assetSubData = assetData[assetAddress];  
            if (assetSubData.leftOverAmount >= 0) continue;
            uint128 needed = uint128(-assetSubData.leftOverAmount);

            if (assetAddress == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
                require(needed >= msg.value, "Not enough eth");
                //transfer back extra
                if (needed > msg.value) {
                    payable(msg.sender).transfer(needed - msg.value);
                }
            } else {
                IERC20(assetAddress).safeTransferFrom(
                    msg.sender,
                    address(this), 
                    needed
                );
            }  
            moneyMovements[assetAddress][currentRound] = StructureData.MoneyMovementData({
                blockTime:block.timestamp,
                movementAmount:assetSubData.leftOverAmount,
                manager:msg.sender
            });
            assetSubData.leftOverAmount = 0;
            settlementCashflowResult[assetAddress].sentOrWithdrawn = true;
        } 
    }
    
    function getMoneyMovements() external override view returns(StructureData.MoneyMovementResult[] memory) {
        uint256 count = 0;
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            for(uint16 round = 1; round <= currentRound; round++) {
                StructureData.MoneyMovementData memory data = moneyMovements[assetAddress][round];
                if (data.manager != address(0)) {
                    count++;
                }
            } 
        } 
        StructureData.MoneyMovementResult[] memory result = new StructureData.MoneyMovementResult[](count);
        if (count == 0) return result;
        count = 0;
        for(uint8 i = 0; i < assetCount; i++) {
            address assetAddress = asset[i];
            for(uint16 round = 1; round <= currentRound; round++) {
                StructureData.MoneyMovementData memory data = moneyMovements[assetAddress][round];
                if (data.manager != address(0)) {
                    result[count] = StructureData.MoneyMovementResult({
                        blockTime: data.blockTime,
                        movementAmount: data.movementAmount,
                        asset: assetAddress,
                        manager: data.manager
                    });
                    count++;
                }
            } 
        } 
        return result;
    }

    function balanceEnough(address _asset) public view override returns (bool) {
        StructureData.AssetData storage assetSubData = assetData[_asset]; 
        return assetSubData.leftOverAmount >= 0;
    }

  
    modifier lock {
        require(locked == 0, "locked");
        locked = 1;
        _;
        locked = 0;
    }
    modifier onlyManager() {
         require(managerRoleAddress == msg.sender, "!manager"); 
         _;
    }
    modifier onlyAdmin() {
         require(adminRoleAddress == msg.sender, "!admin"); 
         _;
    }
    function autoRollToCounterPartyByOption(
        StructureData.OptionData storage _option,
        StructureData.OptionState storage _optionState,
        StructureData.OptionData storage _counterPartyOption,
        uint8 _counterPartyOptionId,
        uint256 _totalReleased,
        uint256 _totalAutoRoll
    ) internal virtual;

    function autoRollByOption(
        StructureData.OptionData storage _option,
        uint8 _optionId,
        StructureData.OptionState storage _optionState,
        uint256 _totalReleased,
        uint256 _totalAutoRoll
    ) internal virtual;
}
