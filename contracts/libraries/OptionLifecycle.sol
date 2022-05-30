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

        StructureData.Withdrawal storage withdrawal = _vaultState.userWithdrawals[_user];
        StructureData.DepositReceipt storage deposit = _vaultState.userDeposits[_user]; 
        recalcDeposit(_vault, deposit);
         
        //user is allowed to redeem option sold, and can withdraw after the premium sent
        uint maxRedeemable = deposit.unredeemmedAmountRoundMinus2.add(deposit.unredeemmedAmountRoundMinus3);
        require(_amountToRedeem <= maxRedeemable, "Not enough to redeem");
        if (_amountToRedeem <= deposit.unredeemmedAmountRoundMinus3) {
            deposit.unredeemmedAmountRoundMinus3 = deposit.unredeemmedAmountRoundMinus3.sub(_amountToRedeem);
        }
        else{
            deposit.unredeemmedAmountRoundMinus3 = 0;
            deposit.unredeemmedAmountRoundMinus2 = _amountToRedeem.sub(deposit.unredeemmedAmountRoundMinus3);
        }

        //recalc
        recalcWithdrawal(_vaultState, withdrawal);
        withdrawal.redeemingAmount = withdrawal.redeemingAmount.add(_amount);  
        _vault.onGoing.queuedRedeemAmount = _vault.onGoing.queuedRedeemAmount.add(_amountToRedeem);

    }


    function withdrawStorage(
        StructureData.VaultState storage _vaultState,
        address _user,
        uint256 _amount
    ) external {
        
        rollToNextRoundIfNeeded(_vaultState);
        
        StructureData.Withdrawal storage withdrawal = _vaultState.userWithdrawals[_user];
        recalcWithdrawal(_vaultState, withdrawal); 
        if (withdrawal.redeemedAmount >= _amount) {
            withdrawal.redeemedAmount =  withdrawal.redeemedAmoun.sub(amount);
            _vaultState.totalRedeemed = _vaultState.totalRedeemed.sub(amount);
            return;
        }
        
        //then withdraw the pending
        uint128 pendingAmountToWithdraw = amount.sub(withdrawal.redeemedAmount);
        require(deposit.round == _vault.round, "No pending");
        require(deposit.amount >= pendingAmountToWithdraw, "Not enough to withdraw"); 
         _vaultState.totalRedeemed = _vaultState.totalRedeemed.sub(withdrawal.redeemedAmount);
         _vaultState.totalPending = _vault.state.totalPending.sub(pendingAmountToWithdraw);
        withdrawal.redeemedAmount = 0; 
        deposit.amount = deposit.amount.sub(pendingAmountToWithdraw);
        
    }
 
    function getRoundPrice( StructureData.VaultState storage _vaultState, uint8 _round) view {
        
        uint128 price = deposit.round - 3 > 0 ? 
           data.depositPriceAfterExpiryPerRound[deposit.round - 3] : 
           0;
        return price == 0 ? 10**ROUND_PRICE_DECIMALS : price;
    }



    function debitWithdrawal(StructureData.VaultState storage _vaultState, 
      StructureData.Withdrawal storage _withdrawal,StructureData.DepositReceipt storage _deposit) {

    }
  
    function recalcWithdrawal(StructureData.VaultState storage _vaultState, StructureData.Withdrawal storage _withdrawal) {

    }
    
    function recalcDeposit( StructureData.VaultState storage _vaultState,  StructureData.DepositReceipt storage _deposit) {
        
        if (_deposit.round == _vaultState.round) {
            return;
        }
        uint128 lastDeposit = _deposit.amount; 
        //last checked round is obsolete compared with new deposit round
        uint128 unredeemmedAmountRoundMinus3 = _deposit.unredeemmedAmountRoundMinus3;
        uint128 unredeemmedAmountRoundMinus2 = _deposit.unredeemmedAmountRoundMinus2;
        uint128 unredeemmedAmountRoundMinus1 = _deposit.unredeemmedAmountRoundMinus1;
        if (unredeemmedAmountRoundMinus3 != 0 || unredeemmedAmountRoundMinus2 != 0 || unredeemmedAmountRoundMinus1 != 0) {
            uint start = _deposit.round > 3 ? _deposit.round - 3: 1;
            for(uint i = start; i < _vaultState.round - 3; i++){
                if (i == _deposit.round - 2) {
                    unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(unredeemmedAmountRoundMinus2);
                }
                else if (i == _deposit.round - 1) { 
                    unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(unredeemmedAmountRoundMinus1);
                } 
                unredeemmedAmountRoundMinus3 =  
                unredeemmedAmountRoundMinus3.mul(getRoundPrice(data, i)).div(10**ROUND_PRICE_DECIMALS);
            }
        }
        _deposit.unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(lastDeposit);
              
        //merge minus 3 and 2, move minus1-> minus2. move lastDeposit->minus1
        if (_deposit.round - _vault.round == 1) { 
            _deposit.unredeemmedAmountRoundMinus2 = _deposit.unredeemmedAmountRoundMinus1;
            _deposit.unredeemmedAmountRoundMinus1 = lastDeposit; 
        }
        //merge minus3,2,1, move lastDeposit -> minus2
        else if (_deposit.round - _vault.round == 2) { 
            _deposit.unredeemmedAmountRoundMinus1  = 0;
            _deposit.unredeemmedAmountRoundMinus2 = lastDeposit; 
        }
        //merge minus3,2,1,  
        else{ 
            _deposit.unredeemmedAmountRoundMinus1  = 0;
            _deposit.unredeemmedAmountRoundMinus2 = 0; 
        } 

        _deposit.amount = 0;
        _deposit.round = _vaultState.round;
       
    }

   //for deposit we need to check the cap
    function depositFor(
        StructureData.VaultState storage _vaultState,
        address _userAddress,
        uint256 _amount
    ) external { 

       rollToNextRoundIfNeeded(_vaultState); 
        StructureData.DepositReceipt storage deposit = data.userDeposits[msg.sender]; 
        recalcDeposit(_vaultState, deposit); 
       deposit.amount = deposit.amount.add(_amount); 
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
