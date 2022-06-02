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
    uint256 public constant ROUND_PRICE_DECIMALS = 8;

  

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

        StructureData.UserState storage state = _vault.userStates[_user]; 
        recalcState(_vault, state);
        require(_vault.currentRound >1, "Nothing to redeem");
        
        uint256 maxInstantRedeemable = uint256(state.expiredAmount).sub(state.expiredQueuedRedeemAmount);
        uint256 maxRedeemable = maxInstantRedeemable.add(state.onGoingAmount).sub(state.onGoingQueuedRedeemAmount);
        require(_amountToRedeem <= maxRedeemable, "Not enough to redeem");

        //check if the sold amount is expired or not
        //1. withdraw initiated before the sold option expired (buyer not providing the expiry level yet)
        //user could terminate all the sold options, and selling options
        //user would be able to redeem all the sold options after expiry and all the selling option after next expiry
        uint256 price = _vault.currentRound > 2 ? _vault.depositPriceAfterExpiryPerRound[_vault.currentRound - 2] : 0;
        if (price == 0) {
            //first redeem from the sold options
            if (_amountToRedeem <= maxInstantRedeemable) {
                state.expiredQueuedRedeemAmount = uint128(_amountToRedeem.add(state.expiredQueuedRedeemAmount));
                _vault.expired.queuedRedeemAmount = uint128(_amountToRedeem.add(_vault.expired.queuedRedeemAmount));
                
            }
            else {
                uint256 amountToRemdeemNextRound = _amountToRedeem - maxInstantRedeemable;
                state.expiredQueuedRedeemAmount = state.expiredAmount;
                state.onGoingQueuedRedeemAmount = uint128(amountToRemdeemNextRound.add(state.onGoingQueuedRedeemAmount));
                _vault.expired.queuedRedeemAmount = uint128(uint256(_vault.expired.queuedRedeemAmount).sub(maxInstantRedeemable));
                _vault.onGoing.queuedRedeemAmount = uint128(uint256(_vault.onGoing.queuedRedeemAmount).sub(amountToRemdeemNextRound));
            }
        }   
        //2. withdraw initiated after the sold option expired (expiry level specified)
        //user could terminate all the selling options
        //user would be able to redeem all the selling options after next expiry
        else{
            state.onGoingQueuedRedeemAmount = uint128(_amountToRedeem.add(state.onGoingQueuedRedeemAmount));
            _vault.onGoing.queuedRedeemAmount = uint128(_amountToRedeem.add(_vault.onGoing.queuedRedeemAmount));
        } 

    }

    function cancelWithrawStorage(
        StructureData.VaultState storage _vault,
        address _user,
        uint256 _amountToRedeemToCancel
    ) external {
        
        rollToNextRoundIfNeeded(_vault);  

        StructureData.UserState storage state = _vault.userStates[_user]; 
        recalcState(_vault, state);
        require(_vault.currentRound > 1, "Nothing to cancel redeem");
        
        uint256 expiredQueuedRedeemAmount = state.expiredQueuedRedeemAmount;
        uint256 onGoingQueuedRedeemAmount = state.onGoingQueuedRedeemAmount;
        require(_amountToRedeemToCancel <= expiredQueuedRedeemAmount.add(onGoingQueuedRedeemAmount), "Not enough to cancel redeem");
        if (_amountToRedeemToCancel <= expiredQueuedRedeemAmount) {
            state.expiredQueuedRedeemAmount = uint128(expiredQueuedRedeemAmount.sub(_amountToRedeemToCancel));
            _vault.expired.queuedRedeemAmount = uint128(uint256(_vault.expired.queuedRedeemAmount).sub(_amountToRedeemToCancel));
            return;
        }
        state.expiredQueuedRedeemAmount = 0;
        _vault.expired.queuedRedeemAmount = uint128(uint256(_vault.expired.queuedRedeemAmount).sub(expiredQueuedRedeemAmount));
        uint256 onGoingQueuedRedeeemAmountToCancel = _amountToRedeemToCancel.sub(expiredQueuedRedeemAmount);
        state.onGoingQueuedRedeemAmount = uint128(onGoingQueuedRedeemAmount.sub(onGoingQueuedRedeeemAmountToCancel));
        _vault.onGoing.queuedRedeemAmount = uint128(uint256(_vault.onGoing.queuedRedeemAmount).sub(onGoingQueuedRedeeemAmountToCancel));
    }

    function withdrawStorage(
        StructureData.VaultState storage _vaultState,
        address _user,
        uint256 _amount
    ) external {
        
        rollToNextRoundIfNeeded(_vaultState);
        
        StructureData.UserState storage state = _vaultState.userStates[_user]; 
        recalcState(_vaultState, state);  
        uint256 redeemed = state.redeemed;
        if (state.redeemed >= _amount) {
            state.redeemed =  uint128(redeemed.sub(_amount));
            _vaultState.totalRedeemed = uint128(uint256(_vaultState.totalRedeemed).sub(_amount));
            return;
        }
        
        //then withdraw the pending
        uint256 pendingAmountToWithdraw = _amount.sub(redeemed); 
        require(state.pending >= pendingAmountToWithdraw, "Not enough to withdraw"); 
         _vaultState.totalRedeemed = uint128(uint256(_vaultState.totalRedeemed).sub(redeemed));
         _vaultState.totalPending = uint128(uint256(_vaultState.totalPending).sub(pendingAmountToWithdraw));
        state.redeemed = 0; 
        state.pending = uint128(uint256(state.pending).sub(pendingAmountToWithdraw));
        
    }
  

   //for deposit we need to check the cap
    function depositFor(
        StructureData.VaultState storage _vaultState,
        address _user,
        uint256 _amount
    ) external { 

       rollToNextRoundIfNeeded(_vaultState); 
        StructureData.UserState storage state = _vaultState.userStates[_user]; 
        recalcState(_vaultState, state);
        //todo: check maxCapacity 
        state.pending = uint128(_amount.add(state.pending)); 
       _vaultState.totalPending =  uint128(_amount.add(_vaultState.totalPending));  
    }

    function rollToNextRoundIfNeeded(StructureData.VaultState storage _vaultState) public { 
       if (_vaultState.cutOffAt > block.timestamp) { 
           return;
       }
       
       StructureData.OptionState memory onGoing = _vaultState.onGoing;
       _vaultState.onGoing = StructureData.OptionState({
           amount: _vaultState.totalPending,
           queuedRedeemAmount: 0,
           strike: 0,
           premiumRate : 0,
           buyerAddress: address(0)
       });

       //premium not sent, simply bring it to next round
       if (_vaultState.currentRound > 1 &&  _vaultState.expired.buyerAddress == address(0)) { 
            _vaultState.onGoing.amount = uint128(uint256( _vaultState.onGoing.amount).add(_vaultState.expired.amount).sub(_vaultState.expired.queuedRedeemAmount));
            _vaultState.totalRedeemed = uint128(uint256(_vaultState.totalRedeemed).add(_vaultState.expired.queuedRedeemAmount));
            _vaultState.depositPriceAfterExpiryPerRound[_vaultState.currentRound - 1] = uint128(10 ** OptionLifecycle.ROUND_PRICE_DECIMALS);
            
       }
        _vaultState.expired = onGoing;
        _vaultState.totalPending = 0; 
        _vaultState.cutOffAt = uint32(PERIOD.add(_vaultState.cutOffAt)); 
        _vaultState.currentRound = _vaultState.currentRound + 1; 

    }

    
    function recalcState(StructureData.VaultState storage _vaultState, StructureData.UserState storage _userState) private {
        //first recalc to the state before expiry
         uint256 onGoingAmount =  _userState.onGoingAmount;
         uint256 expiredAmount =  _userState.expiredAmount; 
         uint256 expiredQueuedRedeemAmount = _userState.expiredQueuedRedeemAmount;
         uint256 onGoingQueuedRedeemAmount = _userState.onGoingQueuedRedeemAmount;
         uint256 lastUpdateRound = _userState.lastUpdateRound;
         uint256 pendingAmount = _userState.pending;
         uint256 redeemed = _userState.redeemed;
         while(lastUpdateRound < _vaultState.currentRound) {
             uint256 oldonGoingAmount = onGoingAmount;
            if (expiredAmount > 0) { 
                uint256 price = _vaultState.depositPriceAfterExpiryPerRound[uint16(lastUpdateRound - 2)]; 
                if (price > 0) {
                    expiredAmount = expiredAmount.mul(price).div(10**ROUND_PRICE_DECIMALS);
                    if (expiredQueuedRedeemAmount > 0) {
                        expiredQueuedRedeemAmount = expiredQueuedRedeemAmount.mul(price).div(10**ROUND_PRICE_DECIMALS);
                    }
                }   
                redeemed = redeemed.add(expiredQueuedRedeemAmount);
                expiredQueuedRedeemAmount = 0;
                onGoingAmount = expiredAmount.sub(expiredQueuedRedeemAmount); 
            } 

            if (pendingAmount > 0) {
                onGoingAmount =  onGoingAmount.add(pendingAmount);
                pendingAmount = 0;
            }  
            if (oldonGoingAmount > 0) {
                expiredAmount = oldonGoingAmount;
                expiredQueuedRedeemAmount = onGoingQueuedRedeemAmount;
                onGoingQueuedRedeemAmount = 0;
            }

            lastUpdateRound = lastUpdateRound + 1;
         } 

        //then check if the expiry level is specified
        if (expiredAmount > 0) {

            uint256 price = _vaultState.depositPriceAfterExpiryPerRound[uint16(lastUpdateRound -2)];
            if (price > 0) { 
                expiredAmount = expiredAmount.mul(price).div(10**ROUND_PRICE_DECIMALS);
                if (expiredQueuedRedeemAmount > 0) {
                    expiredQueuedRedeemAmount = expiredQueuedRedeemAmount.mul(price).div(10**ROUND_PRICE_DECIMALS);
                } 

                onGoingAmount = onGoingAmount.add(expiredAmount).sub(expiredQueuedRedeemAmount);
                expiredAmount = 0;
                if (expiredQueuedRedeemAmount > 0) {
                    redeemed = redeemed.add(expiredQueuedRedeemAmount);
                    expiredQueuedRedeemAmount = 0;
                }
            }
        }
        _userState.lastUpdateRound = _vaultState.currentRound;
        _userState.pending = uint128(pendingAmount);
        _userState.redeemed = uint128(redeemed);
        _userState.expiredAmount = uint128(expiredAmount);
        _userState.expiredQueuedRedeemAmount = uint128(expiredQueuedRedeemAmount);
        _userState.onGoingAmount = uint128(onGoingAmount);
        _userState.onGoingQueuedRedeemAmount = uint128(onGoingQueuedRedeemAmount);

    } 
}
