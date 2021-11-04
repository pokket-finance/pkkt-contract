// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "./interfaces/IClaimable.sol"; 
import "@openzeppelin/contracts/access/Ownable.sol";

contract PKKTRewardAggregator is Ownable{
    
    address[] managers;
    constructor(address[] memory _manangers) {
       managers = _manangers;
    }
    
    
    function addManager(address _mananger) external onlyOwner {
        managers.push(_mananger);
    }
    function harvest() external {
        uint256 length = managers.length;
        for (uint256 i = 0; i < length; ++i) {
            IClaimable(managers[i]).harvestAllPools();
        }
    }
}