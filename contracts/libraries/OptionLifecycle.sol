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
    /// @notice 7 day period between each options sale.
    uint256 public constant PERIOD = 7 days;
    uint256 public constant ROUND_PRICE_DECIMALS = 12;

  

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

   //for withdraw we need to check the deposit
    function initiateWithrawStorage(
        StructureData.VaultState storage _vault,
        address _user,
        uint256 _amountToRedeem
    ) external {
        
        rollToNextRoundIfNeeded(_vault);  

        StructureData.UserState storage state = _vaultState.userStates[_user]; 
        recalcState(_vault, state); 
         
        uint maxInstantRedeemable = state.expiredAmount.sub(state.expiredQueueRedeemAmount);
        uint maxRedeemable = state.onGoingAmount.sub(state.onGoingQueueRedeemAmount).add(maxInstantRedeemable);
        require(_amountToRedeem <= maxRedeemable, "Not enough to redeem");

        //check if the sold amount is expired or not
        //1. withdraw initiated before the sold option expired (buyer not providing the expiry level yet)
        //user could terminate all the sold options, and selling options
        //user would be able to redeem all the sold options after expiry and all the selling option after next expiry
        uint128 price = _vault.depositPriceAfterExpiryPerRound[_vault.round - 2];
        if (price == 0) {
            //first redeem from the sold options
            if (_amountToRedeem <= maxInstantRedeemable) {
                state.expiredQueueRedeemAmount = state.expiredQueueRedeemAmount.add(_amountToRedeem);
                _vault.expired.queuedRedeemAmount = _vault.expired.queuedRedeemAmount.add(_amountToRedeem);
                
            }
            else {
                uint amountToRemdeemNextRound = _amountToRedeem - maxInstantRedeemable;
                state.expiredQueueRedeemAmount = state.expiredAmount;
                state.onGoingQueueRedeemAmount = state.onGoingQueueRedeemAmount.add(amountToRemdeemNextRound);
                _vault.expired.queuedRedeemAmount = _vault.expired.queuedRedeemAmount.sub(maxInstantRedeemable);
                _vault.onGoing.queuedRedeemAmount = _vault.onGoing.queuedRedeemAmount.sub(amountToRemdeemNextRound);
            }
        }   
        //2. withdraw initiated after the sold option expired (expiry level specified)
        //user could terminate all the selling options
        //user would be able to redeem all the selling options after next expiry
        else{
            state.onGoing.queuedRedeemAmount = state.onGoing.queuedRedeemAmount.add(_amountToRedeem);
            _vault.onGoing.queuedRedeemAmount = _vault.onGoing.queuedRedeemAmount.add(_amountToRedeem);
        } 

    }


    function withdrawStorage(
        StructureData.VaultState storage _vaultState,
        address _user,
        uint256 _amount
    ) external {
        
        rollToNextRoundIfNeeded(_vaultState);
        
        StructureData.UserState storage state = _vaultState.userStates[_user]; 
        recalcState(_vault, state);  

        if (state.redeemed >= _amount) {
            state.redeemed =  withdrawal.state.sub(amount);
            _vaultState.totalRedeemed = _vaultState.totalRedeemed.sub(amount);
            return;
        }
        
        //then withdraw the pending
        uint128 pendingAmountToWithdraw = amount.sub(state.redeemedAmount); 
        require(state.pending >= pendingAmountToWithdraw, "Not enough to withdraw"); 
         _vaultState.totalRedeemed = _vaultState.totalRedeemed.sub(state.redeemedAmount);
         _vaultState.totalPending = _vault.state.totalPending.sub(pendingAmountToWithdraw);
        state.redeemedAmount = 0; 
        state.pending = state.pending.sub(pendingAmountToWithdraw);
        
    }
 
    function getRoundPrice( StructureData.VaultState storage _vaultState, uint8 _round) view {
        
        uint128 price = 
           data.depositPriceAfterExpiryPerRound[_round];
        return price == 0 ? 10**ROUND_PRICE_DECIMALS : price;
    }


    function recalcState(StructureData.VaultState storage _vaultState, StructureData.UserState storage _userState) {
        //first recalc to the state before expiry
        if (_userState.lastUpdateRound < _vaultState.round) {
            if (_userState.pending > 0) {
                //move it to onGoing or expired
                if (_userState.lastUpdateRound - _vaultState.round == 1) {
                    _userState.onGoingAmount = _userState.onGoingAmount.add(_userState.pending);
                }
                else if (_userState.lastUpdateRound - _vaultState.round == 2) {
                    _userState.expiredAmount = _userState.expiredAmount.add(_userState.pending);
                }
            }  
            if (_userState.onGoingAmount > 0) {
                if (_userState.lastUpdateRound - _vaultState.round == 1) {

                }
            }
            if (_userState.expiredAmount > 0) {

            } 
        }

        //then check if the expiry level is pecified

    } 
   //for deposit we need to check the cap
    function depositFor(
        StructureData.VaultState storage _vaultState,
        address _userAddress,
        uint256 _amount
    ) external { 

       rollToNextRoundIfNeeded(_vaultState); 
        StructureData.UserState storage userState = data.userStates[msg.sender]; 
        recalcState(_vaultState, userState); 
        userState.pending = userState.pending.add(_amount); 
       _vaultState.totalPending = _vaultState.totalPending.add(_amount);  
    }

    function rollToNextRoundIfNeeded(StructureData.VaultState storage _vaultState) { 
       if (_vaultState.cutOffAt > block.timestamp) { 
           return;
       }
       
       StructureData.OptionState memory onGoing = _vaultState.onGoing;
       
       _vaultState.onGoing = StructureData.OptionState({
           amount: _vaultState.totalPending,
           queuedRedeemAmount: 0,
           strike: 0,
           premiumRate : 0,
           buyer: new address(0)
       });

       //premium not sent, simply bring it to next round
       if (_vaultState.expired.buyerAddress == address(0)) {
            _vaultState.onGoing.amount = _vaultState.onGoing.amount.add(_vaultState.expired.amount).sub(_vaultState.expired.queuedRedeemAmount);
            _vaultState.totalRedeemed = _vaultState.totalRedeemed.add(_vaultState.expired.queuedRedeemAmount);
            //we skip the price setting for the unsold round to save some gas
       }
        _vaultState.expired = onGoing;
        _vaultState.totalPending = 0; 
        _vaultState.cutOffAt = _vaultState.cutOffAt.add(PERIOD); 
        _vaultState.currentRound = _vaultState.currentRound + 1; 

    }
}
