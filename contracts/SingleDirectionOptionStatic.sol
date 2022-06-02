// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol"; 
import {SingleDirectionOption} from "./SingleDirectionOption.sol";
import {StructureData} from "./libraries/StructureData.sol";

contract SingleDirectionOptionStatic is Ownable, SingleDirectionOption { 
        
    constructor(
        address _owner,
        address _manager,StructureData.VaultDefinition[] memory _vaultDefinitions
    )  {
        
        require(_owner != address(0)); 
        locked = 0;
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
