// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
//This is the only change, in real use, it would be inherited by OptionVaultStorage
abstract contract OptionVaultStorageV2 {  

    //instead of using whitelist to allow bidders to buy the option, we store the premium bidding of each person
    //and then choose the highest one when clearing
    mapping(uint8 => mapping(uint8=>uint16)) bidding;
    mapping(uint8 => address) bidders;
    
    
}
 