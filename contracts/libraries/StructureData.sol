// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
library StructureData { 
    // Info of each user.
    struct Parameters { 
        uint256 quota;
        uint256 interestRate;
        uint256 strikeRate; 
        uint256 exchangeRate;
        address traderAddress;
    }
 
}

 
