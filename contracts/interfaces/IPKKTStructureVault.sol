// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
 
interface IPKKTStructureVault {
    //deposit eth
    function depositETH() external payable;
    //deposit other erc20 coin, take wbtc
    function deposit(uint256 _amount, StructureData.StableCoin _convertedCoin) external;

    //redeem unsettled amount
    function redeem(uint256 _amount) external;

    //redeem all unsettled amount 
    function  maxRedeem() external; 

    function getPendingAsset() external view returns (uint256);   

    function getOngoingAsset() external view returns (uint256);

    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and the amount, and call this method to get the result
    //the blockheight is the the height when the round is committed, and the matured date can be calculated at client side using the roundSpan, usually 7 days 
    function getRoundData(uint256 _blockHeight, uint256 _vaultShareAmount) external view returns(uint256 round, uint256 roundSpan, uint256 maturedAmount, uint256 strikePrice, bool converted);

 
}