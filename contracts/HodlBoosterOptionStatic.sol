// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol"; 
import {HodlBoosterOption} from "./HodlBoosterOption.sol";
import {StructureData} from "./libraries/StructureData.sol";

contract HodlBoosterOptionStatic is Ownable, HodlBoosterOption { 
    constructor(
        address _owner,
        address _settler,
        StructureData.OptionPairDefinition[] memory _optionPairDefinitions
    )  {
        
        require(_owner != address(0));
        require(_settler != address(0));
        locked = 0;
        transferOwnership(_owner);
        settlerRoleAddress = _settler;
        addOptionPairsInternal(_optionPairDefinitions);  
    }

    function setSettler(address _settler) external onlyOwner{
        setSettlerInternal(_settler);
    }  
    function addOptionPairs(StructureData.OptionPairDefinition[] memory _optionPairDefinitions) external onlyOwner{
        addOptionPairsInternal(_optionPairDefinitions);
    }

}