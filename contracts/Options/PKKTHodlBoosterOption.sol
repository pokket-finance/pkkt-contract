// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; 
import "hardhat/console.sol";
 
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
     uint256 public totalMaturedDepositAssetAmount; 
     uint256 public totalMaturedCounterPartyAssetAmount;
     uint256 public leftOverDepositAssetAmount;
     uint256 public leftOverCounterPartyAssetAmount;
     
     //private data for complete withdrawal and redeposit 
     mapping(address=>uint256) private maturedDepositAssetAmount;
     mapping(address=>uint256) private maturedCounterPartyAssetAmount;  
     mapping(address=>uint256) internal pendingMaturedDepositAssetAmount;
     mapping(address=>uint256) internal pendingMaturedCounterPartyAssetAmount;


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
           maturedDepositAssetAmount: maturedDepositAssetAmount[msg.sender],
           maturedCounterPartyAssetAmount: maturedCounterPartyAssetAmount[msg.sender],
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
            totalMaturedDeposit :  totalMaturedDepositAssetAmount,
            totalMaturedCounterParty : totalMaturedCounterPartyAssetAmount,
            totalOngoing : onGoingOption.totalAmount,
            totalLocked: lockedOption.totalAmount 
       }); 
       return result;
    }

    function completeWithdraw(uint256 _amount, address _asset) external override { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");  
       require(_asset == depositAsset || _asset == counterPartyAsset, "Invalid asset address");
       if (_asset == depositAsset) {
           uint256 maturedAmount = maturedDepositAssetAmount[msg.sender];
           require(maturedAmount >= _amount, "Exceed available");
           maturedDepositAssetAmount[msg.sender] = maturedAmount.sub(_amount); 
           totalMaturedDepositAssetAmount = totalMaturedDepositAssetAmount.sub(_amount);
       }
       else {
           
           uint256 maturedAmount = maturedCounterPartyAssetAmount[msg.sender];
           require(maturedAmount >= _amount, "Exceed available");
           maturedCounterPartyAssetAmount[msg.sender] = maturedAmount.sub(_amount);
           totalMaturedCounterPartyAssetAmount = totalMaturedCounterPartyAssetAmount.sub(_amount);
       }
       
        optionVault.withdraw(msg.sender, _amount, _asset);
    }
    function initiateWithraw(uint256 _assetToTerminate) external override {
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        StructureData.UserState storage userState =  userStates[msg.sender];
        //undersettlement
        if (userState.lockedAsset > 0) { 
            uint256 newAssetToTerminate = userState.assetToTerminateForNextRound.add(_assetToTerminate);
            uint256 locked = userState.lockedAsset;
            require(newAssetToTerminate <= locked, "Exceeds available");
            userState.assetToTerminateForNextRound = newAssetToTerminate;
        }
        else {
            uint256 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate);
            uint256 ongoing = userState.GetOngoingAsset(0);
            require(newAssetToTerminate <= ongoing, "Exceeds available");
            userState.assetToTerminate = newAssetToTerminate;
        }

    }

    function cancelWithdraw(uint256 _assetToTerminate) external override { 
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        StructureData.UserState storage userState =  userStates[msg.sender];
         //undersettlement
        if (userState.lockedAsset > 0) { 
            require(_assetToTerminate <= userState.assetToTerminateForNextRound, "Exceed available");
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.sub(_assetToTerminate);
        }
        else { 
            require(_assetToTerminate <= userState.assetToTerminate, "Exceed available");
            userState.assetToTerminate = userState.assetToTerminate.sub(_assetToTerminate);
        }

    } 
    
    
    function maxInitiateWithdraw() external override {  
        StructureData.UserState storage userState =  userStates[msg.sender];
        //undersettlement
        if (userState.lockedAsset > 0) {  
            userState.assetToTerminateForNextRound = userState.lockedAsset;
        }
        else {  
            userState.assetToTerminate = userState.GetOngoingAsset(0);
        }
 
    }

    function maxCancelWithdraw() external override {   
        StructureData.UserState storage userState =  userStates[msg.sender]; 
         //undersettlement
        if (userState.lockedAsset > 0) {  
            userState.assetToTerminateForNextRound = 0;
        }
        else {  
            userState.assetToTerminate = 0;
        } 
    }
    
    function withdraw(uint256 _amount, address _asset) external override { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");  
       require(_asset == depositAsset || _asset == counterPartyAsset, "Invalid asset address");
       if (_asset == depositAsset) {
           uint256 maturedAmount = maturedDepositAssetAmount[msg.sender];
           if (maturedAmount <= _amount) { 
               StructureData.UserState storage userState =  userStates[msg.sender];  
               require(userState.pendingAsset >= _amount.sub(maturedAmount), "Exceeds available"); 
               maturedDepositAssetAmount[msg.sender] = 0; 
               totalMaturedDepositAssetAmount = totalMaturedDepositAssetAmount.sub(maturedAmount);
               userState.pendingAsset = userState.pendingAsset.sub(_amount.sub(maturedAmount));
               StructureData.OptionState storage optionState = optionStates[currentRound];
               optionState.totalAmount = optionState.totalAmount.sub(_amount.sub(maturedAmount));  
           }
           else{ 
               maturedDepositAssetAmount[msg.sender] = maturedAmount.sub(_amount); 
               totalMaturedDepositAssetAmount = totalMaturedDepositAssetAmount.sub(_amount);
           }
       }
       else {

           //same result as completeWithdraw
           uint256 maturedAmount = maturedCounterPartyAssetAmount[msg.sender];
           require(maturedAmount >= _amount, "Exceed available");
           maturedCounterPartyAssetAmount[msg.sender] = maturedAmount.sub(_amount);
           totalMaturedCounterPartyAssetAmount = totalMaturedCounterPartyAssetAmount.sub(_amount);
       }
        optionVault.withdraw(msg.sender, _amount, _asset);
        emit Withdraw(msg.sender, _asset, _amount);
    }
 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    function redeposit(uint256 _amount) external override { 
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 maturedAmount = maturedDepositAssetAmount[msg.sender];
       require(maturedAmount >= _amount, "Exceed available");
       maturedDepositAssetAmount[msg.sender] = maturedAmount.sub(_amount);
       totalMaturedDepositAssetAmount = totalMaturedDepositAssetAmount.sub(_amount);
       _depositFor(msg.sender, _amount, currentRound);
    }

    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    function redepositToCounterParty(uint256 _amount) external override { 
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 maturedAmount = maturedCounterPartyAssetAmount[msg.sender];
       require(maturedAmount >= _amount, "Exceed available");
       maturedCounterPartyAssetAmount[msg.sender] = maturedAmount.sub(_amount);
       address[] memory addresses = new address[](1);
       uint256[] memory amounts = new uint256[](1);
       addresses[0] = msg.sender;
       amounts[0] = _amount;
       counterPartyOption.depositFromCounterParty(addresses, amounts);
    }


    //todo: what if quata is not enough
    function depositFromCounterParty(address[] memory addresses, uint256[] memory _amounts) override external {
        require(msg.sender == counterParty, "Only counterparty option can call this method");
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
        StructureData.OptionState storage optionState = optionStates[currentRound];
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
       //StructureData.OptionState storage onGoingOption = optionStates[currentRound - 2];

        StructureData.SettlementResult memory result = StructureData.SettlementResult({
            option: address(this),
            round: currentRound - 1,
            depositAmount: lockedOption.totalAmount,
            leftOverAmount: leftOverDepositAssetAmount,
            leftOverCounterPartyAmount: leftOverCounterPartyAssetAmount,
            executed: _execute,
            autoRollAmount: 0,
            autoRollPremium: 0,
            maturedAmount: 0,
            maturedPremium: 0,
            autoRollCounterPartyAmount: 0,
            autoRollCounterPartyPremium: 0,
            maturedCounterPartyAmount: 0,
            maturedCounterPartyPremium: 0
        });

        return result;
   }

   function closePrevious(bool _execute) external override onlyOwner {  
        require(!underSettlement, "Being settled");
        underSettlement = true; 
        if (currentRound <= StructureData.MATUREROUND + 1) { 
            return;
        }
        uint maturedRound = currentRound - StructureData.MATUREROUND - 1;
        StructureData.OptionState storage previousOptionState = optionStates[maturedRound];   
        StructureData.MaturedState memory maturedState = _calculateMaturity(_execute, previousOptionState);  
        optionVault.setMaturityState(maturedState, depositAsset, counterPartyAsset);
        previousOptionState.executed = maturedState.executed;
        if (previousOptionState.totalAmount > 0) { 
            autoRoll(maturedState.executed);
        }   
        emit CloseOption(maturedRound);
   }

   function _calculateMaturity(bool _execute, StructureData.OptionState memory _optionState) 
   internal virtual returns(StructureData.MaturedState memory _state); 

   function getAmountToTerminate(uint256 _maturedAmount, uint256 _assetToTerminate, uint256 _assetAmount) private pure returns(uint256) {
       if (_assetToTerminate == 0) return 0;
       return _assetToTerminate >= _assetAmount ?  _maturedAmount : _maturedAmount.mul(_assetToTerminate).div(_assetAmount);
   }

   address[] private autoRolledUsers;
   uint256[] private autoRolledAmounts;

   function autoRoll(bool _counterParty) private {
        uint256 userCount = usersInvolved.length;
        uint256 maturedDepositAssetAmounts = 0;
        uint256 maturedCounterPartyAssetAmounts = 0;
        if (!_counterParty) {
            uint256 lockedRound = currentRound - 1;
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                uint256 maturedAmount = pendingMaturedDepositAssetAmount[userAddress];
                if (maturedAmount == 0) {
                    userState.assetToTerminate = 0;
                    continue;
                }
                uint256 amountToTerminate = getAmountToTerminate(maturedAmount, userState.assetToTerminate, userState.GetOngoingAsset(0));
                if (amountToTerminate > 0) {
                    maturedDepositAssetAmount[userAddress] = 
                    maturedDepositAssetAmount[userAddress].add(amountToTerminate);
                    maturedDepositAssetAmounts = maturedDepositAssetAmounts.add(amountToTerminate);
                }
                uint256 remainingAmount = maturedAmount.sub(amountToTerminate);
                if (remainingAmount > 0) { 
                    _depositFor(userAddress, maturedAmount, lockedRound);
                }
                pendingMaturedDepositAssetAmount[userAddress] = 0;
                userState.assetToTerminate = 0;
            }  
            totalMaturedDepositAssetAmount = totalMaturedDepositAssetAmount.add(maturedDepositAssetAmounts);
            return;
        }
         
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress];  
            uint256 maturedAmount = pendingMaturedCounterPartyAssetAmount[userAddress]; 
            if (maturedAmount == 0) {
                userState.assetToTerminate = 0;
                continue;
            }
            uint256 amountToTerminate = getAmountToTerminate(maturedAmount, userState.assetToTerminate, userState.GetOngoingAsset(0));
            if (amountToTerminate > 0) {
                maturedCounterPartyAssetAmount[userAddress] = 
                maturedCounterPartyAssetAmount[userAddress].add(amountToTerminate);
                maturedCounterPartyAssetAmounts = maturedCounterPartyAssetAmounts.add(amountToTerminate);
            }
            uint256 remainingAmount = maturedAmount.sub(amountToTerminate); 
            if (remainingAmount > 0){   
                autoRolledAmounts.push(remainingAmount);
                autoRolledUsers.push(userAddress);
            }
            pendingMaturedCounterPartyAssetAmount[userAddress] = 0;
            userState.assetToTerminate = 0;
        } 
        
        totalMaturedCounterPartyAssetAmount = totalMaturedCounterPartyAssetAmount.add(maturedCounterPartyAssetAmounts);
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

   //close pending option and autoroll if capacity is enough based on the maturity result
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
       
   //first, new round
   function rollToNext(uint256 _quota) external override onlyOwner {   
        uint256 userCount = usersInvolved.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if(userState.pendingAsset != 0) {  
                userState.lockedAsset = userState.pendingAsset;
            }  
            userState.pendingAsset = 0;
         }

        quota = _quota;
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: currentRound,
                            totalAmount: 0,
                            premiumRate:  0,
                            pricePrecision: 0,
                            strikePrice: 0,
                            executed: false,
                            callOrPut: callOrPut
                        });
        currentRound = currentRound + 1;
        optionStates[currentRound] = currentOption; 
        emit OpenOption(currentRound); 
    }

}