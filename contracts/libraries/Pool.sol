// SPDX-License-Identifier: UNLICENSED 
pragma solidity 0.6.12;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 

library Pool { 
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        uint pendingReward;// Reward but not harvest
        //
        //   pending reward = (user.amount * pool.accPKKTPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accPKKTPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; 
        uint256 allocPoint; // How many allocation points assigned to this pool. PKKTs to distribute per block.
        uint256 lastRewardBlock; // Last block number that PKKTs distribution occurs.
        uint256 accPKKTPerShare; // Accumulated PKKTs per share, times 1e12. See below.
    }

    struct PoolSettings {
        
        IERC20 lpToken; 
        uint256 allocPoint;
    }

    
    struct UpdatePoolParameters {
        
        uint256 pid; 
        uint256 allocPoint;
    }


}
