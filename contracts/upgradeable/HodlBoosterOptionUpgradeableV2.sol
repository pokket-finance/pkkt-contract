// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {HodlBoosterOptionV2} from "./HodlBoosterOptionV2.sol";
import {StructureData} from "./../libraries/StructureData.sol";

//In real case, this is untouched except the call wrapper to addWhitelistAddressInternal, since we can change OptionVaultStorage to inherit from OptionVaultStorageV2
//and the added logic is in OptionVaultBaseV2
contract HodlBoosterOptionUpgradeableV2 is OwnableUpgradeable, HodlBoosterOptionV2 {
    function initialize(
        address _owner,
        address _settler,
         StructureData.OptionPairDefinition[] memory _optionPairDefinitions
    ) external initializer { 
 
        __Ownable_init();
        
        require(_owner != address(0));
        require(_settler != address(0));
        transferOwnership(_owner);
        settlerRoleAddress = _settler;
        locked = 0;
        addOptionPairsInternal(_optionPairDefinitions);  
    }

    function setSettler(address _settler) external onlyOwner{
        setSettlerInternal(_settler);
    }  
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) external onlyOwner{
        addOptionPairsInternal(_optionPairDefinitions);
    }

    function addWhitelistAddress(address _target, address[] memory _assets, uint256[] memory _allowedWithdrawAmounts) external onlyOwner {
        addWhitelistAddressInternal(_target, _assets, _allowedWithdrawAmounts);
    }
}
 