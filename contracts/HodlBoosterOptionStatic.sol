// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol"; 
import {HodlBoosterOption} from "./HodlBoosterOption.sol";
import {StructureData} from "./libraries/StructureData.sol";

contract HodlBoosterOptionStatic is Ownable, HodlBoosterOption { 
    constructor(
        address _owner,
        address _admin,
        address _manager,
        StructureData.OptionPairDefinition[] memory _optionPairDefinitions
    )  {
        
        require(_owner != address(0));
        require(_admin != address(0));
        require(_manager != address(0));
        locked = 0;
        transferOwnership(_owner);
        adminRoleAddress = _admin;
        managerRoleAddress = _manager;
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

}