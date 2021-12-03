// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/IPKKTStructureOption.sol";
import "./interfaces/IExecuteSettlement.sol"; 
abstract contract PKKTStructureOption is ERC20, Ownable, IPKKTStructureOption, IExecuteSettlement {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    event Deposit(address indexed account, uint256 indexed round,uint256 amount);
    event Redeem(address indexed account, uint256 indexed round,uint256 amount);
    event CloseOption(uint256 indexed round);
    event CommitOption(uint256 indexed round);
    event OpenOption(uint256 indexed round);

    uint256 public constant PERIOD = 7 days;
    uint256 public constant RATIOMULTIPLIER = 10000;
    uint8 internal assetAmountDecimals;
    uint8 internal stableCoinAmountDecimals;
      
    address public immutable asset;
    address public immutable stableCoin;
 
    bool public immutable isEth;
    StructureData.OptionParameters public optionParameters;  
     uint256 public currentRound;
     uint256 public previousUnderlyingPrice;
     mapping(uint256=>uint256) public optionHeights;
     mapping(uint256=>StructureData.OptionState) public optionStates;
     address[] public ongoingUserAddresses;
     address[] public pendingUserAddresses;
     mapping(address=>StructureData.UserState) public userStates; 
     mapping(address=>uint256) public maturedAsset; 
     mapping(address=>uint256) public maturedStableCoin;
     bool public underSettlement;
     

    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    constructor(
        string memory name,
        string memory symbol,
        address _asset,
        address _stableCoin,
        uint8 _assetAmountDecimals,  
        uint8 _stableCoinAmountDecimals
    ) ERC20(name, symbol) {  
        asset = _asset;
        stableCoin = _stableCoin;
        isEth = _asset == address(0);
        assetAmountDecimals = _assetAmountDecimals;
        stableCoinAmountDecimals = _stableCoinAmountDecimals; 
    }
          
     
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
       _depositFor(msg.value);
    }
    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount) external override {  
        require(!underSettlement, "Being settled");
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(_amount); 
        IERC20(asset).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
  
    function _depositFor(uint256 _amount) private { 
        StructureData.OptionState storage optionState = optionStates[currentRound];
        require(optionState.totalAmount.add(_amount) <= optionParameters.quota);
        StructureData.UserState storage userState =  userStates[msg.sender]; 
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

    function getOngoingAsset() external view override returns (uint256) { 
         StructureData.UserState storage userState =  userStates[msg.sender]; 
         return userState.ongoingAsset;
    }
 
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    function getRoundData(uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
        return optionStates[optionHeights[_blockHeight]];
    } 

   function closePrevious(uint256 _underlyingPrice) external override onlyOwner {
        underSettlement = true;
        previousUnderlyingPrice = _underlyingPrice;
        //return when there is no previous round
        if (currentRound <= 1) return;
        StructureData.OptionState storage previousOptionState = optionStates[currentRound - 1];
        (uint256 maturedAssetAmount_, uint256 maturedStableCoinAmount_, bool executed) = 
        _calculateMaturity(_underlyingPrice, previousOptionState);  
        previousOptionState.executed = executed;
        requestingAssetAmount = maturedAssetAmount_;
        requestingStableCoinAmount = maturedStableCoinAmount_;
        delete ongoingUserAddresses;
        emit CloseOption(currentRound - 1);
   }
    
   uint256 private requestingAssetAmount;
   uint256 private requestingStableCoinAmount;
   function _calculateMaturity(uint256 _underlyingPrice, StructureData.OptionState memory _optionState) 
   internal virtual returns(uint256 maturedAssetAmount, uint256 maturedStableCoinAmount, bool executed); 
 
   //close pending option and autoroll if capacity is enough based on the maturity result
   function commitCurrent(address _traderAddress) external override onlyOwner { 
        StructureData.OptionState storage optionState = optionStates[currentRound];
        optionState.underlyingPrice = previousUnderlyingPrice; 
        optionState.strikePrice =  optionState.underlyingPrice.mul(uint256(int256(RATIOMULTIPLIER) + int256(optionParameters.strikePriceRatio))).div(RATIOMULTIPLIER);  
        optionState.interestRate = optionParameters.interestRate;
        optionState.pricePrecision = optionParameters.pricePrecision;
        //mint for the current option
        _mint(address(this), optionState.totalAmount);
        uint256 userCount = pendingUserAddresses.length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = pendingUserAddresses[i];
            StructureData.UserState storage userState = userStates[userAddress]; 
            ongoingUserAddresses.push(userAddress); 
            //transfer each user a share of the option to trigger transfer event
            _transfer(address(this), userAddress, userState.pendingAsset);
            userState.ongoingAsset =  userState.pendingAsset;
            userState.pendingAsset = 0;
         }
        delete pendingUserAddresses; 

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
                            executed: false
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
       
        require(requestingAssetAmount == 0 || getBalance(true) >=  requestingAssetAmount, 
           "Matured Asset not filled");       
        require(requestingStableCoinAmount == 0 || getBalance(false) >=  requestingStableCoinAmount, 
           "Matured Stable Coin not filled"); 
        requestingAssetAmount = 0;
        requestingStableCoinAmount = 0;
    }

    function allSettled() external override view returns(bool){
        return requestingAssetAmount == 0 && requestingStableCoinAmount == 0;
    }
}