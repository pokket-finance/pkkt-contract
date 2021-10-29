// SPDX-License-Identifier: UNLICENSED 
pragma solidity 0.6.12;
 

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/math/SafeMath.sol"; 
import './Utils.sol';

library Vault { 
    
    using SafeMath for uint256;

    struct UserInfo {
        uint256 pendingAmount;  
        uint256 ongoingAmount;   
        uint256 requestingAmount;
        uint256 maturedAmount; 
        uint256 pendingPKKTReward;  
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint256 pendingReward;// Reward but not harvest
        //
        //   pending reward = (user.amount * pool.accPKKTPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accPKKTPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
        bool hasDeposit;
    } 
 
    struct VaultInfo {   
        uint256 lastRewardBlock; // Last block number that PKKTs distribution occurs.
        uint256 accPKKTPerShare; // Accumulated PKKTs per share, times 1e12. See below.
        uint256 totalPending;
        uint256 totalOngoing;
        uint256 totalRequesting;
        uint256 totalMatured;
      
        // the underlying token: usdt/usdc/dai/etc.
        IERC20 underlying;
        uint8 decimals;
    }
    
    function getShare(VaultInfo storage _vault, uint8 _maxDecimals) external returns(uint256) {
        uint8 extraDecimals = Utils.Uint8Sub(_maxDecimals, _vault.decimals);
        if (extraDecimals > 0) {
            return _vault.totalOngoing.mul(10 ** uint256(extraDecimals));
        }
        else {
            return _vault.totalOngoing;
        }
    }

    function getUserShare(VaultInfo storage _vault, UserInfo storage _user, uint8 _maxDecimals) external returns(uint256) {
        uint8 extraDecimals = Utils.Uint8Sub(_maxDecimals, _vault.decimals);
        if (extraDecimals > 0) {
            return _user.ongoingAmount.mul(10 **  uint256(extraDecimals));
        }
        else {
            return _user.ongoingAmount;
        }
    }
    struct VaultSettings {
        
        IERC20 underlying; 
        uint8 decimals;
    }

     
}
