// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Utils.sol";
import "./StructureData.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

library OptionLifecycle {
    using SafeERC20 for IERC20;
    using Utils for uint128;
    using Utils for uint256;
    using SafeMath for uint256;
    using SafeCast for uint256;
    using StructureData for StructureData.UserState;
    uint256 public constant PERIOD = 7 days;
    uint256 public constant ROUND_PRICE_DECIMALS = 8;
    uint256 public constant PERIOD_TEST = 60 seconds;
    uint256 public constant PERIOD_QA = 1 hours;
    

  

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
        require(_vault.currentRound >1, "Nothing to redeem");

        StructureData.UserState storage state = _vault.userStates[_user]; 
        _vault.userStates[_user] = recalcState(_vault, state, _vault.currentRound);
        state = _vault.userStates[_user];

        
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
                uint256 expiredQueuedRedeemAmount = _amountToRedeem.add(state.expiredQueuedRedeemAmount);
                Utils.assertUint128(expiredQueuedRedeemAmount);
                state.expiredQueuedRedeemAmount = uint128(expiredQueuedRedeemAmount);
                uint256 totalExpiredQueuedRedeemAmount = _amountToRedeem.add(_vault.expired.queuedRedeemAmount);
                Utils.assertUint128(totalExpiredQueuedRedeemAmount);
                _vault.expired.queuedRedeemAmount = uint128(totalExpiredQueuedRedeemAmount);
                
            }
            else {
                uint256 amountToRemdeemNextRound = _amountToRedeem - maxInstantRedeemable;
                state.expiredQueuedRedeemAmount = state.expiredAmount;
                uint256 onGoingQueuedRedeemAmount = amountToRemdeemNextRound.add(state.onGoingQueuedRedeemAmount);
                Utils.assertUint128(onGoingQueuedRedeemAmount);
                state.onGoingQueuedRedeemAmount = uint128(onGoingQueuedRedeemAmount);
                _vault.expired.queuedRedeemAmount = uint128(uint256(_vault.expired.queuedRedeemAmount).sub(maxInstantRedeemable));
                _vault.onGoing.queuedRedeemAmount = uint128(uint256(_vault.onGoing.queuedRedeemAmount).sub(amountToRemdeemNextRound));
            }
        }   
        //2. withdraw initiated after the sold option expired (expiry level specified)
        //user could terminate all the selling options
        //user would be able to redeem all the selling options after next expiry
        else{
            
            uint256 onGoingQueuedRedeemAmount = _amountToRedeem.add(state.onGoingQueuedRedeemAmount);
            Utils.assertUint128(onGoingQueuedRedeemAmount);
            state.onGoingQueuedRedeemAmount = uint128(onGoingQueuedRedeemAmount);
            uint256 totalOnGoingQueuedRedeemAmount = _amountToRedeem.add(_vault.onGoing.queuedRedeemAmount);
            Utils.assertUint128(totalOnGoingQueuedRedeemAmount);
            _vault.onGoing.queuedRedeemAmount = uint128(totalOnGoingQueuedRedeemAmount);
        } 

    }

    function cancelWithrawStorage(
        StructureData.VaultState storage _vault,
        address _user,
        uint256 _amountToRedeemToCancel
    ) external {
        
        rollToNextRoundIfNeeded(_vault);  
        require(_vault.currentRound > 1, "Nothing to cancel redeem");

        StructureData.UserState storage state = _vault.userStates[_user]; 
        _vault.userStates[_user] = recalcState(_vault, state, _vault.currentRound);
        state = _vault.userStates[_user];
        
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
        _vaultState.userStates[_user] = recalcState(_vaultState, state, _vaultState.currentRound);
        state = _vaultState.userStates[_user];

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
        _vaultState.userStates[_user] = recalcState(_vaultState, state, _vaultState.currentRound);
        state = _vaultState.userStates[_user];

        uint256 pending = _vaultState.totalPending;
        uint256 newTVL = _amount.add(pending).add(_vaultState.onGoing.amount).add(_vaultState.expired.amount).sub(_vaultState.expired.queuedRedeemAmount);
        uint256 newUserPending = _amount.add(state.pending); 
        require(newTVL <= _vaultState.maxCapacity, "Exceeds capacity");
        Utils.assertUint128(newUserPending);
        state.pending = uint128(newUserPending);
        uint256 newTotalPending =  _amount.add(_vaultState.totalPending);
        Utils.assertUint128(newTotalPending);
       _vaultState.totalPending =  uint128(newTotalPending);  
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
       if (_vaultState.currentRound > 1 &&  _vaultState.expired.amount > 0 && _vaultState.expired.buyerAddress == address(0)) { 
           uint256 onGoingAmount = uint256( _vaultState.onGoing.amount).add(_vaultState.expired.amount).sub(_vaultState.expired.queuedRedeemAmount);
           Utils.assertUint128(onGoingAmount);
            _vaultState.onGoing.amount = uint128(onGoingAmount);
           uint256 totalRedeemed = uint256(_vaultState.totalRedeemed).add(_vaultState.expired.queuedRedeemAmount);
           Utils.assertUint128(totalRedeemed);
            _vaultState.totalRedeemed = uint128(totalRedeemed);
            _vaultState.depositPriceAfterExpiryPerRound[_vaultState.currentRound - 1] = uint128(10 ** OptionLifecycle.ROUND_PRICE_DECIMALS);
            
       }
        _vaultState.expired = onGoing;
        _vaultState.totalPending = 0; 
        uint256 cutOffAt = 0;
        if (_vaultState.environment == 0) { //prod
            cutOffAt = PERIOD.add(_vaultState.cutOffAt);
        }
        else if (_vaultState.environment == 1) { //qa
            cutOffAt = PERIOD_QA.add(_vaultState.cutOffAt);
        }
        else { //test
            cutOffAt = PERIOD_TEST.add(_vaultState.cutOffAt);
        }
        require(cutOffAt <= type(uint32).max, "Overflow cutOffAt");
        _vaultState.cutOffAt = uint32(cutOffAt);
        _vaultState.currentRound = _vaultState.currentRound + 1; 

    }

    
    function recalcVault(StructureData.VaultState storage _vaultState) external view returns(StructureData.VaultSnapShot memory) { 
       StructureData.VaultSnapShot memory snapShot = StructureData.VaultSnapShot({
               totalPending: _vaultState.totalPending,
               totalRedeemed: _vaultState.totalRedeemed,
               cutOffAt: _vaultState.cutOffAt,
               currentRound: _vaultState.currentRound,
               maxCapacity: _vaultState.maxCapacity,
               onGoing: _vaultState.onGoing,
               expired: _vaultState.expired
           });
        if (_vaultState.cutOffAt > block.timestamp) {
            return snapShot;
        }

       StructureData.OptionState memory onGoing = _vaultState.onGoing;
       snapShot.onGoing = StructureData.OptionState({
           amount: snapShot.totalPending,
           queuedRedeemAmount: 0,
           strike: 0,
           premiumRate : 0,
           buyerAddress: address(0)
       });

       //premium not sent, simply bring it to next round
       if (snapShot.currentRound > 1 &&  snapShot.expired.amount > 0 && snapShot.expired.buyerAddress == address(0)) { 
           uint256 onGoingAmount = uint256( snapShot.onGoing.amount).add(snapShot.expired.amount).sub(snapShot.expired.queuedRedeemAmount);
           Utils.assertUint128(onGoingAmount);
            snapShot.onGoing.amount = uint128(onGoingAmount);
           uint256 totalRedeemed = uint256(snapShot.totalRedeemed).add(snapShot.expired.queuedRedeemAmount);
           Utils.assertUint128(totalRedeemed);
            snapShot.totalRedeemed = uint128(totalRedeemed);
            
       }
        snapShot.expired = onGoing;
        snapShot.totalPending = 0; 

        uint256 cutOffAt = 0;
        if (_vaultState.environment == 0) { //prod
            cutOffAt = PERIOD.add(snapShot.cutOffAt);
        }
        else if (_vaultState.environment == 1) { //qa
            cutOffAt = PERIOD_QA.add(snapShot.cutOffAt);
        }
        else { //test
            cutOffAt = PERIOD_TEST.add(snapShot.cutOffAt);
        }
        require(cutOffAt <= type(uint32).max, "Overflow cutOffAt");
        snapShot.cutOffAt = uint32(cutOffAt);
        snapShot.currentRound = snapShot.currentRound + 1; 
        return snapShot;

    } 

    function recalcState(StructureData.VaultState storage _vaultState, StructureData.UserState storage _userState, uint16 _currentRound) public view 
    returns(StructureData.UserState memory){
        //first recalc to the state before expiry
         uint256 onGoingAmount =  _userState.onGoingAmount;
         uint256 expiredAmount =  _userState.expiredAmount; 
         uint256 expiredQueuedRedeemAmount = _userState.expiredQueuedRedeemAmount;
         uint256 onGoingQueuedRedeemAmount = _userState.onGoingQueuedRedeemAmount;
         uint256 lastUpdateRound = _userState.lastUpdateRound;
         uint256 pendingAmount = _userState.pending;
         uint256 redeemed = _userState.redeemed;
         while(lastUpdateRound < _currentRound) {
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
        Utils.assertUint128(pendingAmount);
        Utils.assertUint128(redeemed);
        Utils.assertUint128(expiredAmount);
        Utils.assertUint128(expiredQueuedRedeemAmount);
        Utils.assertUint128(onGoingAmount);
        Utils.assertUint128(onGoingQueuedRedeemAmount);
        StructureData.UserState memory updatedUserState = StructureData.UserState({
            lastUpdateRound: _currentRound,
            pending: uint128(pendingAmount),
            redeemed: uint128(redeemed),
            expiredAmount: uint128(expiredAmount),
            expiredQueuedRedeemAmount: uint128(expiredQueuedRedeemAmount),
            onGoingAmount: uint128(onGoingAmount),
            onGoingQueuedRedeemAmount: uint128(onGoingQueuedRedeemAmount)
        });
        return updatedUserState;
    } 
}
