// SPDX-License-Identifier: UNLICENSED 
pragma solidity 0.6.12;
 
library PoolData { 
    // Info of each user.
    struct Data { 
        uint256 lastRewardBlock;
        uint256 accPKKTPerShare;
        uint256 shareAmount;
        uint256 id;
    }
 
}

library UserData {
    struct Data {
      uint256 shareAmount;
      uint256 pendingReward;
      uint256 rewardDebt;
    }
}
