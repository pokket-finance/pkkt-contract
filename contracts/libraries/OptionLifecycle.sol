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
        uint128 lastRedeem = withdrawl.amount;
        if (withdrawl.round < _vaultState.round && lastRedeem > 0) {
            uint128 redeemmedAmountRoundMinus3 = withdrawal.redeemmedAmountRoundMinus3;
            uint128 redeemmedAmountRoundMinus2 = withdrawal.redeemmedAmountRoundMinus2;
            uint128 redeemmedAmountRoundMinus1 = withdrawal.redeemmedAmountRoundMinus1;
             if (redeemmedAmountRoundMinus3 != 0 || redeemmedAmountRoundMinus2 != 0 || redeemmedAmountRoundMinus1 != 0) {
                  for(uint i = withdrawal.round - 3; i < _vaultState.round - 3; i++){
                    uint128 price = getRoundPrice(data, i);
                    if (i == withdrawal.round - 2) {
                        redeemmedAmountRoundMinus3 = redeemmedAmountRoundMinus3.add(redeemmedAmountRoundMinus2);
                    }
                    else if (i == withdrawal.round - 1) { 
                        redeemmedAmountRoundMinus3 = redeemmedAmountRoundMinus3.add(redeemmedAmountRoundMinus1);
                    }
                    redeemmedAmountRoundMinus3 =  
                    redeemmedAmountRoundMinus3.mul(price).div(10**ROUND_PRICE_DECIMALS);
                  }
              }
              withdrawal.redeemmedAmountRoundMinus3 = redeemmedAmountRoundMinus3.add(lastRedeem);
              
               //merge minus 3 and 2, move minus1-> minus2. move lastRedeem->minus1
              if (withdrawl.round - _vault.round == 1) { 
                withdrawl.redeemmedAmountRoundMinus2 = withdrawl.redeemmedAmountRoundMinus1;
                withdrawl.redeemmedAmountRoundMinus1 = lastRedeem; 
              }
               //merge minus3,2,1, move lastRedeem -> minus2
              else if (withdrawl.round - _vault.round == 2) { 
                withdrawl.redeemmedAmountRoundMinus1  = 0;
                withdrawl.redeemmedAmountRoundMinus2 = lastRedeem; 
              }
            //merge minus3,2,1,  
              else{ 
                withdrawl.redeemmedAmountRoundMinus1  = 0;
                withdrawl.redeemmedAmountRoundMinus2 = 0; 
              } 

 
           lastRedeem = 0;
        }

        
       withdrawal.round = _vaultState.round;
       withdrawal.amount = lastRedeem.add(_amountToRedeem); 

        _vault.onGoing.queuedRedeemAmount = _vault.onGoing.queuedRedeemAmount.add(_amountToRedeem);

    }

    function cancelWithdrawStorage(
        StructureData.VaultState storage _vault,
        address _user,
        uint256 _amountToRedeem,
    ) external {
        
        rollToNextRoundIfNeeded(_vault); 
        _vault.onGoing.queuedRedeemAmount =  _vault.onGoing.queuedRedeemAmount.sub(_amountToRedeem);
    }

    function withdrawStorage(
        StructureData.VaultState storage _vaultState,
        address _user,
        uint256 _amount
    ) external {
        
        rollToNextRoundIfNeeded(_vaultState);
        

        //first withdraw the redeeemed
        //then withdraw the pending
    }
 
    function getRoundPrice( StructureData.VaultState storage _vaultState, uint8 _round) view {
        
        uint128 price = deposit.round - 3 > 0 ? 
           data.depositPriceAfterExpiryPerRound[deposit.round - 3] : 
           0;
        return price == 0 ? 10**ROUND_PRICE_DECIMALS : price;
    }

   //for deposit we need to check the cap
    function depositFor(
        StructureData.VaultState storage _vaultState,
        address _userAddress,
        uint256 _amount
    ) external { 

       rollToNextRoundIfNeeded(_vaultState); 
        StructureData.DepositReceipt storage deposit = data.userDeposits[msg.sender]; 
        //last deposit happens in previous rounds
        uint128 lastDeposit = deposit.amount; 
        
        //last checked round is obsolete compared with new deposit round
       if (deposit.round < _vaultState.round && lastDeposit > 0) { 
            uint128 unredeemmedAmountRoundMinus3 = deposit.unredeemmedAmountRoundMinus3;
            uint128 unredeemmedAmountRoundMinus2 = deposit.unredeemmedAmountRoundMinus2;
            uint128 unredeemmedAmountRoundMinus1 = deposit.unredeemmedAmountRoundMinus1;
             if (unredeemmedAmountRoundMinus3 != 0 || unredeemmedAmountRoundMinus2 != 0 || unredeemmedAmountRoundMinus1 != 0) {
                  for(uint i = deposit.round - 3; i < _vaultState.round - 3; i++){
                    uint128 price = getRoundPrice(data, i);
                    if (i == deposit.round - 2) {
                        unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(unredeemmedAmountRoundMinus2);
                    }
                    else if (i == deposit.round - 1) { 
                        unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(unredeemmedAmountRoundMinus1);
                    }
                    unredeemmedAmountRoundMinus3 =  
                    unredeemmedAmountRoundMinus3.mul(price).div(10**ROUND_PRICE_DECIMALS);
                  }
              }
              deposit.unredeemmedAmountRoundMinus3 = unredeemmedAmountRoundMinus3.add(lastDeposit);
              
               //merge minus 3 and 2, move minus1-> minus2. move lastDeposit->minus1
              if (deposit.round - _vault.round == 1) { 
                deposit.unredeemmedAmountRoundMinus2 = deposit.unredeemmedAmountRoundMinus1;
                deposit.unredeemmedAmountRoundMinus1 = lastDeposit; 
              }
               //merge minus3,2,1, move lastDeposit -> minus2
              else if (deposit.round - _vault.round == 2) { 
                deposit.unredeemmedAmountRoundMinus1  = 0;
                deposit.unredeemmedAmountRoundMinus2 = lastDeposit; 
              }
            //merge minus3,2,1,  
              else{ 
                deposit.unredeemmedAmountRoundMinus1  = 0;
                deposit.unredeemmedAmountRoundMinus2 = 0; 
              } 

 
           lastDeposit = 0;
       }
       
       deposit.round = _vaultState.round;
       deposit.amount = lastDeposit.add(_amount); 
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
