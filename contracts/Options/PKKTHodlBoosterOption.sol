// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; 
import "hardhat/console.sol";
 
import {Utils} from "../libraries/Utils.sol";  
import {StructureData} from "../libraries/StructureData.sol";     
import "../interfaces/IPKKTStructureOption.sol";
import "../interfaces/IExecuteSettlement.sol"; 
import "../interfaces/IOptionVault.sol"; 
abstract contract PKKTHodlBoosterOption is ERC20Upgradeable, OwnableUpgradeable, IPKKTStructureOption, IExecuteSettlement {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using StructureData for StructureData.UserState;

    event Deposit(address indexed account, uint256 indexed round,uint256 amount); 
    event Withdraw(address indexed account, address indexed asset, uint256 amount);
    event CloseOption(uint256 indexed round);
    event CommitOption(uint256 indexed round);
    event OpenOption(uint256 indexed round);
 
    uint256 public constant RATIOMULTIPLIER = 10000;
    uint8 internal depositAssetAmountDecimals;
    uint8 internal counterPartyAssetAmountDecimals;
      
    address public depositAsset;
    address public counterPartyAsset;
 
    bool public isEth;
     uint256 private quota;
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
     //todo: maintain value
     uint256 public leftOverDepositAssetAmount;
     uint256 public leftOverCounterPartyAssetAmount;
     
     //private data for complete withdrawal and redeposit 
     mapping(address=>uint256) private releasedDepositAssetAmount;
     mapping(address=>uint256) private releasedCounterPartyAssetAmount;  


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
        bool _callOrPut
    ) internal initializer {
        require(_vaultAddress != address(0), "Empty vault address");
        ERC20Upgradeable.__ERC20_init(name, symbol);
        OwnableUpgradeable.__Ownable_init();
        depositAsset = _depositAsset;
        counterPartyAsset = _counterPartyAsset;
        isEth = _depositAsset == address(0);
        depositAssetAmountDecimals = _depositAssetAmountDecimals;
        counterPartyAssetAmountDecimals = _counterPartyAssetAmountDecimals;
        optionVault = IOptionVault(_vaultAddress);
        callOrPut = _callOrPut;
    }

    function setCounterPartyOption(address _counterParty) external {
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
           lockedDepositAssetAmount:userState.lockedAsset, 
           ongoingDepositAssetAmount: userState.GetOngoingAsset(0)
       });
       return result;
    }

    function getOptionSnapShot() external override view returns(StructureData.OptionSnapshot memory) {
       StructureData.OptionState storage currentOption = optionStates[currentRound];
       StructureData.OptionState storage lockedOption = optionStates[underSettlement ? currentRound - 1 : currentRound];
       StructureData.OptionState storage onGoingOption = optionStates[underSettlement ? currentRound - 2 : currentRound - 1];

       //StructureData.OptionState storage currentOption = optionStates[currentRound];
       StructureData.OptionSnapshot memory result = StructureData.OptionSnapshot({
            totalPending: currentOption.totalAmount,
            totalReleasedDeposit :  totalReleasedDepositAssetAmount,
            totalReleasedCounterParty : totalReleasedCounterPartyAssetAmount,
            totalOngoing : onGoingOption.totalAmount,
            totalLocked: lockedOption.totalAmount,
            //todo :implement
            releasedDepositAvailable : false,
            releasedCounterPartyAvailable: false
       }); 
       return result;
    }

    function completeWithdraw(uint256 _amount, address _asset) external override { 
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
       
        optionVault.withdraw(msg.sender, _amount, _asset);
    }
    function initiateWithraw(uint256 _assetToTerminate) external override {
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        if (underSettlement) { 
            require(currentRound > 1, "No locked");
            uint256 newAssetToTerminate = userState.assetToTerminateForNextRound.add(_assetToTerminate);
            uint256 locked = userState.lockedAsset;
            require(newAssetToTerminate <= locked, "Exceeds available");
            userState.assetToTerminateForNextRound = newAssetToTerminate;
            StructureData.OptionState storage lockedOption = optionStates[currentRound - 1];
            lockedOption.totalTerminate = lockedOption.totalTerminate.add(_assetToTerminate);
        }
        else {
            require(currentRound > 2, "No on going");
            uint256 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate);
            uint256 ongoing = userState.GetOngoingAsset(0);
            require(newAssetToTerminate <= ongoing, "Exceeds available");
            userState.assetToTerminate = newAssetToTerminate;
            StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.add(_assetToTerminate);
        }

    }

    function cancelWithdraw(uint256 _assetToTerminate) external override { 
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        if (underSettlement) { 
            require(currentRound > 1, "No locked");
            require(_assetToTerminate <= userState.assetToTerminateForNextRound, "Exceed available");
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.sub(_assetToTerminate); 
            StructureData.OptionState storage lockedOption = optionStates[currentRound - 1];
            lockedOption.totalTerminate = lockedOption.totalTerminate.sub(_assetToTerminate);
        }
        else { 
            require(currentRound > 2, "No on going");
            require(_assetToTerminate <= userState.assetToTerminate, "Exceed available");
            userState.assetToTerminate = userState.assetToTerminate.sub(_assetToTerminate);
            StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.sub(_assetToTerminate);
        }

    } 
    
    
    function maxInitiateWithdraw() external override {  
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        if (underSettlement) {  
            require(currentRound > 1, "No locked");
            userState.assetToTerminateForNextRound = userState.lockedAsset;
            StructureData.OptionState storage lockedOption = optionStates[currentRound - 1];
            lockedOption.totalTerminate = lockedOption.totalTerminate.add(userState.lockedAsset);
        }
        else {  
            require(currentRound > 2, "No on going");
            userState.assetToTerminate = userState.GetOngoingAsset(0);
            StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.add(userState.assetToTerminate);
        }
 
    }

    function maxCancelWithdraw() external override {   
        StructureData.UserState storage userState =  userStates[msg.sender];  
        if (underSettlement) {  
            require(currentRound > 1, "No locked");
            StructureData.OptionState storage lockedOption = optionStates[currentRound - 1];
            lockedOption.totalTerminate = lockedOption.totalTerminate.sub( userState.assetToTerminateForNextRound);
            userState.assetToTerminateForNextRound = 0;
        }
        else {  
            require(currentRound > 2, "No on going");
            StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.sub(userState.assetToTerminate);
            userState.assetToTerminate = 0;
        } 
    }
    
    
    function withdraw(uint256 _amount, address _asset) external override { 
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

           //todo: 0 out released amount if missing balance from trader
           //same result as completeWithdraw
           uint256 releasedAmount = releasedCounterPartyAssetAmount[msg.sender];
           require(releasedAmount >= _amount, "Exceed available");
           releasedCounterPartyAssetAmount[msg.sender] = releasedAmount.sub(_amount);
           totalReleasedCounterPartyAssetAmount = totalReleasedCounterPartyAssetAmount.sub(_amount);
       }
        optionVault.withdraw(msg.sender, _amount, _asset);
        emit Withdraw(msg.sender, _asset, _amount);
    }
 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    function redeposit(uint256 _amount) external override { 
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 releasedAmount = releasedDepositAssetAmount[msg.sender];
       require(releasedAmount >= _amount, "Exceed available");
       releasedDepositAssetAmount[msg.sender] = releasedAmount.sub(_amount);
       totalReleasedDepositAssetAmount = totalReleasedDepositAssetAmount.sub(_amount);
       _depositFor(msg.sender, _amount, currentRound);
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
       addresses[0] = msg.sender;
       amounts[0] = _amount;
       counterPartyOption.depositFromCounterParty(addresses, amounts);
    }


    //todo: what if quata is not enough
    function depositFromCounterParty(address[] memory addresses, uint256[] memory _amounts) override external {
        require(msg.sender == counterParty, "Only counter party option can call this method");
        uint256 round = underSettlement ? currentRound - 1 : currentRound;
        for(uint256 i = 0; i < 0 ; i++){
            _depositFor(addresses[i], _amounts[i], round);
        } 
    }
    //deposit eth
    function depositETH() external payable override { 
       require(currentRound > 0, "!Started");
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
       
        //todo: convert to weth  
       _depositFor(msg.sender, msg.value, currentRound);
       payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount) external override {   
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(msg.sender, _amount,currentRound);  
        IERC20(depositAsset).safeTransferFrom(msg.sender, vaultAddress(), _amount);
    }
 
  
    function _depositFor(address _userAddress, uint256 _amount, uint256 _round) private { 
        StructureData.OptionState storage optionState = optionStates[_round];
        require(optionState.totalAmount.add(_amount) <= quota, "Not enough quota");
        StructureData.UserState storage userState =  userStates[_userAddress]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved.push(_userAddress);
        } 
        userState.pendingAsset = userState.pendingAsset.add(_amount); 
        optionState.totalAmount = optionState.totalAmount.add(_amount);
        
        emit Deposit(_userAddress, _round, _amount);
    }

 
    function redeem(uint256 _amount) external override {  
         require(_amount > 0, "!amount"); 
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         require(userState.pendingAsset >= _amount, "Exceeds available");
         userState.pendingAsset = userState.pendingAsset.sub(_amount); 
         StructureData.OptionState storage optionState = optionStates[currentRound];
         optionState.totalAmount = optionState.totalAmount.sub(_amount);
         optionVault.withdraw(msg.sender, _amount, depositAsset); 
         emit Withdraw(msg.sender, depositAsset, _amount);
    }
 
  
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    function getRoundData(uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
        return optionStates[optionHeights[_blockHeight]];
    } 

   function dryRunSettlement(bool _execute) external override view onlyOwner returns(StructureData.SettlementResult memory _result) {
        require(underSettlement, "Not being settled");
        require(currentRound > 1, "Nothing to settle");

        StructureData.OptionState storage lockedOption = optionStates[currentRound - 1]; 
        StructureData.SettlementResult memory result = StructureData.SettlementResult({
            option: address(this),
            round: currentRound - 1,
            depositAmount: lockedOption.totalAmount,
            leftOverAmount: leftOverDepositAssetAmount,
            leftOverCounterPartyAmount: leftOverCounterPartyAssetAmount,
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
            StructureData.MaturedState memory maturedState = _calculateMaturity(_execute, previousOptionState); 
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

   //first, open t+1 round
   function rollToNext(uint256 _quota) external override onlyOwner {   

       require(!underSettlement, "Being settled");
       underSettlement = true; 
         quota = _quota;
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
        currentRound = currentRound + 1;
        optionStates[currentRound] = currentOption; 
        emit OpenOption(currentRound); 
       if (currentRound > 1) {
            uint256 userCount = usersInvolved.length;
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                if(userState.pendingAsset != 0) {  
                    userState.lockedAsset = userState.pendingAsset;
                }  
                userState.pendingAsset = 0;
            }
       }
       else {
           underSettlement = false;
       }
    }

   //then close t-1 round
   function closePrevious(bool _execute) external override onlyOwner {   
        require(underSettlement, "Not being settled");
        if (currentRound <= StructureData.MATUREROUND + 1) { 
            return;
        }
        uint maturedRound = currentRound - StructureData.MATUREROUND - 1;
        StructureData.OptionState storage previousOptionState = optionStates[maturedRound];   
        StructureData.MaturedState memory maturedState = _calculateMaturity(_execute, previousOptionState);  
        optionVault.setMaturityState(maturedState, depositAsset, counterPartyAsset);
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
            autoRoll(_execute, previousOptionState.totalAmount, maturedState);
        }   
        emit CloseOption(maturedRound);
   }

   //at last, commit t round
   function commitCurrent(StructureData.OptionParameters memory _optionParameters) external override onlyOwner {  
        if (currentRound <= 1) {
            underSettlement = false;
            return;
        }
        if(currentRound <= 2 && !underSettlement) {
           underSettlement = true;
       }
        require(underSettlement, "Not being settled");
        uint256 lockedRound = currentRound - 1;
        StructureData.OptionState storage optionState = optionStates[lockedRound];
        optionVault.setCommittedState(optionState, depositAsset, counterPartyAsset); 
        optionState.strikePrice = _optionParameters.strikePrice;
        optionState.premiumRate = _optionParameters.premiumRate;
        optionState.pricePrecision = _optionParameters.pricePrecision;
        //mint for the current option
        _mint(address(this), optionState.totalAmount);
        uint256 userCount = usersInvolved.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if(userState.lockedAsset != 0) {  
                //transfer each user a share of the option to trigger transfer event
                //can be used to calculate the user option selling operations
                //utilizing some web3 indexed services, take etherscan api/graphql etc.
                _transfer(address(this), userAddress, userState.lockedAsset);
            } 
            if (userState.assetToTerminateForNextRound != 0){
                userState.assetToTerminate = userState.assetToTerminateForNextRound;
                userState.assetToTerminateForNextRound = 0;
            } 
            else {
                userState.assetToTerminate = 0;
            }
            userState.SetOngoingAsset(userState.lockedAsset); 
            userState.lockedAsset = 0;
         }

      
        optionHeights[lockedRound] = block.number; //commit current option at current block
        emit CommitOption(lockedRound);
        underSettlement = false;
   }
       


   
     function _calculateMaturity(bool _execute, StructureData.OptionState memory _optionState) private view
     returns(StructureData.MaturedState memory) {
       StructureData.MaturedState memory state = StructureData.MaturedState({
          releasedDepositAssetAmount: 0,
          releasedDepositAssetPremiumAmount: 0,
          autoRollDepositAssetAmount: 0,
          autoRollDepositAssetPremiumAmount: 0,
          releasedCounterPartyAssetAmount: 0, 
          releasedCounterPartyAssetPremiumAmount: 0,
          autoRollCounterPartyAssetAmount: 0,
          autoRollCounterPartyAssetPremiumAmount: 0,
          round: _optionState.round
       });  
        if (_execute) {  
           uint256 maturedCounterPartyAssetAmount = _optionState.totalAmount.mul(10**(_optionState.pricePrecision + counterPartyAssetAmountDecimals)).
           div(_optionState.strikePrice).div(10** depositAssetAmountDecimals); 
           uint256 maturedCounterPartyAssetPremiumAmount = maturedCounterPartyAssetAmount.mul(_optionState.premiumRate).div(RATIOMULTIPLIER);
           if (_optionState.totalTerminate > 0) { 
               state.releasedCounterPartyAssetAmount = Utils.getAmountToTerminate(maturedCounterPartyAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedCounterPartyAssetPremiumAmount = Utils.getAmountToTerminate(maturedCounterPartyAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
           }
           state.autoRollCounterPartyAssetAmount = maturedCounterPartyAssetAmount.sub(state.releasedCounterPartyAssetAmount);
           state.autoRollCounterPartyAssetPremiumAmount = maturedCounterPartyAssetPremiumAmount.sub(state.releasedCounterPartyAssetPremiumAmount);
        }
        else {
           uint256 maturedDepositAssetAmount = _optionState.totalAmount;
           uint256 maturedDepositAssetPremiumAmount = maturedDepositAssetAmount.mul(_optionState.premiumRate).div(RATIOMULTIPLIER);
           if (_optionState.totalTerminate > 0) { 
               state.releasedDepositAssetAmount = Utils.getAmountToTerminate(maturedDepositAssetAmount, _optionState.totalTerminate, _optionState.totalAmount);
               state.releasedDepositAssetPremiumAmount = Utils.getAmountToTerminate(maturedDepositAssetPremiumAmount, _optionState.totalTerminate, _optionState.totalAmount);
           }
           state.autoRollDepositAssetAmount = maturedDepositAssetAmount.sub(state.releasedDepositAssetAmount);
           state.autoRollDepositAssetPremiumAmount = maturedDepositAssetPremiumAmount.sub(state.releasedDepositAssetPremiumAmount);

        }
         return state;
     }


   address[] private autoRolledUsers;
   uint256[] private autoRolledAmounts;

   function autoRoll(bool _counterParty, uint256 _totalAmount, StructureData.MaturedState memory _maturedState) private {
        uint256 userCount = usersInvolved.length; 
        if (!_counterParty) {
            uint256 lockedRound = currentRound - 1;
            uint256 totalMatured = _maturedState.releasedDepositAssetAmount.add(_maturedState.releasedDepositAssetPremiumAmount);
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                uint256 maturedAmount = totalMatured.div(userState.GetOngoingAsset(0)).mul(_totalAmount);
                if (maturedAmount == 0) {
                    userState.assetToTerminate = 0;
                    continue;
                }
                uint256 amountToTerminate = Utils.getAmountToTerminate(maturedAmount, userState.assetToTerminate, userState.GetOngoingAsset(0));
                if (amountToTerminate > 0) {
                    releasedDepositAssetAmount[userAddress] = 
                    releasedDepositAssetAmount[userAddress].add(amountToTerminate); 
                }
                uint256 remainingAmount = maturedAmount.sub(amountToTerminate);
                if (remainingAmount > 0) { 
                    _depositFor(userAddress, remainingAmount, lockedRound);
                } 
                userState.assetToTerminate = 0;
            }  
            return;
        }
         
        uint256 totalMatured2 = _maturedState.releasedCounterPartyAssetAmount.add(_maturedState.releasedCounterPartyAssetPremiumAmount);
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress];  
            uint256 maturedAmount = totalMatured2.div(userState.GetOngoingAsset(0)).mul(_totalAmount);
            if (maturedAmount == 0) {
                userState.assetToTerminate = 0;
                continue;
            }
            uint256 amountToTerminate = Utils.getAmountToTerminate(maturedAmount, userState.assetToTerminate, userState.GetOngoingAsset(0));
            if (amountToTerminate > 0) {
                releasedCounterPartyAssetAmount[userAddress] = 
                releasedCounterPartyAssetAmount[userAddress].add(amountToTerminate);
            }
            uint256 remainingAmount = maturedAmount.sub(amountToTerminate); 
            if (remainingAmount > 0){   
                autoRolledAmounts.push(remainingAmount);
                autoRolledUsers.push(userAddress);
            } 
            userState.assetToTerminate = 0;
        } 
        
        uint256 count = autoRolledAmounts.length;
        if (count == 0) {
            return;
        }
        
        address[] memory localAutoRolledUsers = new address[](count);
        uint256[] memory localAutoRolledAmounts = new uint256[](count);
        for(uint i = 0; i < count; i++) {
            localAutoRolledUsers[i] = autoRolledUsers[i];
            localAutoRolledAmounts[i] = autoRolledAmounts[i];
        }
        delete autoRolledUsers;
        delete autoRolledAmounts;
        counterPartyOption.depositFromCounterParty(localAutoRolledUsers, localAutoRolledAmounts); 
   }

}