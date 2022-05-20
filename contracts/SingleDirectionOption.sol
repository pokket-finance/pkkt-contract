// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import "./interfaces/IDOVOption.sol";
import "./OptionVaultManager.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SingleDirectionOption is OptionVaultManager, IDOVOption {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeMath for uint256;
    using Utils for uint256;
    using OptionLifecycle for StructureData.UserState;
 

    modifier validateOptionById(uint8 _optionId) {
        require(_optionId != 0 && _optionId < optionCount);
        _;
    }

    function getAccountBalance(uint8 _optionId)
        external
        view
        override
        returns (StructureData.UserBalance memory)
    {
        return
            OptionLifecycle.getAccountBalance(
                optionData[_optionId],
                msg.sender,
                underSettlement,
                currentRound
            );
    }

    function getOptionSnapShot(uint8 _optionId)
        external
        view
        override
        returns (StructureData.OptionSnapshot memory)
    {
        return
            OptionLifecycle.getOptionSnapShot(
                optionData[_optionId],
                underSettlement,
                currentRound
            );
    }

    function initiateWithraw(uint8 _optionId, uint256 _assetToTerminate)
        external
        override 
        validateOptionById(_optionId)
    {
        //require(_assetToTerminate > 0 , "!_assetToTerminate");
        //require(currentRound > 1, "No on going"); 
        OptionLifecycle.initiateWithrawStorage(
            optionData[_optionId],
            msg.sender,
            _assetToTerminate,
            underSettlement,
            currentRound
        );
    }

    function cancelWithdraw(uint8 _optionId, uint256 _assetToTerminate)
        external
        override
        validateOptionById(_optionId)
    {
        //require(_assetToTerminate > 0 , "!_assetToTerminate");
        //require(currentRound > 1, "No on going"); 

        OptionLifecycle.cancelWithdrawStorage(
            optionData[_optionId],
            msg.sender,
            _assetToTerminate,
            underSettlement,
            currentRound
        );
    }
    
    //withdraw pending and expired amount
    function withdraw(
        uint8 _optionId,
        uint256 _amount
    ) external override 
        validateOptionById(_optionId) lock{
        address asset = optionDefinitions[_optionId].asset;  
        OptionLifecycle.withdrawStorage(
            optionData[_optionId],
            msg.sender,
            _amount);
        OptionLifecycle.withdraw(msg.sender, _amount, asset);
    }

    //deposit eth
    function depositETH(uint8 _optionId) external payable override 
        validateOptionById(_optionId){ 

        require(msg.value > 0, "no value"); 
        address asset = optionDefinitions[_optionId].asset; 
        require(asset == address(0), "!ETH");
        StructureData.OptionData storage data = optionData[_optionId];
        require(data.cutOffAt > 0, "!started");
        
        uint256 totalWithDepositedAmount = data.totalToSell.add(totalPending).add(msg.value); 
        require(totalWithDepositedAmount <= data.maxCapacity, "Exceeds cap");  
        OptionLifecycle.depositFor(
            data,
            msg.sender,
            msg.value);
  
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _optionId, uint256 _amount) external override 
        validateOptionById(_optionId){
        require(msg.value > 0, "no value"); 
        address asset = optionDefinitions[_optionId].asset; 
        require(asset != address(0), "ETH");
        StructureData.OptionData storage data = optionData[_optionId];
        require(data.cutOffAt > 0, "!started");
        
        uint256 totalWithDepositedAmount = data.totalToSell.add(totalPending).add(msg.value); 
        require(totalWithDepositedAmount <= data.maxCapacity, "Exceeds cap");  

        OptionLifecycle.depositFor(
            data,
            msg.sender); 
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
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

    function getOptionStateByRound(uint8 _optionId, uint16 _round)
        external
        view
        override
        returns (StructureData.OptionState memory)
    {
        return optionData[_optionId].optionStates[_round];
    }

    function autoRollToCounterPartyByOption(
        StructureData.OptionData storage _option,
        StructureData.OptionState storage _optionState,
        StructureData.OptionData storage _counterPartyOption,
        uint8 _counterPartyOptionId,
        uint256 _totalReleased,
        uint256 _totalAutoRoll
    ) internal override {
        uint256 totalAutoRollBase = uint256(_optionState.totalAmount).sub(
            _optionState.totalTerminate
        );
        if (_option.assetToTerminateForNextRound > 0 && _totalAutoRoll > 0) {
            _option.assetToTerminateForNextRound = uint256(_option
                .assetToTerminateForNextRound)
                .subOrZero(
                    totalAutoRollBase.withPremium(_optionState.premiumRate)
                ).toUint128();
        }
        uint256 userCount = _option.usersInvolved.length;
        for (uint256 i = 0; i < userCount; i++) {
            address userAddress = _option.usersInvolved[i];
            StructureData.UserState storage userState = _option.userStates[
                userAddress
            ];

            if (userState.ongoingAsset == 0) {
                continue;
            }
            uint256 amountToTerminate = Utils.getAmountToTerminate(
                _totalReleased,
                userState.assetToTerminate,
                _optionState.totalTerminate
            );
            if (amountToTerminate > 0) {
                userState.releasedCounterPartyAssetAmount = uint256(userState
                    .releasedCounterPartyAssetAmount)
                    .add(amountToTerminate).toUint128();
            }
            uint256 onGoing = uint256(userState.ongoingAsset).sub(
                userState.assetToTerminate
            );
            uint256 remainingAmount = Utils.getAmountToTerminate(
                _totalAutoRoll,
                onGoing,
                totalAutoRollBase
            );
            if (remainingAmount > 0) {
                uint256 onGoingTerminate = 0;
                uint256 virtualOnGoing = onGoing.withPremium(
                    _optionState.premiumRate
                );
                if (userState.assetToTerminateForNextRound <= virtualOnGoing) {
                    onGoingTerminate = Utils.getAmountToTerminate(
                        remainingAmount,
                        userState.assetToTerminateForNextRound,
                        virtualOnGoing
                    );
                } else {
                    onGoingTerminate = remainingAmount;
                }
                OptionLifecycle.depositFor(
                    _counterPartyOption,
                    userAddress,
                    remainingAmount,
                    onGoingTerminate,
                    currentRound - 1,
                    false
                );
                emit Deposit(
                    _counterPartyOptionId,
                    userAddress,
                    currentRound - 1,
                    remainingAmount
                );
            }
            userState.assetToTerminate = 0;
        }
    }

    function autoRollByOption(
        StructureData.OptionData storage _option,
        uint8 _optionId,
        StructureData.OptionState storage _optionState,
        uint256 _totalReleased,
        uint256 _totalAutoRoll
    ) internal override {
        //uint256 lockedRound = currentRound - 1;

        uint256 totalAutoRollBase = uint256(_optionState.totalAmount).sub(
            _optionState.totalTerminate
        );
        uint256 userCount = _option.usersInvolved.length;
        for (uint256 i = 0; i < userCount; i++) {
            address userAddress = _option.usersInvolved[i];
            StructureData.UserState storage userState = _option.userStates[
                userAddress
            ];
            if (userState.ongoingAsset == 0) {
                continue;
            }

            uint256 amountToTerminate = Utils.getAmountToTerminate(
                _totalReleased,
                userState.assetToTerminate,
                _optionState.totalTerminate
            );
            if (amountToTerminate > 0) {
                userState.releasedDepositAssetAmount = uint256(userState
                    .releasedDepositAssetAmount)
                    .add(amountToTerminate).toUint128();
            }
            uint256 remainingAmount = Utils.getAmountToTerminate(
                _totalAutoRoll,
                uint256(userState.ongoingAsset).sub(userState.assetToTerminate),
                totalAutoRollBase
            );
            if (remainingAmount > 0) {
                OptionLifecycle.depositFor(
                    _option,
                    userAddress,
                    remainingAmount,
                    0,
                    currentRound - 1,
                    false
                );
                emit Deposit(
                    _optionId,
                    userAddress,
                    currentRound - 1,
                    remainingAmount
                );
            }

            userState.assetToTerminate = 0;
        }
    }
}
