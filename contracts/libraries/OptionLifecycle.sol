// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Utils.sol";
import "./StructureData.sol";
//import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

library OptionLifecycle {
    using SafeERC20 for IERC20;
    using Utils for uint128;
    using Utils for uint256;
    using SafeMath for uint256;
    using SafeCast for uint256;
    using StructureData for StructureData.UserState;

    function deriveVirtualLocked(
        StructureData.UserState memory userState,
        uint16 premiumRate
    ) internal pure returns (uint256) {
        uint256 onGoing = uint256(userState.ongoingAsset);
        if (onGoing == 0) {
            return uint256(userState.tempLocked);
        }
        onGoing = (onGoing.sub(userState.assetToTerminate)).withPremium(
            premiumRate
        );
        if (userState.tempLocked == 0) {
            return onGoing;
        }
        return uint256(userState.tempLocked).add(onGoing);
    }

    function getAvailableBalance(address _asset, address _source)
        external
        view
        returns (uint256)
    {
        if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(_source);
        } else {
            return _source.balance;
        }
    }

    function withdraw(
        address _target,
        uint256 _amount,
        address _contractAddress
    ) external {
        require(_amount > 0, "!amt");
        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        } else {
            IERC20(_contractAddress).safeTransfer(_target, _amount);
        }
    } 

    function initiateWithrawStorage(
        StructureData.OptionData storage _option,
        address _user,
        uint256 _assetToTerminate
    ) external {
        StructureData.UserState storage userState = _option.userStates[_user];
        if (_underSettlement) {
            uint256 newAssetToTerminate = uint256(userState
                .assetToTerminateForNextRound)
                .add(_assetToTerminate);
            if (_currentRound == 2) {
                require(newAssetToTerminate <= userState.tempLocked);
                StructureData.OptionState storage previousOption = _option
                    .optionStates[_currentRound - 1];
                previousOption.totalTerminate = uint256(previousOption
                    .totalTerminate)
                    .add(_assetToTerminate).toUint128();
            } else {
                StructureData.OptionState storage onGoingOption = _option
                    .optionStates[_currentRound - 2];
                uint256 totalLocked = deriveVirtualLocked(
                    userState,
                    onGoingOption.premiumRate
                );
                require(newAssetToTerminate <= totalLocked);
                //store temporarily
                _option.assetToTerminateForNextRound = uint256(_option
                    .assetToTerminateForNextRound)
                    .add(_assetToTerminate).toUint128();
            }
            userState.assetToTerminateForNextRound = newAssetToTerminate.toUint128();
        } else {
            uint256 newAssetToTerminate = uint256(userState.assetToTerminate).add(
                _assetToTerminate
            );
            require(newAssetToTerminate <= userState.ongoingAsset);
            userState.assetToTerminate = newAssetToTerminate.toUint128();
            StructureData.OptionState storage previousOption = _option
                .optionStates[_currentRound - 1];
            previousOption.totalTerminate = uint256(previousOption.totalTerminate).add(
                _assetToTerminate
            ).toUint128();
        }
    }

    function cancelWithdrawStorage(
        StructureData.OptionData storage _option,
        address _user,
        uint256 _assetToTerminate,
    ) external {
        StructureData.UserState storage userState = _option.userStates[_user];
        if (_option.cutOffAt > block.timestamp) {
           
        } 
    }

    function withdrawStorage(
        StructureData.OptionData storage _option,
        address _user,
        uint256 _amount
    ) external {
        //require(_amount > 0, "!amount");
        StructureData.UserState storage userState = _option.userStates[_user];
        uint totalAvailable = userState.assetExpired.add(userState.pendingAsset);
        require(totalAvailable >= _amount, "Not enough balance");
        if (userState.assetExpired >= _amount) {
            userState.assetExpired = userState.assetExpired.sub(_amount);
            return;
        }
        //todo: what if the buyer doesn't send the premium yet for the expired option, may it be 0 premium?
        userState.assetExpired = 0;
        userState.pendingAsset = userState.pendingAsset.sub(_amount.sub(userState.assetExpired));
    }

    function depositFor(
        StructureData.OptionData storage _state,
        address _userAddress,
        uint256 _amount
    ) external { 

       StructureData.UserState storage userState = _state.userStates[_userAddress];
       //still selling for the current round
       if (_state.cutOffAt > block.timestamp) {
           _state.totalToSell = _state.totalToSell.add(_amount); 
          userState.assetToSell = userState.assetToSell.add(_amount);
       }      
       else {
           _state.totalPending = _state.totalPending.add(_amount);
           userState.pendingAsset = userState.pendingAsset.add(_amount);
       }
    }
}
