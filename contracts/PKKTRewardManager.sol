// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PKKTToken.sol";  
import {PoolData, UserData} from "./libraries/SharedData.sol";  
import "./libraries/Utils.sol";  


abstract contract PKKTRewardManager is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    uint256 public constant normalizer = 1e12;
    // The PKKT TOKEN!
    PKKTToken public immutable pkkt; 
    uint256 public pkktPerBlock;
    // The block number when PKKT mining starts.
    uint256 public immutable startBlock;

    event RewardsHarvested(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    // A record status of LP pool.
    mapping(address => bool) public isAdded; 
    string itemName;

    constructor(
        PKKTToken _pkkt,
        string memory _itemName,
        uint256 _pkktPerBlock,
        uint256 _startBlock
    ) public {
        require(address(_pkkt) != address(0) , "Zero address");
        pkkt = _pkkt;
        pkktPerBlock = _pkktPerBlock;
        startBlock = _startBlock;
        itemName = _itemName;
    }

 
    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolLength();
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }
 
    modifier validatePoolById(uint256 _pid) {
        require(_pid < poolLength() , Utils.StringConcat(bytes(itemName), bytes(" doesn't exist")));
        _;
    }

    //Update number of pkkt per block 
    function setPKKTPerBlock(uint256 _pkktPerBlock) public onlyOwner {
        massUpdatePools();
        pkktPerBlock = _pkktPerBlock;
    }
 

    // View function to see pending PKKTs on frontend.
    function pendingPKKT(uint256 _pid, address _user)
        external
        view
        validatePoolById(_pid)
        returns (uint256)
    {
        PoolData.Data memory poolData = _getPoolData(_pid, true);
        UserData.Data memory userData = _getUserData(_pid, _user); 

        if (block.number > poolData.lastRewardBlock && poolData.shareAmount != 0) {  
           uint256 accPKKTPerShare = _getAccPKKTPerShare(poolData);
           return userData.pendingReward.add(userData.shareAmount.mul(accPKKTPerShare).div(normalizer).sub(userData.rewardDebt)); 
        } 
        return 0;
    }
    
       // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public validatePoolById(_pid) {
        PoolData.Data memory poolData = _getPoolData(_pid, true);
        if (block.number <= poolData.lastRewardBlock) {
            return;
        } 
        if (poolData.shareAmount == 0) {
             _updatePool(_pid, 0); 
            return;
        } 
 
         _updatePool(_pid, _getAccPKKTPerShare(poolData)); 
    }

        //Harvest proceeds of all pools for msg.sender
    function harvestAll(uint256[] memory _pids) external {
       uint256 length = _pids.length;
        for (uint256 i = 0; i < length; ++i) {
            harvest(_pids[i]);
        }
    }

    //Harvest proceeds msg.sender
    function harvest(uint256 _pid) public validatePoolById(_pid) returns(uint256) {
       updatePool(_pid); 
        PoolData.Data memory poolData = _getPoolData(_pid, false);
        UserData.Data memory userData = _getUserData(_pid, msg.sender); 
 
       uint256 pendingReward = userData.pendingReward;
       uint256 totalPending = 
                            userData.shareAmount.mul(poolData.accPKKTPerShare)
                                        .div(normalizer)
                                        .sub(userData.rewardDebt)
                                        .add(pendingReward); 
       _updateUserPendingReward(_pid, msg.sender, 0);        
       if (totalPending > 0) {
            pkkt.mint(address(this), totalPending);
            pkkt.transfer(msg.sender, totalPending); 
        }
        _updateUserRewardDebt(_pid, msg.sender, userData.shareAmount.mul(poolData.accPKKTPerShare).div(normalizer)); 
        emit RewardsHarvested(msg.sender, _pid, totalPending);
        return totalPending;
    }

    function updateUserReward(uint256 _pid, address _userAddress, uint256 _oldShareAmount, uint256 _newShareAmount, bool _updatePending) internal validatePoolById(_pid) {
        PoolData.Data memory poolData = _getPoolData(_pid, false);
        UserData.Data memory userData = _getUserData(_pid,_userAddress);  

        if (_updatePending){
            uint256 pending =
                    _oldShareAmount.mul(poolData.accPKKTPerShare).div(normalizer).sub(
                        userData.rewardDebt
                    );
            _updateUserPendingReward(_pid, _userAddress, userData.pendingReward.add(pending)); 
        }
        _updateUserRewardDebt(_pid,_userAddress, _newShareAmount.mul(poolData.accPKKTPerShare).div(normalizer));  
    }

  

    function _getAccPKKTPerShare(PoolData.Data memory _poolData) private view returns(uint256) { 
        uint256 pkktReward = block.number.sub(_poolData.lastRewardBlock).mul(pkktPerBlock).mul(_getPoolPercentage(_poolData));
       return _poolData.accPKKTPerShare.add(
                pkktReward.div(_poolData.shareAmount)
            );
    }

    function _updatePool(uint256 _pid, uint256 _accPKKTPerShare) internal virtual;
    function poolLength() public virtual view returns (uint256);
    function _updateUserPendingReward(uint256 _poolId, address _userAddress, uint256 _newValue) internal virtual;
    function _updateUserRewardDebt(uint256 _poolId, address _userAddress, uint256 _newValue) internal virtual;
    function _getPoolPercentage(PoolData.Data memory _poolData) internal virtual view returns(uint256);
    function _getPoolData(uint256 _poolId, bool _getShare) internal virtual view returns(PoolData.Data memory);
    function _getUserData(uint256 _poolId, address _userAddress) internal virtual view returns(UserData.Data memory);
}
