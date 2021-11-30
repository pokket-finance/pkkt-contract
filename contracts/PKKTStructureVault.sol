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
import "hardhat/console.sol";
import "./interfaces/IPKKTStructureVault.sol";
import "./interfaces/IExecuteSettlement.sol";
import "./interfaces/IMaturedVault.sol";

abstract contract PKKTStructureVault is ERC20, IPKKTStructureVault, IExecuteSettlement {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    uint256 public constant PERIOD = 7 days;
    uint8 private _decimals;
     
    uint256 public immutable normalizer;
    address public immutable underlying;
 
    address public immutable USDC; 
    address public immutable USDT; 
    address public immutable DAI;
    bool public immutable isEth;
    StructureData.VaultParameters public vaultParameters; 
    StructureData.VaultParameters public previousVaultParameters; 
     uint256 public currentRound;
     uint256 public previousAssetPrice;
     mapping(uint256=>uint256) public vaultHeights;
     mapping(uint256=>StructureData.VaultState) public vaultStates;
     address[] public previousUserAddresses;
     address[] public currentUserAddresses;
     mapping(address=>StructureData.UserState) public userStates;
     IMaturedVault private vault; 
     bool public underSettlement;
     uint256[] private maturedValues; //0 underlying, 1 usdc, 2 usdt, 3 dai

    constructor(
        string memory name,
        string memory symbol,
        uint256 decimals,
        address _usdc,
        address _usdt,
        address _dai,
        address _underlying
    ) ERC20(name, symbol) { 
        USDC = _usdc;
        USDT = _usdt;
        DAI = _dai;
        underlying = _underlying;
        isEth = _underlying == address(0);
        _decimals = decimals;
        normalizer = 10 ** _decimals;
    }
    
    //deposit eth
    function depositETH(StructureData.StableCoin _convertedCoin) external payable override {
       require(!underSettlement, "Being settled");
       require(currentRound > 0, "!Started");
       require(isEth, "!ETH");
       require(msg.value > 0, "!value"); 
       _depositFor(msg.value, _convertedCoin);
    }
    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount, StructureData.StableCoin _convertedCoin) external override { 
        
        require(!underSettlement, "Being settled");
        require(currentRound > 0, "!Started");
        require(!isEth, "!ERC20");
        require(_amount > 0, "!amount"); 
        _depositFor(_amount, _convertedCoin);
        IERC20(underlying).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
  
    function _depositFor(uint256 _amount, StructureData.StableCoin _convertedCoin) private { 
        StructrureData.VaultState storage vaultState = vaultStates[currentRound];
        require(vaultState.totalAmount.add(_amount) <= vaultParameters.quota);
        StructureData.UserState storage userState =  userStates[msg.sender]; 
        userState.pendingAsset = userState.pendingAsset.add(_amount);
        userState.currentConvertedCoin = _convertedCoin;
        vaultState.totalAmount = vaultState.totalAmount.add(_amount);
        //todo: trigger event
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
            IERC20(underlying).safeTransfer(msg.sender, _amount); 
        }
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
    //for each transaction, read the blockheight and the amount, and call this method to get the result
    //the blockheight is the the height when the round is committed, and the matured date can be calculated at client side using the roundSpan, usually 7 days 
    function getRoundData(uint256 _blockHeight, uint256 _vaultShareAmount) external view override 
        returns(uint256 round, uint256 roundSpan, uint256 maturedAmount, uint256 strikePrice, bool converted) {
        uint256 vaultRound = vaultHeights[_blockHeight];
        if (vaultRound == 0) {
            return (0, 0, 0, 0, false);
        }
        StructrureData.VaultState memory vaultState = vaultStates[vaultRound];
        return (vaultRound, PERIOD, _vaultShareAmount.mul(maturedAmount).div(normalizer), vaultState.strikePrice, vaultState.converted);

    }
    function setMaturedVault(IMaturedVault _vault) external override {
        vault = _vault;
    }
   //calculate the maturity   
   function closePrevious(uint256 _assetPrice) external override {
        underSettlement = true;
        previousAssetPrice = _assetPrice;
        //return when there is no previous round
        if (currentRound <= 1) return;
        vaultHeights[currentRound - 1] = block.number; //close previous round at current block
        StructureData.VaultState storage previousVaultState = vaultStates[currentRound - 1];
        if (previousVaultParameters.callOrPut) { 
            if (previousVaultState.strikePrice > _assetPrice){
                //convert
                previousVaultState.converted = true;
                //execute at strike price with interest rate
            }
            else {
                //return original asset with the interest rate
            }
        }
        else{
            if (previousVaultState.strikePrice < _assetPrice){
                //convert
                previousVaultState.converted = true; 
                //execute at strike price with interest rate, execute as the previousConvertedCoin for the user
            }
            else {
                //return original asset with the interest rate
            }
        }
        delete previousUserAddresses;
    }
   //close pending vault and autoroll if capacity is enough based on the maturity result
   function commitCurrent() external override {
        
        previousVaultParameters = vaultParameters;
        StructureData.VaultState storage vaultState = vaultStates[currentRound];
        vaultState.assetPrice = previousAssetPrice; 
        uint256 userCount = currentUserAddresses.length;
         for (uint i=0; i < userCount; i++) {
            StructureData.UserState storage userState = userStates[currentUserAddresses[i]]; 
            previousUserAddresses.push(currentUserAddresses[i]);
            //mint each user a share of the vault
            userState.previousConvertedCoin = userState.currentConvertedCoin;
         }
         delete currentUserAddresses;
        
   }
   function rollToNext(StructureData.VaultParameters memory _vaultParameters) external override {
        uint256 ratio =  _vaultParameters.callOrPut ? uint256(100).sub(_vaultParameters.strikePriceRatio) : 
        uint256(100).add(_vaultParameters.strikePriceRatio);
        _vaultParameters.strikePrice = previousAssetPrice.mul(ratio).div(100);
        currentRound = currentRound + 1;
        vaultParameters = _vaultParameters; 
        //todo: some storage warmup
        underSettlement = false;
    }
 
 
}