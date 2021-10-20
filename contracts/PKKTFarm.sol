// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol"; 
import "./PKKTToken.sol"; 
import "./PKKTRewardManager.sol";
import {Pool} from "../libraries/Pool.sol";  

contract PKKTFarm is PKKTRewardManager {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
 
    // Info of each pool.
    Pool.PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => Pool.UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0; 
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    event RewardsHarvested(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(
        PKKTToken _pkkt,
        uint256 _pkktPerBlock,
        uint256 _startBlock
    ) public PKKTRewardManager(_pkkt, _pkktPerBlock, _startBlock) {
        
    }

    modifier validatePoolById(uint256 _pid) {
        require(_pid < poolInfo.length , "Pool doesn't exist");
        _;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
    
    
    // Add an array of new lps to the pool. Can only be called by the owner.
    function addMany(Pool.PoolSettings[] memory _pools,
        bool _withUpdate) external onlyOwner {
        for(uint256 i = 0; i < _pools,length; i++) {
            Pool.PoolSettings memory pool = _pools[i];
            require(!isAdded[address(pool.lpToken)], "Pool already is added");
            uint256 lpSupply = pool.lpToken.balanceOf(address(this)); 
            require(lpSupply == 0, "Pool should not been stake"); 
        }  
        if (_withUpdate) {
            massUpdatePools();
        }
        for(uint256 i = 0; i < _pools,length; i++) {
            
            Pool.PoolSettings memory pool = _pools[i];
            uint256 lastRewardBlock =
                block.number > startBlock ? block.number : startBlock;
            totalAllocPoint = totalAllocPoint.add(pool.allocPoint);
            poolInfo.push(
                Pool.PoolInfo({
                    lpToken: pool.lpToken,
                    allocPoint: pool.allocPoint,
                    lastRewardBlock: lastRewardBlock,
                    accPKKTPerShare: 0
                })
            );
            isAdded[address(pool.lpToken)] = true;
        }  
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) external onlyOwner {
        require(!isAdded[address(_lpToken)], "Pool already is added");
        //here to ensure it's a valid address
        uint256 lpSupply = _lpToken.balanceOf(address(this));
        require(lpSupply == 0, "Pool should not been stake");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            Pool.PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accPKKTPerShare: 0
            })
        );
        isAdded[address(_lpToken)] = true;
    }

    // Update the given array of pools' PKKT allocation points. Can only be called by the owner.
    function setMany(
        UpdatePoolParameters[] memory _newSettings,
        bool _withUpdate
    ) external onlyOwner  {
        for(uint256 i = 0; i < _newSettings,length; i++) {
            Pool.UpdatePoolParameters memory newSetting = _newSettings[i]; 
           require(newSetting.pid < poolInfo.length , "Pool doesn't exist"); 
        }  

        if (_withUpdate) {
            massUpdatePools();
        }
        for(uint256 i = 0; i < _newSettings,length; i++) {
            Pool.UpdatePoolParameters memory newSetting = _newSettings[i]; 
            totalAllocPoint = totalAllocPoint.sub(poolInfo[newSetting.pid].allocPoint).add(
                newSetting.allocPoint
            );
            poolInfo[newSetting.pid].allocPoint = newSetting.allocPoint;
        }  
    }

    // Update the given pool's PKKT allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner validatePoolById(_pid) {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // Return time multiplier over the given _from to _to block.
    function timeMultiplier(uint256 _from, uint256 _to)
        public
        pure
        returns (uint256)
    {
            return _to.sub(_from);
    
    }
 

    // View function to see pending PKKTs on frontend.
    function pendingPKKT(uint256 _pid, address _user)
        external
        view
        validatePoolById(_pid)
        returns (uint256)
    {
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][_user];
        uint256 accPKKTPerShare = pool.accPKKTPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier =
                timeMultiplier(pool.lastRewardBlock, block.number);
            uint256 pkktReward =
                multiplier.mul(pkktPerBlock).mul(pool.allocPoint).div(
                    totalAllocPoint
                );
            accPKKTPerShare = accPKKTPerShare.add(
                pkktReward.mul(1e12).div(lpSupply)
            );
        }
        return user.pendingReward.add(user.amount.mul(accPKKTPerShare).div(1e12).sub(user.rewardDebt));
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public override {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public validatePoolById(_pid) {
        Pool.PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = timeMultiplier(pool.lastRewardBlock, block.number);
        uint256 pkktReward =
            multiplier.mul(pkktPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );
        pool.accPKKTPerShare = pool.accPKKTPerShare.add(
            pkktReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to PKKT Farm for PKKT allocation.
    function deposit(uint256 _pid, uint256 _amount) public validatePoolById(_pid) {
        require(_amount > 0, "!amount");
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        uint256 pending =
                user.amount.mul(pool.accPKKTPerShare).div(1e12).sub(
                    user.rewardDebt
                );
        user.pendingReward = user.pendingReward.add(pending);
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accPKKTPerShare).div(1e12);
        pool.lpToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        ); 
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from Pool.
    function withdraw(uint256 _pid, uint256 _amount, bool harvestReward)
        external
        validatePoolById(_pid)
    {
        require(_amount > 0, "!amount");
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        if (harvestReward || user.amount == _amount) {
            harvest(_pid); 
        }
        else { 
            updatePool(_pid);
            uint256 pending = user.amount.mul(pool.accPKKTPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) { 
               user.pendingReward = user.pendingReward.add(pending);
            } 
        }
        user.amount = user.amount.sub(_amount); 
        user.rewardDebt = user.amount.mul(pool.accPKKTPerShare).div(1e12);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) external validatePoolById(_pid) {
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.lpToken.safeTransfer(address(msg.sender), amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    //Compound rewards to pkkt pool
    function compoundReward(uint256 _pkktPoolId) external validatePoolById(_pkktPoolId) {
        Pool.PoolInfo memory pool = poolInfo[_pkktPoolId];
        require(pool.lpToken == IERC20(pkkt), "not pkkt pool");
        uint256 totalPending = harvest(_pkktPoolId);
        if(totalPending > 0) {
            deposit(_pkktPoolId, totalPending);
        }
    }

    //Harvest proceeds msg.sender
    function harvest(uint256 _pid) public validatePoolById(_pid) returns(uint256) {
       updatePool(_pid); 
       Pool.PoolInfo storage pool = poolInfo[_pid];
       Pool.UserInfo storage user = userInfo[_pid][msg.sender];  
       uint256 pendingReward = user.pendingReward;
       uint256 totalPending = 
                            user.amount.mul(pool.accPKKTPerShare)
                                        .div(1e12)
                                        .sub(user.rewardDebt)
                                        .add(pendingReward); 
       user.pendingReward = 0;
       if (totalPending > 0) {
            pkkt.mint(address(this), totalPending);
            safePKKTTransfer(msg.sender, totalPending); 
        }
        user.rewardDebt = user.amount.mul(pool.accPKKTPerShare).div(1e12);
        emit RewardsHarvested(msg.sender, _pid, totalPending);
        return totalPending;
    }

    //Harvest proceeds of all pools for msg.sender
    function harvestAll(uint256[] memory _pids) external {
       uint256 length = _pids.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            harvest(pid);
        }
    }

}
