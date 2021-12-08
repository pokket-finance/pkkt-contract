// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol"; 
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/IPKKTStructureOption.sol";
import "./interfaces/IExecuteSettlement.sol"; 
import "./interfaces/IOptionVault.sol"; 
abstract contract PKKTStructureOption is ERC20Upgradeable, OwnableUpgradeable, IPKKTStructureOption, IExecuteSettlement {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using StructureData for StructureData.UserState;

    event Deposit(address indexed account, uint256 indexed round,uint256 amount);
    event Redeem(address indexed account, uint256 indexed round,uint256 amount);
    event CloseOption(uint256 indexed round);
    event CommitOption(uint256 indexed round);
    event OpenOption(uint256 indexed round);
 
    uint256 public constant RATIOMULTIPLIER = 10000;
    uint8 internal assetAmountDecimals;
    uint8 internal stableCoinAmountDecimals;
      
    address public asset;
    address public stableCoin;
 
    bool public isEth;
    StructureData.OptionParameters public optionParameters;  
    uint256 public currentRound;
    uint256 public previousUnderlyingPrice;
    mapping(uint256=>uint256) public optionHeights;
    mapping(uint256=>StructureData.OptionState) public optionStates;
    address[] public usersInvolved;  
    mapping(address=>StructureData.UserState) public userStates; 
    mapping(address=>uint256) public maturedAsset; 
    mapping(address=>uint256) public maturedStableCoin;
    bool public underSettlement;
    address override public vaultAddress;

    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    function initalize(
        string memory name,
        string memory symbol,
        address _asset,
        address _stableCoin,
        uint8 _assetAmountDecimals,
        uint8 _stableCoinAmountDecimals,
        address _vaultAddress
    ) public initializer {
        require(_vaultAddress != address(0), "Empty vault address");
        ERC20Upgradeable.__ERC20_init(name, symbol);
        OwnableUpgradeable.__Ownable_init();
        asset = _asset;
        stableCoin = _stableCoin;
        isEth = _asset == address(0);
        assetAmountDecimals = _assetAmountDecimals;
        stableCoinAmountDecimals = _stableCoinAmountDecimals;
        vaultAddress = _vaultAddress;
    }

    // constructor(
    //     string memory name,
    //     string memory symbol,
    //     address _asset,
    //     address _stableCoin,
    //     uint8 _assetAmountDecimals,  
    //     uint8 _stableCoinAmountDecimals,
    //     address _vaultAddress
    // ) ERC20(name, symbol) {  
    //     require(_vaultAddress != address(0), "Empty vault address");
    //     asset = _asset;
    //     stableCoin = _stableCoin;
    //     isEth = _asset == address(0);
    //     assetAmountDecimals = _assetAmountDecimals;
    //     stableCoinAmountDecimals = _stableCoinAmountDecimals; 
    //     vaultAddress = _vaultAddress;
    // }
          
    function decimals() public view override returns (uint8) {
        return assetAmountDecimals;
    }

    function withraw(uint256 _amount, bool _stableCoin) external override {
       require(_stableCoin || requestingAssetAmount == 0, "Matured Asset not filled");
       require(!_stableCoin || requestingStableCoinAmount == 0, "Matured Stable Coin not filled");
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       if (_stableCoin) {
            uint256 stableCoinAmount = maturedStableCoin[msg.sender];
            require(stableCoinAmount >= _amount, "Exceed available"); 
            maturedStableCoin[msg.sender] = stableCoinAmount.sub(_amount);
            IERC20(stableCoin).safeTransfer(msg.sender, _amount); 
       }
       else { 
            uint256 assetAmount = maturedAsset[msg.sender];
            require(assetAmount >= _amount, "Exceed available"); 
            maturedAsset[msg.sender] = assetAmount.sub(_amount);
            if (isEth) {
                payable(msg.sender).transfer(_amount);
            }
            else { 
                IERC20(asset).safeTransfer(msg.sender, _amount); 
            } 
       }
    }

    function redeposit(uint256 _amount) external override {
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount"); 
       uint256 maturedAmount = maturedAsset[msg.sender];
       require(maturedAmount >= _amount, "Exceed available");
       maturedAsset[msg.sender] = maturedAmount.sub(_amount);
       _depositFor(_amount);
    }

    //deposit eth
    function depositETH() external payable override {
       require(!underSettlement, "Being settled");
       require(currentRound > 0, "!Started");
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
       
        //todo: convert to weth and  transfer to a centralized place
       _depositFor(msg.value);
    }
    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount) external override {  
        require(!underSettlement, "Being settled");
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(_amount); 
        //todo: transfer to a centralized place
        IERC20(asset).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
  
    function _depositFor(uint256 _amount) private { 
        StructureData.OptionState storage optionState = optionStates[currentRound];
        require(optionState.totalAmount.add(_amount) <= optionParameters.quota, "Not enough quota");
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved.push(msg.sender);
        }
        userState.pendingAsset = userState.pendingAsset.add(_amount); 
        optionState.totalAmount = optionState.totalAmount.add(_amount);
        
        emit Deposit(msg.sender, currentRound, _amount);
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
         //todo: withdraw from centralized vault
        if (isEth) {
            payable(msg.sender).transfer(_amount);
        }
        else { 
            IERC20(asset).safeTransfer(msg.sender, _amount); 
        }
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
        require(requestingAssetAmount == 0, "Matured Asset not filled");
        require(requestingStableCoinAmount == 0, "Matured Stable Coin not filled");
        require(!underSettlement, "Being settled");
        underSettlement = true;
        previousUnderlyingPrice = _underlyingPrice;
        //return when there is no previous matured round
        if (currentRound < StructureData.MATUREROUND) return;
        uint maturedRound = currentRound - StructureData.MATUREROUND + 1;
        StructureData.OptionState storage previousOptionState = optionStates[maturedRound];
        (uint256 maturedAssetAmount_, uint256 maturedStableCoinAmount_, bool executed_) = 
        _calculateMaturity(_underlyingPrice, previousOptionState);  
        previousOptionState.executed = executed_;
        maturedAssetAmount = requestingAssetAmount = maturedAssetAmount_;
        maturedStableCoinAmount = requestingStableCoinAmount = maturedStableCoinAmount_; 
        emit CloseOption(maturedRound);
   }
 
   uint256 private requestingAssetAmount;
   uint256 private requestingStableCoinAmount;
   uint256 private maturedAssetAmount;
   uint256 private maturedStableCoinAmount;
   function _calculateMaturity(uint256 _underlyingPrice, StructureData.OptionState memory _optionState) 
   internal virtual returns(uint256 _maturedAssetAmount, uint256 _maturedStableCoinAmount, bool _executed); 
 
   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent(address _traderAddress) external override onlyOwner {  
        require(underSettlement, "Not being settled");
        //return when there is no previous round
        //console.log("CommitCurrent: %s %d", name(), currentRound);
        if (currentRound <= 0) return;
        StructureData.OptionState storage optionState = optionStates[currentRound];
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

        //send trader the coins
        if (requestingAssetAmount <= optionState.totalAmount) {
            uint256 toSend = optionState.totalAmount.sub(requestingAssetAmount);
            if (toSend > 0) { 
               //if balance is not correct, would result in error
                if (isEth) {
                    payable(_traderAddress).transfer(toSend);
                }
                else { 
                    IERC20(asset).safeTransfer(_traderAddress, toSend); 
                } 
            }
            requestingAssetAmount = 0;
        } 
        else { 
           requestingAssetAmount = requestingAssetAmount.sub(optionState.totalAmount); 
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
                            callOrPut: _optionParameters.callOrPut
                        });
        optionStates[currentRound] = currentOption;
        underSettlement = false;
        emit OpenOption(currentRound);
    }
 
    function getRequest() external override view onlyOwner returns(StructureData.Request[] memory){
        if (requestingAssetAmount == 0 && requestingStableCoinAmount == 0) {
            return new StructureData.Request[](0);
        }
        if (requestingAssetAmount == 0) {
            StructureData.Request[] memory results = new StructureData.Request[](1);
            results[0] = StructureData.Request({amount:requestingStableCoinAmount, contractAddress: stableCoin});
            return results;
        } 
        if (requestingStableCoinAmount == 0) {
            StructureData.Request[] memory results = new StructureData.Request[](1);
            results[0] = StructureData.Request({amount:requestingAssetAmount, contractAddress: asset});
            return results;
        }
        else {
           
           StructureData.Request[] memory results = new StructureData.Request[](2);
            results[0] = StructureData.Request({amount:requestingAssetAmount, contractAddress: asset});
            results[1] = StructureData.Request({amount:requestingStableCoinAmount, contractAddress: stableCoin});
            return results;
        }
    }

    function getBalance(bool _asset) internal view returns(uint256) {
       if (_asset) {
          if (isEth) {
              return address(this).balance;
          }
          else{
             return IERC20(asset).balanceOf(address(this));
          }
       }
       else{
           return IERC20(stableCoin).balanceOf(address(this));
       }
    }
    function finishSettlement() external override onlyOwner {
        require(requestingAssetAmount == 0 || getBalance(true) >=  maturedAssetAmount, 
           "Matured Asset not filled");       
        require(requestingStableCoinAmount == 0 || getBalance(false) >=  maturedStableCoinAmount, 
           "Matured Stable Coin not filled"); 
        requestingAssetAmount = 0;
        requestingStableCoinAmount = 0;
    }
    event Received(address, uint);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    function allSettled() external override view returns(bool){
        return requestingAssetAmount == 0 && requestingStableCoinAmount == 0;
    }
}