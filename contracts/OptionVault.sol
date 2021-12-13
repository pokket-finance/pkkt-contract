// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "hardhat/console.sol";
 
import {StructureData} from "./libraries/StructureData.sol";      
import "./interfaces/IOptionVault.sol"; 

contract OptionVault is IOptionVault, AccessControl {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
     
    mapping(address=>uint256) private maturedAmount;
    //mapping(address=>uint256) private requestingAmount;
    mapping(address=>uint256) private pendingAmount;
    address[] private asset;
    mapping(address=>bool) assetExistence;
    mapping(address=>StructureData.SettlementInstruction) public settlementInstruction; 
    
    bytes32 public constant OPTION_ROLE = keccak256("OPTION_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    constructor(address _settler) {
       // Contract deployer will be able to grant and revoke option role
       _setupRole(DEFAULT_ADMIN_ROLE, msg.sender); 
       _setupRole(SETTLER_ROLE, _settler); 
    }
    
    function addOption(address _optionContract) external override onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(OPTION_ROLE, _optionContract); 
    }

    function removeOption(address _optionContract) external override onlyRole(DEFAULT_ADMIN_ROLE){
        revokeRole(OPTION_ROLE, _optionContract); 
    }
    function getAddress() public view override returns(address){
        return address(this);
    }

     
    function withdraw(address _target, uint256 _amount, address _contractAddress) external override onlyRole(OPTION_ROLE){
        _withdraw(_target, _amount, _contractAddress);
    }
    function addAssetIfNeeded(address _asset) private{
        if (!assetExistence[_asset]) {
            assetExistence[_asset] = true;
            asset.push(_asset);
        }
    } 
     function _withdraw(address _target, uint256 _amount, address _contractAddress) private{
        if (_contractAddress == address(0)) {
            payable(_target).transfer(_amount);
        }
        else { 
            IERC20(_contractAddress).safeTransfer(_target, _amount); 
        }
    }
    function prepareSettlement() external override {
       uint256 assetCount = asset.length; 
       for (uint i=0; i < assetCount; i++) {
            address assetAddress = asset[i]; 
           StructureData.SettlementInstruction memory instruction =  settlementInstruction[assetAddress];
           require(instruction.fullfilled, "Settlement not finished"); 
       }
        for (uint i=0; i < assetCount; i++) {
            address assetAddress = asset[i]; 
            maturedAmount[assetAddress] = 0;
            pendingAmount[assetAddress] = 0;
       }

    }

    function setCommittedState(StructureData.OptionState memory _currentState, address _depositAsset, address _counterPartyAsset) 
    external override  onlyRole(OPTION_ROLE){ 
        if (_currentState.callOrPut) {
            uint256 pendingDepositAssetAmount = pendingAmount[_depositAsset];
             pendingAmount[_depositAsset] = pendingDepositAssetAmount.add(_currentState.totalAmount);
            addAssetIfNeeded(_depositAsset);
        }
        else { 
            uint256 pendingCounterPartyAssetAmount = pendingAmount[_counterPartyAsset];
            pendingAmount[_counterPartyAsset] = pendingCounterPartyAssetAmount.add(_currentState.totalAmount);
            addAssetIfNeeded(_counterPartyAsset);
        }
    }
    function setMaturityState(StructureData.MaturedState memory _maturedState, address _depositAsset, address _counterPartyAsset)  
    external override  onlyRole(OPTION_ROLE){ 
        if (_maturedState.maturedDepositAssetAmount > 0) {
           uint256 maturedDepositAssetAmount  = maturedAmount[_depositAsset];
           maturedAmount[_depositAsset] = maturedDepositAssetAmount.add(_maturedState.maturedDepositAssetAmount);
           addAssetIfNeeded(_depositAsset);
        }
        if (_maturedState.maturedCounterPartyAssetAmount > 0) {
            uint256 maturedCounterPartyAssetAmount = maturedAmount[_counterPartyAsset];
            maturedAmount[_counterPartyAsset] = maturedCounterPartyAssetAmount.add(_maturedState.maturedCounterPartyAssetAmount);
            addAssetIfNeeded(_counterPartyAsset);
        } 
         
    }

    //make sure that the previous settlement is finished
 
    function allSettled() external override view returns(bool){
        uint256 assetCount = asset.length; 
       for (uint i=0; i < assetCount; i++) {
            address assetAddress = asset[i]; 
           StructureData.SettlementInstruction memory instruction =  settlementInstruction[assetAddress];
           if (!instruction.fullfilled) {
               return false;
           }
       }
       return true;
    }

    //todo: add whitelist check for traderAddress 
    //todo: what if settlement partially failed?
    function startSettlement(address _traderAddress) external override onlyRole(SETTLER_ROLE) {
        uint256 assetCount = asset.length; 
        //console.log("Asset count: %d", assetCount);
        if (assetCount == 0) { 
            return;
        } 
        
        for (uint i=0; i < assetCount; i++) {
            address assetAddress = asset[i];
            uint256 matured = maturedAmount[assetAddress];
            uint256 pending = pendingAmount[assetAddress]; 
            //console.log("%s: %d %d", assetAddress, matured, pending);
            if (pending == matured) {

                StructureData.SettlementInstruction memory instruction = StructureData.SettlementInstruction({
                    contractAddress: assetAddress,
                    targetAddress: address(0),
                    direction: StructureData.Direction.None,
                    amount: 0,
                    fullfilled: true 
                });  
                settlementInstruction[assetAddress] = instruction; 
            }
            else if (pending > matured) {
                uint diff = pending.sub(matured);
                StructureData.SettlementInstruction memory instruction = StructureData.SettlementInstruction({
                    contractAddress: assetAddress,
                    targetAddress: _traderAddress,
                    direction: StructureData.Direction.SendToTrader,
                    amount: diff,
                    fullfilled: true 
                });                 
                //console.log("send %s to trader %d", assetAddress, diff);
                _withdraw(_traderAddress, diff, assetAddress); 
                settlementInstruction[assetAddress] = instruction; 
            }
            else {
                
                uint diff = matured.sub(pending);
                StructureData.SettlementInstruction memory instruction = StructureData.SettlementInstruction({
                    contractAddress: assetAddress,
                    targetAddress: getAddress(),
                    direction: StructureData.Direction.SendBackToVault, 
                    amount: diff,
                    fullfilled: false 
                });  
                settlementInstruction[assetAddress] = instruction; 
            } 
        }
        
    }

    //todo: shall we throw error if not fullfilled？
    function finishSettlement() external override onlyRole(SETTLER_ROLE) {
      uint256 assetCount = asset.length; 
      for (uint i=0; i < assetCount; i++) {
           address assetAddress = asset[i]; 
           StructureData.SettlementInstruction storage instruction =  settlementInstruction[assetAddress];
           if (!instruction.fullfilled) {
               
                //what if send to trader failed
               if (instruction.direction == StructureData.Direction.SendBackToVault) {
                    uint256 balance = getMaturedBalance(assetAddress);
                     //console.log("%s %d %d", assetAddress, balance, maturedAmount[assetAddress]);
                    
                    if (balance >= maturedAmount[assetAddress]) {
                        instruction.fullfilled = true;
                    }
               }

           }
       }
    }
     
    //todo: debit the user deposit after rollToNext
    function getMaturedBalance(address _asset) private view returns(uint256) {
       if (_asset != address(0)) {
            return IERC20(_asset).balanceOf(getAddress()); 
       }
       else{
          return getAddress().balance;
       }
    }

    event Received(address indexed source, uint amount);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}