// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuardUpgradeable
} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    ERC20Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import {Vault} from "../libraries/Vault.sol";  
import "./PKKTToken.sol";

contract PKKTVault is Ownable
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256; 
 
 
    // The PKKT TOKEN!
    PKKTToken public immutable Pkkt;
    // the underlying token: usdt/usdc/dai/etc.
    address public immutable Underlying; 
    
    //current interest rates
    Vault.SettlementSettings public VaultSettings;
    bool public isSettelled;
    uint256 private totalMatured;
 
    uint256 public immutable SettlementTimeOfDay;

    uint256 public immutable DeadlineTimeOfDay;

    //users by address
    mapping(address => Vault.UserVaultInfo) private userVaultInfo;

    //user address enumeration
    address[] private users;


    /************************************************
     *  EVENTS
     ***********************************************/

    event Deposit(address indexed account, uint256 amount, bool internal); 

    event InitiateWithdraw(address indexed account, uint256 amount);
    
    event CancelWithdraw(address indexed account, uint256 amount);

    event Redeem(address indexed account, uint256 amount);

    event CompleteWithdraw(address indexed account, uint256 amount);

    event InitiateSettlement()
 

    /************************************************
     *  CONSTRUCTOR & INITIALIZATION
     ***********************************************/

    /**
     * @notice Initializes the contract with immutable variables
     */
    constructor(
        PKKTToken _pkkt,
        address _underlying,
        uint256 _settlementTimeOfDay,
        uint256 _deadlineTimeOfDay
    ) {
        require(_underlying != address(0), "!_underlying"); 
        require(_deadlineTimeOfDay < _settlementTimeOfDay, "Deadline must be earlier than settlement time"); 
        Pkkt = _pkkt;
        Underlying = _underlying; 
        SettlementTimeOfDay = _settlementTimeOfDay;
        DeadlineTimeOfDay = _deadlineTimeOfDay;
    }



    /************************************************
     *  DEPOSIT & WITHDRAWALS
     ***********************************************/

    /**
     * @notice Deposits the `underlying` from msg.sender.
     * @param amount is the amount of `asset` to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "!amount");
        Vault.UserVaultInfo storage userInfo = userVaultInfo[msg.sender];
        userInfo.pendingAmount = userInfo.pendingAmount.add(amount);

        // An approve() by the msg.sender is required beforehand
        IERC20(Underlying).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
         
        if (userInfo.isEmpty){
            users.push(msg.sender);
            userInfo.isEmpty = false;
        } 
        emit Deposit(msg.sender, amount, false);
    }
  
    /**
     * @notice Redeems pending amounts that are owed to the account
     * @param amount is the number of underlyings to redeem
     */
    function redeem(uint256 amount) external nonReentrant {
        require(amount > 0, "!amount");
        _redeem(amount, false);
    }

    /**
     * @notice Redeems the entire pending balance that is owed to the account
     */
    function maxRedeem() external nonReentrant {
        _redeem(0, true);
    }

    /**
     * @notice Redeems amounts that are owed to the account
     * @param amount is the number of underlyings to redeem, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max redemption
     */
    function _redeem(uint256 amount, bool isMax) internal {
        Vault.UserVaultInfo storage userInfo =
            userVaultInfo[msg.sender]; 
 
        amount = isMax ? userInfo.pendingAmount : amount;
        if (amount == 0) {
            return;
        }
        require(amount <= userInfo.pendingAmount, "Exceeds available");

        userInfo.pendingAmount = userInfo.pendingAmount.sub(amount); 
        IERC20(Underlying).safeTransfer(
            address(this),
            msg.sender,
            amount
        ); 
        

        emit Redeem(msg.sender, amount); 
    }
 
    /**
     * @notice Initiates a withdrawal that can be processed once the round completes
     * @param amount is the number of underlyings to withdraw
     */
    function initiateWithdraw(uint256 amount) external nonReentrant {
        _initiateWithdraw(amount, false);
   
    }

    /**
     * @notice Withraws the entire available that is owed to the account
     */
    function maxInitiateWithdraw() external nonReentrant {
        _initiateWithdraw(0, true);
    }

    /**
     * @notice Initiate withdrawal amounts that are owed to the account
     * @param amount is the number of underlyings to initiate withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal
     */
    function _initiateWithdraw(uint256 amount, bool isMax) internal {
        require(amount > 0, "!amount");
        Vault.UserVaultInfo storage userInfo = userVaultInfo[msg.sender];

        uint256 maxAmountForRequest = userInfo.toMatureAmount.sub(userInfo.requestingAmount);
       
        amount = isMax ? maxAmountForRequest : amount;
        if (amount == 0) {
            return;
        }
        
        require(amount <= maxAmountForRequest,"Exceeds available"); 
        userInfo.requestingAmount = userInfo.requestingAmount.add(amount);  
        emit InitiateWithdraw(msg.sender, amount);

    }
 
    /**
     * @notice Cancel a withdrawal 
     * @param amount is the number of underlyings to cancel
     */
    function cancelWithdraw(uint256 amount) external nonReentrant {
        _cancelWithdraw(amount, false); 
    }

    /**
     * @notice Cancel the entire withdrawal
     */
    function maxCancelWithdraw() external nonReentrant {
        _cancelWithdraw(0, true); 
    }
 

    /**
     * @notice Cancel withdrawal amounts that are owed to the account
     * @param amount is the number of underlyings to cancel withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal cancellation
     */
    function _cancelWithdraw(uint256 amount, bool isMax) internal {
        require(amount > 0, "!amount");
        Vault.UserVaultInfo storage userInfo = userVaultInfo[msg.sender];
 
       amount = isMax ? userInfo.requestingAmount : amount;
        if (amount == 0) {
            return;
        }
        
        require(amount <= userInfo.requestingAmount,  "Exceeds available"); 
        userInfo.requestingAmount = userInfo.requestingAmount.sub(amount); 
        emit CancelWithdraw(msg.sender, amount);

    }


    /**
     * @notice Completes partially a scheduled withdrawal from a past round.
     */
    function completeWithdraw(uint256 amount) external nonReentrant {
        _completeWithdraw(amount, false); 
  
    }
    
    /**
     * @notice Completes a whole scheduled withdrawal from a past round.
     */
    function maxCompleteWithdraw() external nonReeentrant {
        _completeWithdraw(0, true);
    }

    /**
     * @notice Completes a scheduled withdrawal from a past round.
     * @param amount is the number of underlyings to complete withdrawal, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal completion
     */
    function _completeWithdraw(uint256 amount, bool isMax) internal {
        require(isSettelled, "Settlment not finished yet");
        Vault.UserVaultInfo storage userInfo = userVaultInfo[msg.sender];
 
        amount = isMax ? userInfo.maturedAmount : amount;
        if (amount == 0) {
            return;
        }

        require(amount <= userInfo.maturedAmount, "Exceeds available");
    
        IERC20(Underlying).safeTransfer(
            address(this),
            msg.sender,
            amount
        ); 
        
        userInfo.maturedAmount = userInfo.maturedAmount.sub(amount); 
        emit CompleteWithdraw(msg.sender, amount);

    }
    
    /**
     * @notice revert a scheduled withdrawal from a past round and reput to pending pool 
     * @param amount is the number of underlyings to revert
     */
    function redeposit(uint256 amount) external nonReentrant {
       
         _redeposit(amount, false); 
    }

        
    /**
     * @notice revert a whole scheduled withdrawal from a past round and reput to pending pool  
     */
    function maxRedeposit() external nonReentrant {
         _redeposit(0, true); 
    } 
 
    /**
     * @notice revert a scheduled withdrawal from a past round and reput to pending pool 
     * @param amount is the number of underlyings to revert, could be 0 when isMax=true
     * @param isMax is flag for when callers do a max withdrawal reversion
     */
    function _redeposit(uint256 amount, bool isMax) internal {
        Vault.UserVaultInfo storage userInfo = userVaultInfo[msg.sender];
 
        amount = isMax ? userInfo.maturedAmount : amount;
        if (amount == 0) {
            return;
        }

        require(amount <= userInfo.maturedAmount, "Exceeds available");
   
        userInfo.pendingAmount = userInfo.pendingAmount.add(amount);
        userInfo.maturedAmount = userInfo.maturedAmount.sub(amount); 
        emit Deposit(msg.sender, amount, true); 
 
    }

    //todo: implement
    function harvest() external nonReentrant {

    }


        


    /************************************************
     *  SETTLEMENT
     ***********************************************/

    //todo: implement pkkt reward
    function initiateSettlement(Vault.SettlementSettings memory settings) external nonReentrant, onlyOwner returns(uint256){
  
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

    function finishSettlement() external nonReentrant {
        //check if the totalMatured is fullfilled or not
        require(IERC20(Underlying).balanceOf(address(this)) >=  totalMatured, "Matured amount not fullfilled");
        isSettelled = true;
    }
}
