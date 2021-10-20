// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PKKTToken.sol"; 


abstract contract PKKTRewardManager is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // The PKKT TOKEN!
    PKKTToken public immutable pkkt; 
    uint256 public pkktPerBlock;
    // The block number when PKKT mining starts.
    uint256 public immutable startBlock;

    // A record status of LP pool.
    mapping(address => bool) public isAdded; 
    
    constructor(
        PKKTToken _pkkt,
        uint256 _pkktPerBlock,
        uint256 _startBlock
    ) public {
        require(address(_pkkt) != address(0) , "Zero address");
        pkkt = _pkkt;
        pkktPerBlock = _pkktPerBlock;
        startBlock = _startBlock;
    }

    // Safe pkkt transfer function, just in case if rounding error causes pool to not have enough PKKTs.
    function safePKKTTransfer(address _to, uint256 _amount) internal {
        uint256 pkktBal = pkkt.balanceOf(address(this));
        if (_amount > pkktBal) {
            pkkt.transfer(_to, pkktBal);
        } else {
            pkkt.transfer(_to, _amount);
        }
    } 
        
    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public virtual;

    //Update number of pkkt per block 
    function setPKKTPerBlock(uint256 _pkktPerBlock) external onlyOwner {
        massUpdatePools();
        pkktPerBlock = _pkktPerBlock;
    }

}
