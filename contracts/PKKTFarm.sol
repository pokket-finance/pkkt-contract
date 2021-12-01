// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {Pool} from "./libraries/Pool.sol"; 
import {PoolData, UserData} from "./libraries/SharedData.sol";   
import "./PKKTToken.sol"; 
import "./PKKTRewardManager.sol";

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

    /// @notice Initializes base contract with immutable variables
    /// @param _pkkt address of PKKT contract which can mint and burn PKKT tokens
    /// @param _startBlock block number when PKKT mining starts
    constructor(PKKTToken _pkkt, uint256 _startBlock) PKKTRewardManager(_pkkt, _startBlock) { }

    /// @notice Initializes the contract with storage variables
    /// @param _pkktPerBlock total number of PKKT rewarded to users
    function initialize(uint256 _pkktPerBlock) public initializer {
        PKKTRewardManager.initialize("Pool", _pkktPerBlock);
    }

  
    function poolLength() public override view returns (uint256) {
        return poolInfo.length;
    }
    
    
    // Add an array of new lps to the pool. Can only be called by the owner.
    function addMany(Pool.PoolSettings[] calldata _pools, bool _withUpdate) external onlyOwner {
        for(uint256 i = 0; i < _pools.length; i++) {
            Pool.PoolSettings memory pool = _pools[i];
            require(!isAdded[address(pool.lpToken)], "Pool already is added");
            uint256 lpSupply = pool.lpToken.balanceOf(address(this)); 
            require(lpSupply == 0, "Pool should not be staked"); 
        }  
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        for(uint256 i = 0; i < _pools.length; i++) {
            
            Pool.PoolSettings memory pool = _pools[i];
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
    function add(Pool.PoolSettings memory _pool, bool _withUpdate) external onlyOwner {
        require(!isAdded[address(_pool.lpToken)], "Pool already is added");
        //here to ensure it's a valid address
        uint256 lpSupply = _pool.lpToken.balanceOf(address(this));
        require(lpSupply == 0, "Pool should not be staked");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_pool.allocPoint);
        poolInfo.push(
            Pool.PoolInfo({
                lpToken: _pool.lpToken,
                allocPoint: _pool.allocPoint,
                lastRewardBlock: lastRewardBlock,
                accPKKTPerShare: 0
            })
        );
        isAdded[address(_pool.lpToken)] = true;
    }

    // Update the given array of pools' PKKT allocation points. Can only be called by the owner.
    function setMany(Pool.UpdatePoolParameters[] memory _newSettings, bool _withUpdate) external onlyOwner  {
        for(uint256 i = 0; i < _newSettings.length; i++) {
           Pool.UpdatePoolParameters memory newSetting = _newSettings[i]; 
           require(newSetting.pid < poolInfo.length , "Pool doesn't exist"); 
        }  

        if (_withUpdate) {
            massUpdatePools();
        }
        for(uint256 i = 0; i < _newSettings.length; i++) {
            Pool.UpdatePoolParameters memory newSetting = _newSettings[i]; 
            totalAllocPoint = totalAllocPoint.sub(poolInfo[newSetting.pid].allocPoint).add(
                newSetting.allocPoint
            );
            poolInfo[newSetting.pid].allocPoint = newSetting.allocPoint;
        }  
    }

    // Update the given pool's PKKT allocation point. Can only be called by the owner.
    function set(Pool.UpdatePoolParameters memory _newSetting, bool _withUpdate) external 
    onlyOwner validatePoolById(_newSetting.pid) 
    {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_newSetting.pid].allocPoint).add(
            _newSetting.allocPoint
        );
        poolInfo[_newSetting.pid].allocPoint = _newSetting.allocPoint;
    }


 
    // Deposit LP tokens to PKKT Farm for PKKT allocation.
    function deposit(uint256 _pid, uint256 _amount) public validatePoolById(_pid) {
        require(_amount > 0, "!amount");
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][msg.sender]; 
        updatePool(_pid);
        updateUserReward(_pid, msg.sender, user.amount, user.amount.add(_amount), true);
        user.amount = user.amount.add(_amount); 
        pool.lpToken.safeTransferFrom(
            address(msg.sender),
            address(this),
            _amount
        ); 
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from Pool.
    function withdraw(uint256 _pid, uint256 _amount, bool _harvestReward)
        external
        validatePoolById(_pid)
    {
        require(_amount > 0, "!amount");
        Pool.PoolInfo storage pool = poolInfo[_pid];
        Pool.UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: exceeds available");
        bool updatePending = false;
        if (_harvestReward || user.amount == _amount) {
            harvest(_pid); 
        }
        else { 
            updatePool(_pid); 
            updatePending = true;
        }
        
        updateUserReward(_pid, msg.sender, user.amount, user.amount.sub(_amount), updatePending); 
        user.amount = user.amount.sub(_amount);  
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
 
    
    function _getPoolData(uint256 _poolId, bool _getShare) internal override view returns(PoolData.Data memory){
        Pool.PoolInfo storage pool = poolInfo[_poolId];
        return PoolData.Data({
            lastRewardBlock: pool.lastRewardBlock,
            accPKKTPerShare: pool.accPKKTPerShare,
            shareAmount: _getShare ? pool.lpToken.balanceOf(address(this)) : 0,
            id: _poolId
        });
    }

    function _getUserData(uint256 _poolId, address _userAddress) internal override view returns(UserData.Data memory) {
        
        Pool.UserInfo storage user = userInfo[_poolId][_userAddress];

        return UserData.Data({
            shareAmount: user.amount,
            rewardDebt: user.rewardDebt,
            pendingReward: user.pendingReward
        });
    }

    function _getPoolPercentage(PoolData.Data memory _poolData) internal override view returns(uint256) {
         Pool.PoolInfo storage pool = poolInfo[_poolData.id];  
         return pool.allocPoint.mul(normalizer).div(totalAllocPoint);
    }
 
    function _updatePool(uint256 _pid, uint256 _accPKKTPerShare) internal override {
        Pool.PoolInfo storage pool = poolInfo[_pid];
        pool.lastRewardBlock = block.number;
        if (_accPKKTPerShare > 0) { 
           pool.accPKKTPerShare = _accPKKTPerShare;
        }
    }
    function  _updateUserPendingReward(uint256 _poolId, address _userAddress, uint256 _newValue) internal override{
         Pool.UserInfo storage user = userInfo[_poolId][_userAddress];
         user.pendingReward = _newValue;
    }

    function _updateUserRewardDebt(uint256 _poolId, address _userAddress, uint256 _newValue) internal override {
         Pool.UserInfo storage user = userInfo[_poolId][_userAddress];
         user.rewardDebt = _newValue;
    }
     
}
