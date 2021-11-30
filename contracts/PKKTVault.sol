// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {Vault} from "./libraries/Vault.sol";  
import {PoolData, UserData} from "./libraries/SharedData.sol";  
import "./PKKTToken.sol";
import "./PKKTRewardManager.sol";
import "hardhat/console.sol";


contract PKKTVault is PKKTRewardManager, AccessControl {
    using SafeERC20 for IERC20;
    using SafeMath for uint256; 
    using Vault for Vault.VaultInfo;
    
    Vault.VaultInfo[] public vaultInfo;

    bool public isSettelled; 
 
    mapping(uint256 => mapping(address => Vault.UserInfo)) public userInfo; 
    
    mapping(uint256 => address[]) userAddresses;

    mapping(uint256 => int256 ) public settlementResult;
    uint8 maxDecimals;

    bytes32 public constant TRADER_ROLE = keccak256("TRADER_ROLE");


    /************************************************
     *  EVENTS
     ***********************************************/
 
    event Deposit(address indexed account, uint256 indexed vid, uint256 amount, bool fromWallet); 

    event InitiateWithdraw(address indexed account, uint256 indexed vid,uint256 amount);
    
    event CancelWithdraw(address indexed account, uint256 indexed vid, uint256 amount);

    event Redeem(address indexed account, uint256 indexed vid, uint256 amount);

    event CompleteWithdraw(address indexed account, uint256 indexed vid, uint256 amount);
 
 

    /************************************************
     *  CONSTRUCTOR & INITIALIZATION
     ***********************************************/

    /**
     * @notice Initializes the contract with immutable variables
     */
    constructor(
        PKKTToken _pkkt, 
        uint256 _pkktPerBlock,
        uint256 _startBlock,
        address trader
    ) PKKTRewardManager(_pkkt, "Vault", _pkktPerBlock, _startBlock) {
        // Contract deployer will be able to grant and revoke trading role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Address capable of initiating and finalizing settlement
        _setupRole(TRADER_ROLE, trader);
        isSettelled = true;
    }
 
 

    // Add a range of new underlyings to the vault. Can only be called by the owner.
    function addMany(Vault.VaultSettings[] memory _vaults, bool _withUpdate) external onlyOwner {
         for(uint256 i = 0; i < _vaults.length; i++) {
            IERC20  underlying = _vaults[i].underlying;
            require(!isAdded[address(underlying)], "Vault already is added"); 
            //here to ensure it's a valid address
            uint256 underlyingSupply = underlying.balanceOf(address(this));
            require(underlyingSupply == 0, "Vault should not be staked");
        }  
        if (_withUpdate) {
            massUpdatePools();
        } 
        for(uint256 i = 0; i <  _vaults.length; i++) {
            Vault.VaultSettings memory setting = _vaults[i];
            uint256 lastRewardBlock =
                block.number > startBlock ? block.number : startBlock; 
            vaultInfo.push(
                        Vault.VaultInfo({
                            underlying: setting.underlying, 
                            lastRewardBlock: lastRewardBlock,
                            decimals: setting.decimals,
                            accPKKTPerShare: 0, 
                            totalPending: 0,
                            totalOngoing: 0,
                            totalRequesting: 0,
                            totalMatured: 0
                        })
                    );
            if (maxDecimals < setting.decimals) {
                maxDecimals = setting.decimals;
            }
            isAdded[address(setting.underlying)] = true;
        }         
    }
    // Add a new underlying  to the vault. Can only be called by the owner.
    // XXX DO NOT add the same underlying token more than once. Rewards will be messed up if you do.
    function add(Vault.VaultSettings memory _vault,
        bool _withUpdate
    ) external onlyOwner {
        require(!isAdded[address(_vault.underlying)], "Vault already is added");
        //here to ensure it's a valid address
        uint256 underlyingSupply = _vault.underlying.balanceOf(address(this));
        require(underlyingSupply == 0, "Vault should not been stake");
        
        if (_withUpdate) {
            massUpdatePools();
        }
  

        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock; 
        vaultInfo.push(
                    Vault.VaultInfo({
                        underlying: _vault.underlying, 
                        lastRewardBlock: lastRewardBlock,
                        decimals: _vault.decimals,
                        accPKKTPerShare: 0,
                        totalPending: 0,
                        totalOngoing: 0,
                        totalRequesting: 0,
                        totalMatured: 0
                    })
                );
        if (maxDecimals < _vault.decimals) {
            maxDecimals = _vault.decimals;
        }               
        isAdded[address(_vault.underlying)] = true;
    }


    /************************************************
     *  DEPOSIT & WITHDRAWALS
     ***********************************************/

 
    function deposit(uint256 _vid, uint256 _amount) external validatePoolById(_vid) {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 

        // An approve() by the msg.sender is required beforehand
        IERC20(vault.underlying).safeTransferFrom(msg.sender, address(this), _amount);
        if (!user.hasDeposit) {
            user.hasDeposit = true;
            userAddresses[_vid].push(msg.sender);
        }
        user.pendingAmount = user.pendingAmount.add(_amount); 
        vault.totalPending = vault.totalPending.add(_amount);
        emit Deposit(msg.sender, _vid, _amount, true);
    }
  
 
    function redeem(uint256 _vid, uint256 _amount) external validatePoolById(_vid) {
        require(_amount > 0, "!amount");
        _redeem(_vid, _amount, false);
    }
 
    function maxRedeem(uint256 _vid) external validatePoolById(_vid) {
        _redeem(_vid, 0, true);
    }

 
    function _redeem(uint256 _vid, uint256 _amount, bool _isMax) internal {
        
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.pendingAmount : _amount;
        if (_amount == 0) {
            return;
        }
        require(_amount <= user.pendingAmount, "Exceeds available");

        user.pendingAmount = user.pendingAmount.sub(_amount);  
        vault.totalPending = vault.totalPending.sub(_amount);
        IERC20(vault.underlying).safeTransfer(msg.sender, _amount); 
        

        emit Redeem(msg.sender, _vid, _amount); 
    }
  
    function initiateWithdraw(uint256 _vid, uint256 _amount) external validatePoolById(_vid)  {
        _initiateWithdraw(_vid, _amount, false);
   
    }
 
    function maxInitiateWithdraw(uint256 _vid) external validatePoolById(_vid) {
        _initiateWithdraw(_vid, 0, true);
    }

 
    function _initiateWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 

        uint256 maxAmountForRequest = user.ongoingAmount.sub(user.requestingAmount);
       
        _amount = _isMax ? maxAmountForRequest : _amount;
        if (_amount == 0) {
            return;
        }
        
        require(_amount <= maxAmountForRequest,"Exceeds available"); 
        user.requestingAmount = user.requestingAmount.add(_amount);  
        vault.totalRequesting = vault.totalRequesting.add(_amount);
        emit InitiateWithdraw(msg.sender, _vid, _amount);

    }
 
    function cancelWithdraw(uint256 _vid, uint256 _amount) external validatePoolById(_vid) {
        _cancelWithdraw(_vid, _amount, false); 
    }
 
    function maxCancelWithdraw(uint256 _vid) external validatePoolById(_vid) {
        _cancelWithdraw(_vid, 0, true); 
    }
 
    function _cancelWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 
 
       _amount = _isMax ? user.requestingAmount : _amount;
        if (_amount == 0) {
            return;
        }
        
        require(_amount <= user.requestingAmount,  "Exceeds available"); 
        user.requestingAmount = user.requestingAmount.sub(_amount); 
        vault.totalRequesting = vault.totalRequesting.sub(_amount);
        emit CancelWithdraw(msg.sender, _vid, _amount); 
    }

 
    function completeWithdraw(uint256 _vid, uint256 _amount) external validatePoolById(_vid) {
        _completeWithdraw(_vid, _amount, false); 
  
    }
 
    function maxCompleteWithdraw(uint256 _vid) external validatePoolById(_vid) {
        _completeWithdraw(_vid, 0, true);
    }
 
    function _completeWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(isSettelled, "Settlment not finished yet");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.maturedAmount : _amount;
        if (_amount == 0) {
            return;
        }

        require(_amount <= user.maturedAmount, "Exceeds available");
    
        IERC20(vault.underlying).safeTransfer(msg.sender, _amount); 
        
        user.maturedAmount = user.maturedAmount.sub(_amount); 
        vault.totalMatured = vault.totalMatured.sub(_amount);
        emit CompleteWithdraw(msg.sender, _vid, _amount);

    }
    
 
    function redeposit(uint256 _vid, uint256 _amount) external validatePoolById(_vid) {
       
         _redeposit(_vid, _amount, false); 
    }

        
 
    function maxRedeposit(uint256 _vid) external validatePoolById(_vid) {
         _redeposit(_vid, 0, true); 
    } 
 
 
    function _redeposit(uint256 _vid, uint256 _amount, bool _isMax) internal {
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.UserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.maturedAmount : _amount;
        if (_amount == 0) {
            return;
        }

        require(_amount <= user.maturedAmount, "Exceeds available");
   
        user.pendingAmount = user.pendingAmount.add(_amount);
        user.maturedAmount = user.maturedAmount.sub(_amount); 
        //todo:do we need totalPending?
        vault.totalPending = vault.totalPending.add(_amount);
        vault.totalMatured = vault.totalMatured.sub(_amount); 
        emit Deposit(msg.sender, _vid, _amount, false); 
    }
 

    /************************************************
     *  SETTLEMENT
     ***********************************************/
    function initiateSettlement(uint256 _pkktPerBlock, address target) external onlyRole(TRADER_ROLE) {
        massUpdatePools();
        isSettelled = false;
        uint256 vaultCount = vaultInfo.length; 
        for(uint256 vid = 0; vid < vaultCount; vid++){
            Vault.VaultInfo storage vault = vaultInfo[vid];
            address[] storage addresses = userAddresses[vid];  
            mapping(address=>Vault.UserInfo) storage users = userInfo[vid];
            uint256 userCount = addresses.length;
            int256 diff = 0;
            uint256 totalOngoing = 0;
            uint256 totalMatured = 0; 
            for (uint i=0; i < userCount; i++) {
                Vault.UserInfo storage user = users[addresses[i]]; 
                diff = diff + int256(user.pendingAmount) - int256(user.requestingAmount); 
                uint256 newUserOngoing = user.ongoingAmount.add(user.pendingAmount).sub(user.requestingAmount); //it must be possitive 
                totalOngoing = totalOngoing.add(newUserOngoing);
                
                updateUserReward(vid, msg.sender,  
                    user.ongoingAmount, newUserOngoing, true); 
                user.ongoingAmount = newUserOngoing;
                user.pendingAmount = 0;
                user.maturedAmount =  user.maturedAmount.add(user.requestingAmount);
                totalMatured = totalMatured.add(user.maturedAmount);
                user.requestingAmount = 0; 
            }
            vault.totalOngoing = totalOngoing; 
            vault.totalPending = 0;
            vault.totalRequesting = 0;
            vault.totalMatured  = totalMatured;
            settlementResult[vid] = diff; 
        }
        if (_pkktPerBlock != pkktPerBlock) {
            setPKKTPerBlock(_pkktPerBlock);
        }
        bool allDone = true;
        for(uint256 vid = 0; vid < vaultCount; vid++){ 
           int256 diff2 = settlementResult[vid];
           if (diff2 < 0) {
               allDone = false;
           }
           else if (diff2 > 0) {
               Vault.VaultInfo storage vault = vaultInfo[vid];
               IERC20(vault.underlying).safeTransfer(address(target), uint256(diff2)); 
           }
        }
        if (allDone) {
            for(uint256 vid = 0; vid < vaultCount; vid++){  
                settlementResult[vid] = 0;
            }
            isSettelled = true;
        }
    }

     
    function finishSettlement() external onlyRole(TRADER_ROLE) {
        require(!isSettelled, "Settlement already finished");
        uint256 length = vaultInfo.length;
        for (uint256 vid = 0; vid < length; vid++) {
           Vault.VaultInfo memory vault = vaultInfo[vid];
           //check if the totalMatured is fullfilled or not
           require(IERC20(vault.underlying).balanceOf(address(this)) >=  vault.totalMatured, "Matured amount not fullfilled");
        }
        for (uint256 vid = 0; vid < length; vid++) {
            settlementResult[vid] = 0;
        }
        isSettelled = true;
    }

    //Update number of pkkt per block 
    function setPKKTPerBlock(uint256 _pkktPerBlock) public override {
        require(hasRole(TRADER_ROLE, msg.sender) || owner() == msg.sender, "Only the owner or trader can set PKKT per block.");
        massUpdatePools();
        pkktPerBlock = _pkktPerBlock;
    }

    function poolLength() public override view returns (uint256) {
        return vaultInfo.length;
    }
    
 

    function _updatePool(uint256 _pid, uint256 _accPKKTPerShare) internal override {

        Vault.VaultInfo storage vault = vaultInfo[_pid];
        vault.lastRewardBlock = block.number;
         
        if (_accPKKTPerShare > 0) { 
           vault.accPKKTPerShare = _accPKKTPerShare;
        }
    }


    function _getPoolData(uint256 _poolId, bool _getShare) internal override view returns(PoolData.Data memory){
        Vault.VaultInfo storage vault = vaultInfo[_poolId];  
        return PoolData.Data({
            lastRewardBlock: vault.lastRewardBlock,
            accPKKTPerShare: vault.accPKKTPerShare, 
            shareAmount: _getShare ? vault.totalOngoing : 0,
            id: _poolId
        });
    }

    function _getUserData(uint256 _poolId, address _userAddress) internal override view returns (UserData.Data memory) { 
        Vault.UserInfo storage user = userInfo[_poolId][_userAddress]; 
        return UserData.Data({
            shareAmount: user.ongoingAmount,
            rewardDebt: user.rewardDebt,
            pendingReward: user.pendingReward
        });
    }

    function _getPoolPercentage(PoolData.Data memory _poolData) internal override view returns(uint256) {
         Vault.VaultInfo storage vault = vaultInfo[_poolData.id];    
         return vault.getShare(maxDecimals).mul(normalizer).div(getTotalShare());
    }

    
    function _updateUserRewardDebt(uint256 _poolId, address _userAddress, uint256 _newValue) internal override {
         Vault.UserInfo storage user = userInfo[_poolId][_userAddress];
         user.rewardDebt = _newValue;
    }
    function  _updateUserPendingReward(uint256 _poolId, address _userAddress, uint256 _newValue) internal override{
         Vault.UserInfo storage user = userInfo[_poolId][_userAddress];
         user.pendingReward = _newValue;
    }
 

    function getTotalShare() private view returns(uint256) {
       uint256 totalShares = 0;
       uint256 vaultCount = vaultInfo.length;
       for(uint256 vid = 0; vid < vaultCount; vid++){
           Vault.VaultInfo storage vault = vaultInfo[vid]; 
           totalShares = totalShares.add(vault.getShare(maxDecimals));
       }
       //console.log("TotalShare: %d", totalShares);
       return totalShares;
    }
}
