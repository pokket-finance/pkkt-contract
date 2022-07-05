// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
//import "hardhat/console.sol";

import {StructureData} from "./libraries/StructureData.sol";
import {Utils} from "./libraries/Utils.sol";
import {OptionLifecycle} from "./libraries/OptionLifecycle.sol";
import {OptionVaultStorage} from "./storage/OptionVaultStorage.sol";
import "./interfaces/IOptionVaultManager.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract OptionVaultManager is
    OptionVaultStorage,
    IOptionVaultManager
{
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Utils for uint256;
    using SafeCast for uint256;
    using SafeCast for int256;

    function setManagerInternal(address _manager) internal {
        require(_manager != address(0), "!manager");
        managerRoleAddress = _manager;
    }

    function addVaultsInternal(
        StructureData.VaultDefinition[] memory _vaultDefinitions
    ) internal {
        uint256 length = _vaultDefinitions.length;
        uint8 vaultCount_ = vaultCount;
        uint8 assetCount_ = assetCount;
        for (uint256 i = 0; i < length; i++) {
            StructureData.VaultDefinition memory vault = _vaultDefinitions[i];
            vault.vaultId = vaultCount_;
            vaultDefinitions[vaultCount_++] = vault;
            bool knownAsset = false;
            for (uint8 j = 0; j < assetCount_; j++) {
                if (assets[j] == vault.asset) {
                    knownAsset = true;
                    break;
                }
            }
            if (!knownAsset) {
                assets[assetCount_++] = vault.asset;
            }
        }
        vaultCount = vaultCount_;
        assetCount = assetCount_;
    }

    function addToWhitelist(address[] memory _whitelistAddresses)
        external
        override
        managerOnly
    {
        uint8 traderCount_ = traderCount;
        for (uint256 i = 0; i < _whitelistAddresses.length; i++) {
            address trader = _whitelistAddresses[i];
            if (!whitelist[trader]) {
                whitelist[trader] = true;
                bool existingTrader = false;
                for (uint8 j = 0; j < traderCount_; j++) {
                    if (traders[j] == trader) {
                        existingTrader = true;
                        break;
                    }
                }
                if (!existingTrader) {
                    traders[traderCount_++] = trader;
                }
            }
        }
        traderCount = traderCount_;
    }

    function removeFromWhitelist(address[] memory _delistAddresses)
        external
        override
        managerOnly
    {
        for (uint256 i = 0; i < _delistAddresses.length; i++) {
            whitelist[_delistAddresses[i]] = false;
        }
    }

    function whitelistTraders()
        external
        view
        override
        returns (address[] memory)
    {
        if (traderCount == 0) {
            return new address[](0);
        }
        uint256 count = 0;
        for (uint8 i = 0; i < traderCount; i++) {
            if (whitelist[traders[i]]) {
                count++;
            }
        }
        address[] memory whitelistData = new address[](count);
        count = 0;
        for (uint8 i = 0; i < traderCount; i++) {
            if (whitelist[traders[i]]) {
                whitelistData[count++] = traders[i];
            }
        }
        return whitelistData;
    }

    //only needed for the initial kick off
    function kickOffOptions(
        StructureData.KickOffOptionParameters[] memory _kickoffs
    ) external override managerOnly {
        for (uint256 i = 0; i < _kickoffs.length; i++) {
            StructureData.KickOffOptionParameters memory kickoff = _kickoffs[i];
            StructureData.VaultState storage data =
                vaultStates[kickoff.vaultId];
            require(data.currentRound == 0, "already kicked off");
            uint256 cutOffAt = 0;
            if (kickoff.environment == 0) {
                //prod
                cutOffAt = block.timestamp.add(OptionLifecycle.PERIOD);
            } else if (kickoff.environment == 1) {
                //qa
                cutOffAt = block.timestamp.add(OptionLifecycle.PERIOD_QA);
            } else {
                //test
                cutOffAt = block.timestamp.add(OptionLifecycle.PERIOD_TEST);
            }
            require(cutOffAt <= type(uint32).max, "Overflow cutOffAt");
            data.cutOffAt = uint32(cutOffAt);

            data.maxCapacity = kickoff.maxCapacity;
            data.environment = kickoff.environment;
            data.currentRound = 1;
        }
    }

    function setCapacities(
        StructureData.CapacityParameters[] memory _capacities
    ) external override managerOnly {
        for (uint256 i = 0; i < _capacities.length; i++) {
            StructureData.CapacityParameters memory capacity = _capacities[i];
            StructureData.VaultState storage data =
                vaultStates[capacity.vaultId];
            uint256 currentTVL =
                uint256(data.totalPending)
                    .add(data.onGoing.amount)
                    .add(data.expired.amount)
                    .sub(data.expired.queuedRedeemAmount);
            require(
                currentTVL <= capacity.maxCapacity,
                "Max Cap less than tvl"
            );
            data.maxCapacity = capacity.maxCapacity;
        }
    }

    //parameters for option to sell, todo: whitelist
    function sellOptions(
        StructureData.OnGoingOptionParameters[] memory _ongoingParameters
    ) external override managerOnly {
        for (uint256 i = 0; i < _ongoingParameters.length; i++) {
            StructureData.OnGoingOptionParameters memory ongoingParameters =
                _ongoingParameters[i];
            require(ongoingParameters.premiumRate > 0, "!premium");
            require(ongoingParameters.strike > 0, "!strike");
            StructureData.VaultState storage data =
                vaultStates[ongoingParameters.vaultId];
            OptionLifecycle.rollToNextRoundIfNeeded(data);
            require(data.currentRound > 1, "No selling round");
            StructureData.OptionState storage onGoing = data.onGoing;
            require(onGoing.buyerAddress == address(0), "Already sold");
            onGoing.strike = ongoingParameters.strike;
            onGoing.premiumRate = ongoingParameters.premiumRate;
        }
    }

    //after buying by sending back the premium, the premium and strike can no longer be changed
    function buyOptions(uint8[] memory _vaultIds)
        external
        payable
        override
        whitelisted
        lock
    {
        uint256 ethToSend = 0;
        for (uint256 i = 0; i < _vaultIds.length; i++) {
            uint8 vaultId = _vaultIds[i];
            StructureData.VaultState storage data = vaultStates[vaultId];
            OptionLifecycle.rollToNextRoundIfNeeded(data);
            StructureData.OptionState storage onGoing = data.onGoing;
            require(onGoing.amount > 0, "Nothing to sell");
            require(onGoing.buyerAddress == address(0), "Already sold");
            //if there is any auto rolling, we must wait until expiry level specified
            if ( data.expired.amount - data.expired.queuedRedeemAmount > 0
            ) {
                require(
                    data.depositPriceAfterExpiryPerRound[
                        data.currentRound - 2
                    ] > 0,
                    "Expiry level not specified yet"
                );
            }
            uint256 total =
                uint256(onGoing.amount).add(data.expired.amount).sub(
                    data.expired.queuedRedeemAmount
                );
            uint256 premium = total.premium(onGoing.premiumRate);
            address asset = vaultDefinitions[vaultId].asset;
            if (asset == address(0)) {
                ethToSend = ethToSend.add(premium);
            } else {
                IERC20(asset).safeTransferFrom(
                    msg.sender,
                    address(this),
                    premium
                );
            }
            onGoing.buyerAddress = msg.sender;
        }
        require(ethToSend >= msg.value, "Not enough eth");
        //transfer back extra
        if (ethToSend > msg.value) {
            payable(msg.sender).transfer(ethToSend - msg.value);
        }
    }

    function expireOptions(
        StructureData.ExpiredOptionParameters[] memory _expiryParameters
    ) external override managerOnly {
        for (uint256 i = 0; i < _expiryParameters.length; i++) {
            StructureData.ExpiredOptionParameters memory expiryParameters =
                _expiryParameters[i];
            require(expiryParameters.expiryLevel > 0, "!expiryLevel");
            StructureData.VaultState storage data =
                vaultStates[expiryParameters.vaultId];
            OptionLifecycle.rollToNextRoundIfNeeded(data);
            require(data.currentRound > 2, "No expired round");
            StructureData.OptionState storage expired = data.expired;
            if (expired.amount == 0 || expired.buyerAddress == address(0)) {
                continue;
            }

            require(expired.strike > 0, "!strike");
            address asset = vaultDefinitions[expiryParameters.vaultId].asset;
            uint256 diff =
                vaultDefinitions[expiryParameters.vaultId].callOrPut
                    ? (
                        expiryParameters.expiryLevel > expired.strike
                            ? expiryParameters.expiryLevel - expired.strike
                            : 0
                    )
                    : (
                        expired.strike > expiryParameters.expiryLevel
                            ? expired.strike - expiryParameters.expiryLevel
                            : 0
                    );

            //can be withdrawn by trader
            StructureData.OptionBuyerState storage buyerState =
                buyerStates[expired.buyerAddress];

            uint256 optionHolderValue =
                diff.mul(expired.amount).div(
                    vaultDefinitions[expiryParameters.vaultId].callOrPut
                        ? expiryParameters.expiryLevel
                        : expired.strike
                );
            Utils.assertUint128(optionHolderValue);
            buyerState.optionValueToCollect[asset] = uint128(
                optionHolderValue.add(buyerState.optionValueToCollect[asset])
            );
            buyerState.history.push(
                StructureData.ExpiredVaultState({
                    amount: expired.amount,
                    strike: expired.strike,
                    expiryLevel: expiryParameters.expiryLevel,
                    premiumRate: expired.premiumRate,
                    vaultId: expiryParameters.vaultId,
                    round: data.currentRound - 2,
                    optionHolderValue: optionHolderValue
                })
            ); 
            uint256 remaining =
                uint256(expired.amount).withPremium(expired.premiumRate).sub(
                    optionHolderValue
                );
            uint256 depositPriceAfterExpiry =
                remaining.mul(10**OptionLifecycle.ROUND_PRICE_DECIMALS).div(
                    expired.amount
                );
            Utils.assertUint128(depositPriceAfterExpiry);
            data.depositPriceAfterExpiryPerRound[
                data.currentRound - 2
            ] = uint128(depositPriceAfterExpiry);

            uint256 redeemed =
                remaining.mul(expired.queuedRedeemAmount).div(expired.amount);
            uint256 totalRedeemed = redeemed.add(data.totalRedeemed);
            Utils.assertUint128(totalRedeemed);
            data.totalRedeemed = uint128(totalRedeemed);
            uint256 totalOnGoing =
                remaining.sub(redeemed).add(data.onGoing.amount);
            Utils.assertUint128(totalOnGoing);
            data.onGoing.amount = uint128(totalOnGoing);
            expired.amount = 0;
            expired.queuedRedeemAmount = 0;
        }
    }

    function collectOptionHolderValues() external override whitelisted lock {
        StructureData.OptionBuyerState storage buyerState =
            buyerStates[msg.sender];
        for (uint256 i = 0; i < assetCount; i++) {
            address asset = assets[uint8(i)];
            uint256 assetAmount = buyerState.optionValueToCollect[asset];
            if (assetAmount > 0) {
                buyerState.optionValueToCollect[asset] = 0;
                OptionLifecycle.withdraw(msg.sender, assetAmount, asset);
            }
        }
    }

    function optionHolderValues()
        external
        view
        override
        returns (StructureData.CollectableValue[] memory)
    {
        StructureData.OptionBuyerState storage buyerState =
            buyerStates[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < assetCount; i++) {
            address asset = assets[uint8(i)];
            uint256 assetAmount = buyerState.optionValueToCollect[asset];
            if (assetAmount > 0) {
                count++;
            }
        }
        StructureData.CollectableValue[] memory values =
            new StructureData.CollectableValue[](count);
        if (count == 0) {
            return values;
        }
        count = 0;
        for (uint256 i = 0; i < assetCount; i++) {
            address asset = assets[uint8(i)];
            uint256 assetAmount = buyerState.optionValueToCollect[asset];
            if (assetAmount > 0) {
                values[count] = StructureData.CollectableValue({
                    asset: asset,
                    amount: assetAmount
                });
                count++;
            }
        }
        return values;
    }

    function expiredHistory()
        external
        view
        override
        returns (StructureData.ExpiredVaultState[] memory)
    {
         StructureData.OptionBuyerState storage buyerState =
            buyerStates[msg.sender];
        StructureData.ExpiredVaultState[] memory values =
            new StructureData.ExpiredVaultState[](buyerState.history.length); 
        for (uint256 i = 0; i < buyerState.history.length; i++) {
           values[i] = buyerState.history[i];
        }
        return values;
    }

    modifier lock() {
        require(locked == 0, "locked");
        locked = 1;
        _;
        locked = 0;
    }
    modifier managerOnly() {
        require(managerRoleAddress == msg.sender, "!manager");
        _;
    }

    modifier whitelisted() {
        require(whitelist[msg.sender], "!whitelisted");
        _;
    }
}
