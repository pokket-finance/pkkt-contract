// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
//This is the only change, in real use, it would be inherited by OptionVaultStorage
abstract contract OptionVaultStorageV2 {  

    mapping(address => mapping(address => uint256))
        public whitelist;  
    
}
 