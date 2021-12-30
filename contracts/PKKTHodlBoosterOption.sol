// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {
    ReentrancyGuardUpgradeable
} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "hardhat/console.sol";
 
import {Utils} from "./libraries/Utils.sol";  
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/IPKKTStructureOption.sol";
import "./interfaces/IExecuteSettlement.sol"; 
import "./interfaces/IOptionVault.sol"; 

contract PKKTHodlBoosterOption is ERC20Upgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, IPKKTStructureOption, IExecuteSettlement {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using StructureData for StructureData.UserState;
    using Utils for uint256;

    event Deposit(address indexed account, uint256 indexed round,uint256 amount); 
    event Withdraw(address indexed account, address indexed asset, uint256 amount);
    event CloseOption(uint256 indexed round);
    event CommitOption(uint256 indexed round);
    event OpenOption(uint256 indexed round);
    uint8 public depositAssetAmountDecimals;
    uint8 public counterPartyAssetAmountDecimals;
      
    address public depositAsset;
    address public counterPartyAsset;
 
    bool public isEth;
     uint256 public currentRound; 
     mapping(uint256=>uint256) public optionHeights;
     mapping(uint256=>StructureData.OptionState) public optionStates;
     address[] public usersInvolved;  
     mapping(address=>StructureData.UserState) public userStates; 
     bool public underSettlement; 
     bool public callOrPut; //put accept stablecoin only, call accept asset coins only
     IPKKTStructureOption public counterPartyOption;
     address public counterParty;
     IOptionVault public optionVault;
     uint256 public totalReleasedDepositAssetAmount; 
     uint256 public totalReleasedCounterPartyAssetAmount; 
     
     //private data for complete withdrawal and redeposit 
     mapping(address=>uint256) private releasedDepositAssetAmount;
     mapping(address=>uint256) private releasedCounterPartyAssetAmount;  
     uint256 private assetToTerminateForNextRound; 
     uint256 private quota;


    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    function initialize(
        string memory name,
        string memory symbol,
        address _depositAsset,
        address _counterPartyAsset,
        uint8 _depositAssetAmountDecimals,
        uint8 _counterPartyAssetAmountDecimals,
        address _vaultAddress,
        bool _callOrPut,
        address _settler
    ) public initializer {
        require(_vaultAddress != address(0), "Empty vault address");
        __ReentrancyGuard_init();
        ERC20Upgradeable.__ERC20_init(name, symbol);
        AccessControlUpgradeable.__AccessControl_init();
        // Contract deployer will be able to grant and revoke trading role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Address capable of initiating and finizalizing settlement
        _setupRole(StructureData.SETTLER_ROLE, _settler);
        _setupRole(StructureData.SETTLER_ROLE, _vaultAddress);
        depositAsset = _depositAsset;
        counterPartyAsset = _counterPartyAsset;
        isEth = _depositAsset == address(0);
        depositAssetAmountDecimals = _depositAssetAmountDecimals;
        counterPartyAssetAmountDecimals = _counterPartyAssetAmountDecimals;
        optionVault = IOptionVault(_vaultAddress);
        callOrPut = _callOrPut;
    } 
    function setCounterPartyOption(address _counterParty) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_counterParty != address(this), "Cannot set self as counter party");
        counterPartyOption = IPKKTStructureOption(_counterParty);
        counterParty = _counterParty;
    }
          
    function decimals() public view override returns (uint8) {
        return depositAssetAmountDecimals;
    }

    function vaultAddress() public view override returns(address) {
        return optionVault.getAddress();
    }


    function getAccountBalance() external override view returns (StructureData.UserBalance memory) {
       StructureData.UserState storage userState = userStates[msg.sender]; 

       StructureData.UserBalance memory result = StructureData.UserBalance({
           pendingDepositAssetAmount:userState.pendingAsset,
           releasedDepositAssetAmount: releasedDepositAssetAmount[msg.sender],
           releasedCounterPartyAssetAmount: releasedCounterPartyAssetAmount[msg.sender],
           lockedDepositAssetAmount:0 
       });
       if (underSettlement) { 
           if (currentRound > 2) {
               result.lockedDepositAssetAmount = userState.deriveVirtualLocked(optionStates[currentRound - 2].premiumRate);
           }
           else { 
                result.lockedDepositAssetAmount = userState.tempLocked;
           }
       }
       else {
           result.lockedDepositAssetAmount = userState.GetOngoingAsset(0);
       }
       return result;
    }

    function getWithdrawable(address _asset) external override view returns(uint256) {
        if (_asset == depositAsset) { 
            return optionStates[currentRound].totalAmount.add(totalReleasedDepositAssetAmount);
        }
        if (_asset == counterPartyAsset) {
            return totalReleasedCounterPartyAssetAmount;
        }
        revert("invalid asset");
    }

    function getOptionSnapShot() external override view returns(StructureData.OptionSnapshot memory) {
       StructureData.OptionState storage currentOption = optionStates[currentRound];
       StructureData.OptionState memory lockedOption;
       StructureData.OptionState memory onGoingOption;
       
       //StructureData.OptionState storage currentOption = optionStates[currentRound];
       StructureData.OptionSnapshot memory result = StructureData.OptionSnapshot({
            totalPending: currentOption.totalAmount,
            totalReleasedDeposit :  totalReleasedDepositAssetAmount,
            totalReleasedCounterParty : totalReleasedCounterPartyAssetAmount,
            totalLocked : 0 
       }); 
       if (underSettlement) { 
           lockedOption = optionStates[currentRound - 1];
           if (currentRound > 2) {
              onGoingOption = optionStates[currentRound - 2];
              result.totalLocked = lockedOption.totalAmount.add(
                onGoingOption.totalAmount.withPremium(onGoingOption.premiumRate)
              );
           }
           else{
               result.totalLocked = lockedOption.totalAmount;
           }
       }
       else if (currentRound > 1) {
           onGoingOption = optionStates[currentRound - 1];
           result.totalLocked = onGoingOption.totalAmount;
       }
       return result;
    }

    function completeWithdraw(uint256 _amount, address _asset) external override nonReentrant { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");  
       require(_asset == depositAsset || _asset == counterPartyAsset, "Invalid asset address");
       if (_asset == depositAsset) {
           uint256 releasedAmount = releasedDepositAssetAmount[msg.sender];
           require(releasedAmount >= _amount, "Exceed available");
           releasedDepositAssetAmount[msg.sender] = releasedAmount.sub(_amount); 
           totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(_amount);
       }
       else {
           
           uint256 releasedAmount = releasedCounterPartyAssetAmount[msg.sender];
           require(releasedAmount >= _amount, "Exceed available");
           releasedCounterPartyAssetAmount[msg.sender] = releasedAmount.sub(_amount);
           totalReleasedCounterPartyAssetAmount = totalReleasedCounterPartyAssetAmount.sub(_amount);
       }
       
        optionVault.withdraw(msg.sender, _amount, _asset, false);
    }


    function initiateWithraw(uint256 _assetToTerminate) external override {
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        if (underSettlement) {  
            uint256 newAssetToTerminate = userState.assetToTerminateForNextRound.add(_assetToTerminate); 
            if (currentRound == 2) {
                require(newAssetToTerminate <=  userState.tempLocked, "Exceeds available"); 
                StructureData.OptionState storage previousOption = optionStates[currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);  
            }
            else {
                StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
                uint256 totalLocked = userState.deriveVirtualLocked(onGoingOption.premiumRate); 
                require(newAssetToTerminate <=  totalLocked, "Exceeds available");   
                //store temporarily
                assetToTerminateForNextRound = assetToTerminateForNextRound.add(_assetToTerminate); 
            } 
            userState.assetToTerminateForNextRound = newAssetToTerminate;
        }
        else {
            uint256 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate);
            uint256 ongoing = userState.GetOngoingAsset(0);
            require(newAssetToTerminate <= ongoing, "Exceeds available");
            userState.assetToTerminate = newAssetToTerminate;
            StructureData.OptionState storage previousOption = optionStates[currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);
        }

    }

    function cancelWithdraw(uint256 _assetToTerminate) external override { 
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        if (underSettlement) {  
            require(_assetToTerminate <= userState.assetToTerminateForNextRound, "Exceed available");
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.sub(_assetToTerminate); 
            if (currentRound == 2) { 
                StructureData.OptionState storage previousOption = optionStates[currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);  
            }
            else { 
                //store temporarily
                assetToTerminateForNextRound = assetToTerminateForNextRound.sub(_assetToTerminate); 
            }  
        }
        else {  
            require(_assetToTerminate <= userState.assetToTerminate, "Exceed available");
            userState.assetToTerminate = userState.assetToTerminate.sub(_assetToTerminate); 
            StructureData.OptionState storage previousOption = optionStates[currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);
        }

    } 
    
    
    function maxInitiateWithdraw() external override {  
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        
        if (underSettlement) {    
            if (currentRound == 2) { 
                uint256 diff = userState.tempLocked.sub(userState.assetToTerminateForNextRound); 
                if (diff > 0) { 
                    userState.assetToTerminateForNextRound = userState.tempLocked; 
                    StructureData.OptionState storage previousOption = optionStates[currentRound - 1]; 
                    previousOption.totalTerminate = previousOption.totalTerminate.add(diff);  
                    //console.log("maxInitiateWithdraw %s %d %d", name(), previousOption.round,  previousOption.totalTerminate);
                }
            }
            else {
                StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
                uint256 totalLocked = userState.deriveVirtualLocked(onGoingOption.premiumRate); 
                uint256 diff = totalLocked.sub(userState.assetToTerminateForNextRound);
                if (diff > 0) { 
                    userState.assetToTerminateForNextRound = totalLocked;
                    //store temporarily
                    assetToTerminateForNextRound = assetToTerminateForNextRound.add(diff);  
                }
            } 
        }
        else {    
            uint256 onGoing = userState.GetOngoingAsset(0);
            uint256 diff = onGoing.sub(userState.assetToTerminate);
            if (diff > 0) { 
                userState.assetToTerminate = onGoing; 
                StructureData.OptionState storage previousOption = optionStates[currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(diff);  
            }
        }
 
    }

    function maxCancelWithdraw() external override {   
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[msg.sender];  
        if (underSettlement) {   
            if (currentRound == 2) {  
                StructureData.OptionState storage previousOption = optionStates[currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.sub(userState.assetToTerminateForNextRound);   
            }
            else { 
                //store temporarily
                assetToTerminateForNextRound = assetToTerminateForNextRound.sub(userState.assetToTerminateForNextRound);  
            }  
            userState.assetToTerminateForNextRound = 0;
        }
        else {   
            StructureData.OptionState storage onGoingOption = optionStates[currentRound - 1];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.sub(userState.assetToTerminate);
            userState.assetToTerminate = 0; 
        } 
    }
    
    
    function withdraw(uint256 _amount, address _asset) external override nonReentrant { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");  
       require(_asset == depositAsset || _asset == counterPartyAsset, "Invalid asset address"); 
       if (_asset == depositAsset) {
           //todo: 0 out released amount if missing balance from trader
           uint256 releasedAmount = releasedDepositAssetAmount[msg.sender];
           if (releasedAmount <= _amount) { 
               StructureData.UserState storage userState =  userStates[msg.sender];  
               uint256 redeemAmount = _amount.sub(releasedAmount);
               require(userState.pendingAsset >= redeemAmount, "Exceeds available"); 
               releasedDepositAssetAmount[msg.sender] = 0; 
               totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(releasedAmount);
               userState.pendingAsset = userState.pendingAsset.sub(redeemAmount);
               StructureData.OptionState storage optionState = optionStates[currentRound];
               optionState.totalAmount = optionState.totalAmount.sub(redeemAmount);  
           }
           else { 
               releasedDepositAssetAmount[msg.sender] = releasedAmount.sub(_amount); 
               totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(_amount);
           }
       }
       else {
 
           //same result as completeWithdraw 
           uint256 releasedAmount = releasedCounterPartyAssetAmount[msg.sender];
           require(releasedAmount >= _amount, "Exceed available");
           releasedCounterPartyAssetAmount[msg.sender] = releasedAmount.sub(_amount);
           totalReleasedCounterPartyAssetAmount = totalReleasedCounterPartyAssetAmount.sub(_amount);
       }
        optionVault.withdraw(msg.sender, _amount, _asset, false);
        emit Withdraw(msg.sender, _asset, _amount);
    }
 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    function redeposit(uint256 _amount) external override nonReentrant { 
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 releasedAmount = releasedDepositAssetAmount[msg.sender];
       require(releasedAmount >= _amount, "Exceed available");
       releasedDepositAssetAmount[msg.sender] = releasedAmount.sub(_amount);
       totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(_amount);
       _depositFor(msg.sender, _amount, currentRound, 0);
    }

    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    function redepositToCounterParty(uint256 _amount) external override { 
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 releasedAmount = releasedCounterPartyAssetAmount[msg.sender];
       require(releasedAmount >= _amount, "Exceed available");
       releasedCounterPartyAssetAmount[msg.sender] = releasedAmount.sub(_amount);
       totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(_amount);
       address[] memory addresses = new address[](1);
       uint256[] memory amounts = new uint256[](1);
       uint256[] memory terminates = new uint256[](1);
       addresses[0] = msg.sender;
       amounts[0] = _amount;
       terminates[0] = 0;
       counterPartyOption.depositFromCounterParty(addresses, amounts, terminates);
    }


    //todo: what if quata is not enough
    function depositFromCounterParty(address[] memory addresses, uint256[] memory _amounts,  uint256[] memory _terminates) override external {
        require(msg.sender == counterParty, "Only counter party option can call this method");
        uint256 round = underSettlement ? currentRound - 1 : currentRound;
        for(uint256 i = 0; i < 0 ; i++){
            _depositFor(addresses[i], _amounts[i], round, _terminates[i]);
        } 
    }
    //deposit eth
    function depositETH() external payable override nonReentrant{ 
       require(currentRound > 0, "!Started");
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
       
        //todo: convert to weth  
       _depositFor(msg.sender, msg.value, currentRound, 0);
       payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount) external override nonReentrant{   
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(msg.sender, _amount,currentRound, 0);  
        IERC20(depositAsset).safeTransferFrom(msg.sender, vaultAddress(), _amount);
    }
 
  
    function _depositFor(address _userAddress, uint256 _amount, uint256 _round, uint256 _toTerminate) private { 
        StructureData.OptionState storage optionState = optionStates[_round];
        require(optionState.totalAmount.add(_amount) <= quota, "Not enough quota");
        StructureData.UserState storage userState =  userStates[_userAddress]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved.push(_userAddress);
        } 
        if (_round != currentRound) { 
            userState.tempLocked = userState.tempLocked.add(_amount); 
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.add(_toTerminate);
            assetToTerminateForNextRound = assetToTerminateForNextRound.add(_toTerminate);
        }
        else { 
            userState.pendingAsset = userState.pendingAsset.add(_amount); 
        }
        optionState.totalAmount = optionState.totalAmount.add(_amount);
        
        emit Deposit(_userAddress, _round, _amount);
    }

 
    function redeem(uint256 _amount) external override nonReentrant{  
         require(_amount > 0, "!amount"); 
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         require(userState.pendingAsset >= _amount, "Exceeds available");
         userState.pendingAsset = userState.pendingAsset.sub(_amount); 
         StructureData.OptionState storage optionState = optionStates[currentRound];
         optionState.totalAmount = optionState.totalAmount.sub(_amount);
         optionVault.withdraw(msg.sender, _amount, depositAsset, true); 
         emit Withdraw(msg.sender, depositAsset, _amount);
    }
 
  
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    function getRoundData(uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
        return optionStates[optionHeights[_blockHeight]];
    } 


   /*
    *  Following operations can only be triggered from ISettlementAggregator with the settler role
    */

   //first, open t+1 round
   function rollToNext(uint256 _quota) external override onlyRole(StructureData.SETTLER_ROLE) returns(uint256 _pendingAmount){   

       require(!underSettlement, "Being settled"); 
      
       if (currentRound > 1) {
           require(optionStates[currentRound-1].strikePrice > 0,  "Strike Price not set");
       } 

       underSettlement = true; 
       quota = _quota;
        currentRound = currentRound + 1;
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: currentRound,
                            totalAmount: 0,
                            totalTerminate: 0,
                            premiumRate:  0,
                            pricePrecision: 0,
                            strikePrice: 0,
                            executed: false,
                            callOrPut: callOrPut
                        });
        optionStates[currentRound] = currentOption; 
       if (currentRound > 1) {
            uint256 userCount = usersInvolved.length;
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                if(userState.pendingAsset != 0) {  
                    userState.tempLocked = userState.pendingAsset;  
                }   
                userState.pendingAsset = 0;
            }
       }
       else {
           underSettlement = false;
       }
        emit OpenOption(currentRound); 
        if (currentRound > 1) {
            return optionStates[currentRound-1].totalAmount;
        }
        return 0;
    }
    

   //then dry run settlement and get accounting result
   function dryRunSettlement(bool _execute) external override view onlyRole(StructureData.SETTLER_ROLE) returns(StructureData.SettlementAccountingResult memory _result) {
        require(underSettlement, "Not being settled");
        require(currentRound > 1, "Nothing to settle");

        StructureData.OptionState storage lockedOption = optionStates[currentRound - 1]; 
        StructureData.SettlementAccountingResult memory result = StructureData.SettlementAccountingResult({
            option: address(this),
            round: currentRound - 1,
            depositAmount: lockedOption.totalAmount,
            executed: _execute,
            autoRollAmount: 0,
            autoRollPremium: 0,
            releasedAmount: 0,
            releasedPremium: 0,
            autoRollCounterPartyAmount: 0,
            autoRollCounterPartyPremium: 0,
            releasedCounterPartyAmount: 0,
            releasedCounterPartyPremium: 0
        });
       if (currentRound > StructureData.MATUREROUND + 1) { 
            StructureData.OptionState memory previousOptionState = optionStates[currentRound - StructureData.MATUREROUND - 1];
            StructureData.MaturedState memory maturedState = StructureData.calculateMaturity(_execute, previousOptionState, callOrPut,
            depositAssetAmountDecimals, counterPartyAssetAmountDecimals); 
            if (_execute) { 
                result.autoRollCounterPartyAmount = maturedState.autoRollCounterPartyAssetAmount;
                result.autoRollCounterPartyPremium = maturedState.autoRollCounterPartyAssetPremiumAmount;
                result.releasedCounterPartyAmount = maturedState.releasedCounterPartyAssetAmount;
                result.releasedCounterPartyPremium = maturedState.releasedCounterPartyAssetPremiumAmount;
            }
            else { 
                result.autoRollAmount = maturedState.autoRollDepositAssetAmount;
                result.autoRollPremium = maturedState.autoRollDepositAssetPremiumAmount;
                result.releasedAmount = maturedState.releasedDepositAssetAmount;
                result.releasedPremium = maturedState.releasedDepositAssetPremiumAmount;
            } 
       } 
       return result;
   }

   //then, make decision based on dry run result and close t-1 round
   function closePrevious(bool _execute) external override onlyRole(StructureData.SETTLER_ROLE)  
   returns(StructureData.MaturedState memory _maturedState) {   
        require(underSettlement, "Not being settled");
        require (currentRound > StructureData.MATUREROUND + 1, "no matured");
        uint maturedRound = currentRound - StructureData.MATUREROUND - 1;
        StructureData.OptionState storage previousOptionState = optionStates[maturedRound];   
        StructureData.MaturedState memory maturedState = StructureData.calculateMaturity(_execute, previousOptionState, callOrPut,
            depositAssetAmountDecimals, counterPartyAssetAmountDecimals);     
        previousOptionState.executed = _execute;
        if (_execute) {
            totalReleasedCounterPartyAssetAmount = totalReleasedCounterPartyAssetAmount.
            add(maturedState.releasedCounterPartyAssetAmount).add(maturedState.releasedCounterPartyAssetPremiumAmount); 
        }
        else {
            totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.
            add(maturedState.releasedDepositAssetAmount).add(maturedState.releasedDepositAssetPremiumAmount);

        }
        if (previousOptionState.totalAmount > 0) { 
            autoRoll(_execute, previousOptionState, maturedState);
        }    
        emit CloseOption(maturedRound);
        return maturedState;
   }

   //next, commit t round
   function commitCurrent() external override onlyRole(StructureData.SETTLER_ROLE) nonReentrant {  
        require (currentRound > 1, "not started");
        if(currentRound <= 2 && !underSettlement) {
           underSettlement = true;
       }
        require(underSettlement, "Not being settled");
        
        uint256 lockedRound = currentRound - 1;
        StructureData.OptionState storage optionState = optionStates[lockedRound];  
        //mint for the current option
        _mint(address(this), optionState.totalAmount);
        uint256 userCount = usersInvolved.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if(userState.tempLocked != 0) {  
                //transfer each user a share of the option to trigger transfer event
                //can be used to calculate the user option selling operations
                //utilizing some web3 indexed services, take etherscan api/graphql etc.
                _transfer(address(this), userAddress, userState.tempLocked);
            } 
            if (userState.assetToTerminateForNextRound != 0){ 
                userState.assetToTerminate = userState.assetToTerminateForNextRound;
                userState.assetToTerminateForNextRound = 0;
            } 
            else {
                userState.assetToTerminate = 0;
            }
            userState.SetOngoingAsset(userState.tempLocked); 
            userState.tempLocked = 0; 
         }
        if (optionState.totalTerminate == 0) {
            optionState.totalTerminate = assetToTerminateForNextRound;
        }
        assetToTerminateForNextRound = 0;
        optionHeights[lockedRound] = block.number; //commit current option at current block
        emit CommitOption(lockedRound);
        underSettlement = false;
   }
       
   //at last, specify option parameters
   function setOptionParameters(StructureData.OptionParameters memory _optionParameters) external override onlyRole(StructureData.SETTLER_ROLE) {
        
        require (currentRound > 1, "not started"); 
        require(!underSettlement, "Being settled"); 
        uint256 previousRound = currentRound - 1;
        StructureData.OptionState storage optionState = optionStates[previousRound]; 
        require(optionState.strikePrice == 0, "Strike Price already set");
        optionState.strikePrice = _optionParameters.strikePrice;
        optionState.premiumRate = _optionParameters.premiumRate;
        optionState.pricePrecision = _optionParameters.pricePrecision;
   }

 


   address[] private autoRolledUsers;
   uint256[] private autoRolledAmounts;
   uint256[] private toTerminateAmounts;

   function autoRoll(bool _counterParty, StructureData.OptionState memory _optionState, StructureData.MaturedState memory _maturedState) private {
        uint256 userCount = usersInvolved.length; 
        uint256 totalAutoRollBase = _optionState.totalAmount.sub(_optionState.totalTerminate);
        if (!_counterParty) {
            uint256 lockedRound = currentRound - 1; 
            uint256 totalReleased = _maturedState.releasedDepositAssetAmount.add(_maturedState.releasedDepositAssetPremiumAmount);
            uint256 totalAutoRoll = _maturedState.autoRollDepositAssetAmount.add(_maturedState.autoRollDepositAssetPremiumAmount);
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                
                uint256 ongoing = userState.GetOngoingAsset(0);  
                if (ongoing == 0) {
                    userState.assetToTerminate = 0;
                    continue;
                }
                
                uint256 amountToTerminate = Utils.getAmountToTerminate(totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
                if (amountToTerminate > 0) {
                    releasedDepositAssetAmount[userAddress] = 
                    releasedDepositAssetAmount[userAddress].add(amountToTerminate); 
                }
                uint256 remainingAmount = Utils.getAmountToTerminate(totalAutoRoll, ongoing.sub(userState.assetToTerminate), totalAutoRollBase);
                if (remainingAmount > 0) { 
                    _depositFor(userAddress, remainingAmount, lockedRound, 0);
                } 
                
                userState.assetToTerminate = 0;
            }  
            return;
        }

        uint256 totalReleased2 = _maturedState.releasedCounterPartyAssetAmount.add(_maturedState.releasedCounterPartyAssetPremiumAmount);
        uint256 totalAutoRoll2 = _maturedState.autoRollCounterPartyAssetAmount.add(_maturedState.autoRollCounterPartyAssetPremiumAmount);  
        
        //debit assetToTerminateForNextRound if executed
        if (assetToTerminateForNextRound > 0 && totalAutoRoll2 > 0) {
             uint256 virtualAutoRoll = totalAutoRollBase.withPremium(_optionState.premiumRate);
             if (virtualAutoRoll >= assetToTerminateForNextRound) {
                 assetToTerminateForNextRound = 0;
             }
             else {
                 assetToTerminateForNextRound = assetToTerminateForNextRound.sub(virtualAutoRoll);
             }
        }
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress];  
            
            uint256 onGoing = userState.GetOngoingAsset(0);  
            if (onGoing == 0) {
                userState.assetToTerminate = 0;
                continue;
            } 
            uint256 amountToTerminate = Utils.getAmountToTerminate(totalReleased2, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) {
                releasedCounterPartyAssetAmount[userAddress] = 
                releasedCounterPartyAssetAmount[userAddress].add(amountToTerminate);
            }
            onGoing = onGoing.sub(userState.assetToTerminate);
            uint256 remainingAmount = Utils.getAmountToTerminate(totalAutoRoll2, onGoing, totalAutoRollBase);
            if (remainingAmount > 0){   
                autoRolledAmounts.push(remainingAmount);
                autoRolledUsers.push(userAddress); 
                (uint256 onGoingTerminate,) = userState.deriveWithdrawRequest(_optionState.premiumRate);
                if (onGoingTerminate != 0) {
                    uint256 virtualOnGoing =  onGoing.withPremium(_optionState.premiumRate);
                    onGoingTerminate = Utils.getAmountToTerminate(remainingAmount, onGoingTerminate, virtualOnGoing);
                } 
                toTerminateAmounts.push(onGoingTerminate);
            } 
            userState.assetToTerminate = 0;
        } 
        
        uint256 count = autoRolledAmounts.length;
        if (count == 0) {
            return;
        }
        
        address[] memory localAutoRolledUsers = new address[](count);
        uint256[] memory localAutoRolledAmounts = new uint256[](count);
        uint256[] memory localToTerminateAmounts = new uint256[](count);
        for(uint i = 0; i < count; i++) {
            localAutoRolledUsers[i] = autoRolledUsers[i];
            localAutoRolledAmounts[i] = autoRolledAmounts[i];
            localToTerminateAmounts[i] = toTerminateAmounts[i];
        }
        delete autoRolledUsers;
        delete autoRolledAmounts;
        delete toTerminateAmounts;
        counterPartyOption.depositFromCounterParty(localAutoRolledUsers, localAutoRolledAmounts, localToTerminateAmounts); 
   }

}