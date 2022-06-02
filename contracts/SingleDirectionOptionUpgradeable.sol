// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SingleDirectionOption} from "./SingleDirectionOption.sol";
import {StructureData} from "./libraries/StructureData.sol";
contract SingleDirectionOptionUpgradeable is OwnableUpgradeable, SingleDirectionOption {
    function initialize(
        address _owner,
        address _manager,StructureData.VaultDefinition[] memory _vaultDefinitions
    ) external initializer { 
        
        require(_owner != address(0)); 
        locked = 0;
        __Ownable_init();
        transferOwnership(_owner);
        setManagerInternal(_manager);
        addVaultsInternal(_vaultDefinitions);  
    }

    function setManager(address _manager) external onlyOwner{
        setManagerInternal(_manager);
    }  
    function addVaults(StructureData.VaultDefinition[] memory _vaultDefinitions) external onlyOwner{
        addVaultsInternal(_vaultDefinitions);
    }

}
 