// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import "./interfaces/IDOVOption.sol";
import "./OptionVaultManager.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SingleDirectionOption is OptionVaultManager, IDOVOption {
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeMath for uint256;
    using Utils for uint256; 
  
    modifier validateVaultId(uint8 _vaultId) {
        require(_vaultId < vaultCount, "Invalid vaultId");
        _;
    }


    function initiateWithraw(uint8 _vaultId, uint256 _redeemAmount)
        external
        override 
        validateVaultId(_vaultId) { 
        OptionLifecycle.initiateWithrawStorage(
            vaultStates[_vaultId],
            msg.sender,
            _redeemAmount
        );
 
        emit InitiateWithdraw(msg.sender, _vaultId, _redeemAmount, vaultStates[_vaultId].currentRound);
    }

 

    function cancelWithdraw(uint8 _vaultId, uint256 _redeemAmount) 
        external 
        override 
        validateVaultId(_vaultId) {

        OptionLifecycle.cancelWithrawStorage(
            vaultStates[_vaultId],
            msg.sender,
            _redeemAmount
        );

        emit CancelWithdraw(msg.sender, _vaultId, _redeemAmount, vaultStates[_vaultId].currentRound);
         
    }
    
    //withdraw pending and expired amount
    function withdraw(uint8 _vaultId, uint256 _amount) 
        external 
        override 
        validateVaultId(_vaultId) lock{ 
 
        OptionLifecycle.withdrawStorage(
            vaultStates[_vaultId],
            msg.sender,
            _amount);
        OptionLifecycle.withdraw(msg.sender, _amount, vaultDefinitions[_vaultId].asset);
        
        emit Withdraw(msg.sender, _vaultId, _amount, vaultStates[_vaultId].currentRound);
    }

    //deposit eth
    function depositETH(uint8 _vaultId) external payable override 
        validateVaultId(_vaultId) lock{ 

        require(msg.value > 0, "!value"); 
        address asset = vaultDefinitions[_vaultId].asset; 
        require(asset == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), "!ETH");
        StructureData.VaultState storage data = vaultStates[_vaultId];
        require(data.cutOffAt > 0, "!started");
        //todo: check for cap
        OptionLifecycle.depositFor(
            data,
            msg.sender,
            msg.value);
  
        emit Deposit(msg.sender, _vaultId,  msg.value, data.currentRound);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _vaultId, uint256 _amount) external override 
        validateVaultId(_vaultId) lock{ 
        require(_amount > 0, "!amount"); 
        address asset = vaultDefinitions[_vaultId].asset; 
        require(asset != address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), "ETH");
        StructureData.VaultState storage data = vaultStates[_vaultId];
        require(data.cutOffAt > 0, "!started"); 

        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        OptionLifecycle.depositFor(
            data,
            msg.sender,
            _amount); 
        emit Deposit(msg.sender, _vaultId,  _amount, data.currentRound);
    }
 
    function getUserState(uint8 _vaultId) external override view validateVaultId(_vaultId) returns (StructureData.UserState memory) {

        StructureData.VaultState storage data = vaultStates[_vaultId];
        (,uint16 currentRound) = OptionLifecycle.getRealRound(data);
        StructureData.UserState storage state = data.userStates[msg.sender];
        return OptionLifecycle.recalcState(data, state, currentRound);

    }

    
    function getVaultState(uint8 _vaultId) external override view validateVaultId(_vaultId) returns(StructureData.VaultSnapShot memory) {
        StructureData.VaultState storage data = vaultStates[_vaultId];
        return OptionLifecycle.recalcVault(data);

    }
}
