// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol"; 
import {Vault} from "../libraries/Vault.sol";  
import "./PKKTToken.sol";
import "./PKKTRewardManager.sol";

contract PKKTVault is PKKTRewardManager {
    using SafeERC20 for IERC20;
    using SafeMath for uint256; 
  
    
    Vault.VaultInfo[] public vaultInfo;

    bool public isSettelled;
 
    uint256 public immutable SettlementTimeOfDay;

    uint256 public immutable DeadlineTimeOfDay;
 
    mapping(uint256 => mapping(address => Vault.UserVaultInfo)) public userInfo; 
    


    /************************************************
     *  EVENTS
     ***********************************************/
 
    event Deposit(address indexed account, uint256 indexed vid, uint256 amount, bool internal); 

    event InitiateWithdraw(address indexed account, uint256 indexed vid,uint256 amount);
    
    event CancelWithdraw(address indexed account, uint256 indexed vid, uint256 amount);

    event Redeem(address indexed account, uint256 indexed vid, uint256 amount);

    event CompleteWithdraw(address indexed account, uint256 indexed vid, uint256 amount);

    event InitiateSettlement()
 

    /************************************************
     *  CONSTRUCTOR & INITIALIZATION
     ***********************************************/

    /**
     * @notice Initializes the contract with immutable variables
     */
    constructor(
        PKKTToken _pkkt, 
        uint256 _pkktPerBlock,
        uint256 _startBlock
    ) public PKKTRewardManager(_pkkt, _pkktPerBlock, _startBlock) {  

    }


    modifier validateVaultById(uint256 _vid) {
        require(_vid < vaultInfo.length , "Vault doesn't exist");
        _;
    }

    // Add a range of new underlyings to the vault. Can only be called by the owner.
    function addMany(IERC20[] memory _underlyings, bool _withUpdate) external onlyOwner {
         for(uint256 i = 0; i < _underlyings,length; i++) {
            IERC20 memory underlying = _underlyings[i];
            require(!isAdded[address(underlying)], "Vault already is added"); 
            //here to ensure it's a valid address
            uint256 underlyingSupply = underlying.balanceOf(address(this));
            require(underlyingSupply == 0, "Vault should not been stake");
        }  
        if (_withUpdate) {
            massUpdatePools();
        } 
        for(uint256 i = 0; i < _underlyings,length; i++) {
            IERC20 memory underlying = _underlyings[i];
            uint256 lastRewardBlock =
                block.number > startBlock ? block.number : startBlock; 
            vaultInfo.push(
                        Vault.VaultInfo({
                            underlying: underlying, 
                            lastRewardBlock: lastRewardBlock,
                            accPKKTPerShare: 0
                        })
                    );
            isAdded[address(underlying)] = true;
        }         
    }
    // Add a new underlying  to the vault. Can only be called by the owner.
    // XXX DO NOT add the same underlying token more than once. Rewards will be messed up if you do.
    function add(IERC20 _underlying,
        bool _withUpdate
    ) external onlyOwner {
        require(!isAdded[address(_underlying)], "Vault already is added");
        //here to ensure it's a valid address
        uint256 underlyingSupply = _underlying.balanceOf(address(this));
        require(underlyingSupply == 0, "Vault should not been stake");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock; 
        vaultInfo.push(
                    Vault.VaultInfo({
                        underlying: _underlying, 
                        lastRewardBlock: lastRewardBlock,
                        accPKKTPerShare: 0
                    })
                );
        isAdded[address(_underlying)] = true;
    }


    /************************************************
     *  DEPOSIT & WITHDRAWALS
     ***********************************************/

    /**
     * @notice Deposits the `underlying` from msg.sender.
     * @param amount is the amount of `asset` to deposit
     */
    function deposit(uint256 _vid, uint256 _amount) external validateVaultById(_vid) {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 

        // An approve() by the msg.sender is required beforehand
        IERC20(vault.underlying).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
          
        user.pendingAmount = user.pendingAmount.add(_amount);
        vault.totalPending = vault.totalPending.add(_amount);
        emit Deposit(msg.sender, _vid, _amount, false);
    }
  
    /**
     * @notice Redeems pending amounts that are owed to the account
     * @param amount is the number of underlyings to redeem
     */
    function redeem(uint256 _vid, uint256 _amount) external validateVaultById(_vid) {
        require(_amount > 0, "!amount");
        _redeem(_vid, _amount, false);
    }

    /**
     * @notice Redeems the entire pending balance that is owed to the account
     */
    function maxRedeem(uint256 _vid) external validateVaultById(_vid) {
        _redeem(_vid, 0, true);
    }

    /**
     * @notice Redeems amounts that are owed to the account
     * @param amount is the number of underlyings to redeem, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max redemption
     */
    function _redeem(uint256 _vid, uint256 _amount, bool _isMax) internal {
        
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.pendingAmount : _amount;
        if (_amount == 0) {
            return;
        }
        require(_amount <= user.pendingAmount, "Exceeds available");

        user.pendingAmount = user.pendingAmount.sub(_amount);  
        vault.totalPending = vault.totalPending.sub(_amount);
        IERC20(vault.underlying).safeTransfer(
            address(this),
            msg.sender,
            _amount
        ); 
        

        emit Redeem(msg.sender, _vid, _amount); 
    }
 
    /**
     * @notice Initiates a withdrawal that can be processed once the round completes
     * @param amount is the number of underlyings to withdraw
     */
    function initiateWithdraw(uint256 _vid, uint256 _amount) external validateVaultById(_vid)  {
        _initiateWithdraw(_vid, _amount, false);
   
    }

    /**
     * @notice Withraws the entire available that is owed to the account
     */
    function maxInitiateWithdraw(uint256 _vid) external validateVaultById(_vid) {
        _initiateWithdraw(_vid, 0, true);
    }

    /**
     * @notice Initiate withdrawal amounts that are owed to the account
     * @param amount is the number of underlyings to initiate withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal
     */
    function _initiateWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 

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
 
    /**
     * @notice Cancel a withdrawal 
     * @param amount is the number of underlyings to cancel
     */
    function cancelWithdraw(uint256 _vid, uint256 _amount) external validateVaultById(_vid) {
        _cancelWithdraw(_vid, _amount, false); 
    }

    /**
     * @notice Cancel the entire withdrawal
     */
    function maxCancelWithdraw(uint256 _vid) external validateVaultById(_vid) {
        _cancelWithdraw(_vid, 0, true); 
    }
 

    /**
     * @notice Cancel withdrawal amounts that are owed to the account
     * @param amount is the number of underlyings to cancel withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal cancellation
     */
    function _cancelWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(_amount > 0, "!amount");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 
 
       _amount = _isMax ? user.requestingAmount : _amount;
        if (_amount == 0) {
            return;
        }
        
        require(_amount <= user.requestingAmount,  "Exceeds available"); 
        user.requestingAmount = user.requestingAmount.sub(_amount); 
        vault.totalRequesting = vault.totalRequesting.sub(_amount);
        emit CancelWithdraw(msg.sender, _vid, _amount); 
    }


    /**
     * @notice Completes partially a scheduled withdrawal from a past round.
     */
    function completeWithdraw(uint256 _vid, uint256 _amount) external validateVaultById(_vid) {
        _completeWithdraw(_vid, _amount, false); 
  
    }
    
    /**
     * @notice Completes a whole scheduled withdrawal from a past round.
     */
    function maxCompleteWithdraw(uint256 _vid) external validateVaultById(_vid) {
        _completeWithdraw(_vid, 0, true);
    }

    /**
     * @notice Completes a scheduled withdrawal from a past round.
     * @param amount is the number of underlyings to complete withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal completion
     */
    function _completeWithdraw(uint256 _vid, uint256 _amount, bool _isMax) internal {
        require(isSettelled, "Settlment not finished yet");
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.maturedAmount : _amount;
        if (_amount == 0) {
            return;
        }

        require(_amount <= user.maturedAmount, "Exceeds available");
    
        IERC20(vault.underlying).safeTransfer(
            address(this),
            msg.sender,
            _amount
        ); 
        
        user.maturedAmount = user.maturedAmount.sub(_amount); 
        vault.totalMatured = vault.totalMatured.sub(_amount);
        emit CompleteWithdraw(msg.sender, _vid, _amount);

    }
    
    /**
     * @notice revert a scheduled withdrawal from a past round and reput to pending pool 
     * @param amount is the number of underlyings to revert
     */
    function redeposit(uint256 _vid, uint256 _amount) external validateVaultById(_vid) {
       
         _redeposit(_vid, _amount, false); 
    }

        
    /**
     * @notice revert a whole scheduled withdrawal from a past round and reput to pending pool  
     */
    function maxRedeposit(uint256 _vid) external validateVaultById(_vid) {
         _redeposit(_vid, 0, true); 
    } 
 
    /**
     * @notice revert a scheduled withdrawal from a past round and reput to pending pool 
     * @param amount is the number of underlyings to revert, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal reversion
     */
    function _redeposit(uint256 _vid, uint256 _amount, bool _isMax) internal {
        Vault.VaultInfo storage vault = vaultInfo[_vid];
        Vault.VaultUserInfo storage user = userInfo[_vid][msg.sender]; 
 
        _amount = _isMax ? user.maturedAmount : _amount;
        if (_amount == 0) {
            return;
        }

        require(_amount <= user.maturedAmount, "Exceeds available");
   
        user.pendingAmount = user.pendingAmount.add(_amount);
        user.maturedAmount = user.maturedAmount.sub(_amount); 
        vault.totalPending = vault.totalPending.add(_amount);
        vault.totalMatured = vault.totalMatured.sub(_amount); 
        emit Deposit(msg.sender, _vid, _amount, true); 
 
    }

    //todo: implement
    function harvest() external nonReentrant {

    }


        


    /************************************************
     *  SETTLEMENT
     ***********************************************/

    //todo: implement pkkt reward
    //0 for _pkktPerBlock
    function initiateSettlement(uint256 _pkktPerBlock) external onlyOwner returns(uint256[] memory balanceDiffs){
  
        int256 diff = 0;
        totalMatured = 0;
        uint userCount = users.length;
        for (uint i=0; i<userCount; i++) {
           Vault.UserVaultInfo storage userInfo = userVaultInfo[users[i]];
           diff = diff.add(userInfo.pendingAmount).sub(userInfo.requestingAmount);
           uint256 baseUserRollover = userInfo.ongoingAmount.mul(settings.currentNativeInterestRate).div(36500).add(userInfo.ongoingAmount); 
           uint256 newUserOngoing = baseUserRollover.add(userInfo.pendingAmount).sub(userInfo.requestingAmount); //it must be possitive 
         
           userInfo.ongoingAmount = newUserOngoing;
           userInfo.pendingAmount = 0;
           userInfo.maturedAmount =  userInfo.maturedAmount.add(userInfo.requestingAmount);
           userInfo.requestingAmount = 0;
           totalMatured = totalMatured.add(userInfo.maturedAmount);
        }
        
        VaultSettings = settings;
        //if positive, send to trader, else trader send back
        return diff;
    }

    function finishSettlement() external {

        uint256 length = vaultInfo.length;
        for (uint256 vid = 0; vid < length; vid++) {
           Vault.VaultInfo memory vault = vaultInfo[vid];
           //check if the totalMatured is fullfilled or not
           require(IERC20(vault.underlying).balanceOf(address(this)) >=  vault.totalMatured, "Matured amount not fullfilled");
        }

        isSettelled = true;
    }
}
