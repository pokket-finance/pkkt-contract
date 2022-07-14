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
        address _admin,
        address _manager,
         StructureData.OptionPairDefinition[] memory _optionPairDefinitions
    ) external initializer { 
 
        __Ownable_init();
        
        require(_owner != address(0));
        require(_admin != address(0));
        require(_manager != address(0));
        transferOwnership(_owner);
        adminRoleAddress = _admin;
        managerRoleAddress = _manager;
        locked = 0;
        addOptionPairsInternal(_optionPairDefinitions);  
    }

    function setManager(address _manager) external onlyOwner{
        setManagerInternal(_manager);
    }  

    function setAdmin(address _admin) external onlyOwner{
        setAdminInternal(_admin);
    }   
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) external onlyAdmin{
        addOptionPairsInternal(_optionPairDefinitions);
    }

    function addWhitelistAddress(address _target, address[] memory _assets, uint256[] memory _allowedWithdrawAmounts) external onlyAdmin {
        addWhitelistAddressInternal(_target, _assets, _allowedWithdrawAmounts);
    }
}
 