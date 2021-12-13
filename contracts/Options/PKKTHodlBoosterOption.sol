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
    event Redeem(address indexed account, uint256 indexed round,uint256 amount);
    event CloseOption(uint256 indexed round);
    event CommitOption(uint256 indexed round);
    event OpenOption(uint256 indexed round);
 
    uint256 public constant RATIOMULTIPLIER = 10000;
    uint8 internal depositAssetAmountDecimals;
    uint8 internal counterPartyAssetAmountDecimals;
      
    address public depositAsset;
    address public counterPartyAsset;
 
    bool public isEth;
    StructureData.OptionParameters public optionParameters;  
     uint256 public currentRound;
     uint256 public previousUnderlyingPrice;
     mapping(uint256=>uint256) public optionHeights;
     mapping(uint256=>StructureData.OptionState) public optionStates;
     address[] public usersInvolved;  
     mapping(address=>StructureData.UserState) public userStates; 
     bool public underSettlement; 
     bool public callOrPut; //put accept stablecoin only, call accept asset coins only
     IPKKTStructureOption public counterPartyOption;
     address public counterParty;
     IOptionVault public optionVault;
     //todo: differentiate bettewn previously matured ones and current round matured ones
     mapping(address=>uint256) public maturedDepositAssetAmount;
     mapping(address=>uint256) public maturedCounterPartyAssetAmount;

     mapping(address=>uint256) public pendingMaturedDepositAssetAmount;
     mapping(address=>uint256) public pendingMaturedCounterPartyAssetAmount;


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

    function withraw(uint256 _amount) external override { 
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
      
        uint256 userMaturedAmount = maturedDepositAssetAmount[msg.sender];
        require(userMaturedAmount >= _amount, "Exceed available"); 
        maturedDepositAssetAmount[msg.sender] = userMaturedAmount.sub(_amount); 
        optionVault.withdraw(msg.sender, _amount, depositAsset);  
    }

    function redeposit(uint256 _amount) external override {
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 maturedAmount = maturedDepositAssetAmount[msg.sender];
       require(maturedAmount >= _amount, "Exceed available");
       maturedDepositAssetAmount[msg.sender] = maturedAmount.sub(_amount);
       _depositFor(msg.sender, _amount);
    }
    //todo: what if quata is not enough
    function depositFromCounterParty(address[] memory addresses, uint256[] memory _amounts) override external {
        require(msg.sender == counterParty, "Only counter party option can call this method");
        for(uint256 i = 0; i < 0 ; i++){
            _depositFor(addresses[i], _amounts[i]);
        }
    }
    //deposit eth
    function depositETH() external payable override {
       require(!underSettlement, "Being settled");
       require(currentRound > 0, "!Started");
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
       
        //todo: convert to weth  
       _depositFor(msg.sender, msg.value);
       payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount) external override {  
        require(!underSettlement, "Being settled");
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(msg.sender, _amount);  
        IERC20(depositAsset).safeTransferFrom(msg.sender, vaultAddress(), _amount);
    }
 
  
    function _depositFor(address _userAddress, uint256 _amount) private { 
        StructureData.OptionState storage optionState = optionStates[currentRound];
        require(optionState.totalAmount.add(_amount) <= optionParameters.quota, "Not enough quota");
        StructureData.UserState storage userState =  userStates[_userAddress]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved.push(_userAddress);
        } 
        userState.pendingAsset = userState.pendingAsset.add(_amount); 
        optionState.totalAmount = optionState.totalAmount.add(_amount);
        
        emit Deposit(_userAddress, currentRound, _amount);
    }


    //redeem unsettled amount
    function redeem(uint256 _amount) external override { 
        require(!underSettlement, "Being settled");
         require(_amount > 0, "!amount"); 
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         require(userState.pendingAsset >= _amount, "Exceeds available");
         userState.pendingAsset = userState.pendingAsset.sub(_amount); 
         StructureData.OptionState storage optionState = optionStates[currentRound];
         optionState.totalAmount = optionState.totalAmount.sub(_amount);
        optionVault.withdraw(msg.sender, _amount, depositAsset); 
         emit Redeem(msg.sender, currentRound, _amount);
    }

 
    function getPendingAsset() external view override returns (uint256) {
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         return userState.pendingAsset;
    }

    function getOngoingAsset(uint8 _backwardRound) external view override returns (uint256) { 
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         return userState.GetOngoingAsset(_backwardRound);
    }
  
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    function getRoundData(uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
        return optionStates[optionHeights[_blockHeight]];
    } 

   function closePrevious(uint256 _underlyingPrice) external override onlyOwner { 
        require(!underSettlement, "Being settled");
        underSettlement = true;
        previousUnderlyingPrice = _underlyingPrice; 
        if (currentRound == 0) {
            return;
        }
        
        if (currentRound <= StructureData.MATUREROUND) { 
            return;
        }
        uint maturedRound = currentRound - StructureData.MATUREROUND;
        StructureData.OptionState storage previousOptionState = optionStates[maturedRound];   
        StructureData.MaturedState memory maturedState = _calculateMaturity(_underlyingPrice, previousOptionState);  
        optionVault.setMaturityState(maturedState, depositAsset, counterPartyAsset);
        previousOptionState.executed = maturedState.executed;
        emit CloseOption(maturedRound);
   }
   function _calculateMaturity(uint256 _underlyingPrice, StructureData.OptionState memory _optionState) 
   internal virtual returns(StructureData.MaturedState memory _state); 

   function autoRoll(bool _counterParty) private {
        uint256 userCount = usersInvolved.length;
        if (!_counterParty) {
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[i];
                StructureData.UserState storage userState = userStates[userAddress]; 
                
                uint256 maturedAmount = pendingMaturedDepositAssetAmount[userAddress];
                if (maturedAmount == 0) {
                    continue;
                }
                if(userState.shouldStop) {  
                    maturedDepositAssetAmount[userAddress] = 
                    maturedDepositAssetAmount[userAddress].add(maturedAmount);
                }  
                else { 
                    _depositFor(userAddress, maturedAmount);
                }
                pendingMaturedDepositAssetAmount[userAddress] = 0;
            }  
            return;
        }
        
        uint256 maturedCount = 0;
       
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress];  
            if(userState.shouldStop || pendingMaturedCounterPartyAssetAmount[userAddress] == 0) {  
                continue;
            }  
            maturedCount++;
        } 
        if (maturedCount == 0) {
            return;
        }
        address[] memory autoRolledUsers = new address[](maturedCount);
        uint256[] memory autoRolledAmounts = new uint256[](maturedCount);
         maturedCount = 0;
         for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            
            uint256 maturedAmount = pendingMaturedCounterPartyAssetAmount[userAddress];
            if (maturedAmount == 0) {
                continue;
            }
            if(userState.shouldStop) {  
                maturedCounterPartyAssetAmount[userAddress] = 
                maturedCounterPartyAssetAmount[userAddress].add(maturedAmount);
            }  
            else { 
                autoRolledUsers[maturedCount] = userAddress;
                autoRolledAmounts[maturedCount] = maturedAmount; 
                maturedCount++;
            }
            pendingMaturedCounterPartyAssetAmount[userAddress] = 0;
        } 
        counterPartyOption.depositFromCounterParty(autoRolledUsers, autoRolledAmounts);        
   }

   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent() external override onlyOwner {  
        require(underSettlement, "Not being settled");
        //return when there is no previous round
        //console.log("CommitCurrent: %s %d", name(), currentRound);
        if (currentRound <= 0) return;
        if (currentRound > StructureData.MATUREROUND) {  
            StructureData.OptionState storage previousOptionState = optionStates[currentRound - StructureData.MATUREROUND];
            if (previousOptionState.totalAmount > 0) { 
                autoRoll(previousOptionState.executed);
            }   
        } 
        StructureData.OptionState storage optionState = optionStates[currentRound];
        optionVault.setCommittedState(optionState, depositAsset, counterPartyAsset);
        optionState.underlyingPrice = previousUnderlyingPrice; 
        optionState.strikePrice =  optionState.underlyingPrice.mul(uint256(int256(RATIOMULTIPLIER) + int256(optionParameters.strikePriceRatio))).div(RATIOMULTIPLIER);  
        optionState.interestRate = optionParameters.interestRate;
        optionState.pricePrecision = optionParameters.pricePrecision;
        //mint for the current option
        _mint(address(this), optionState.totalAmount);
        uint256 userCount = usersInvolved.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            if(userState.pendingAsset != 0) {  
                //transfer each user a share of the option to trigger transfer event
                _transfer(address(this), userAddress, userState.pendingAsset);
            } 
            userState.SetOngoingAsset(userState.pendingAsset); 
            userState.pendingAsset = 0;
         }

      
        optionHeights[currentRound] = block.number; //commit current option at current block
        emit CommitOption(currentRound);
   }
      
   
   function rollToNext(StructureData.OptionParameters memory _optionParameters) external override onlyOwner { 
        currentRound = currentRound + 1;
        optionParameters = _optionParameters;  
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: currentRound,
                            totalAmount: 0,
                            interestRate:  _optionParameters.interestRate,
                            pricePrecision: _optionParameters.pricePrecision,
                            strikePrice: 0,
                            underlyingPrice: 0,
                            executed: false,
                            callOrPut: callOrPut
                        });
        optionStates[currentRound] = currentOption;
        underSettlement = false;
        emit OpenOption(currentRound);
    }

}