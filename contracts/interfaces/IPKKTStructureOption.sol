// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
 
interface IPKKTStructureOption {
    //deposit eth
    function depositETH() external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint256 _amount) external;

    //redeem unsettled amount
    function redeem(uint256 _amount) external; 

    function getPendingAsset() external view returns (uint256);   

    //0 for latest, 6 for 7 days ago
    function getOngoingAsset(uint8 _backwardRound) external view returns (uint256);

    function withraw(uint256 _amount, bool _stableCoin) external;

    function redeposit(uint256 _amount) external;

    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed 
    function getRoundData(uint256 _blockHeight) external view returns(StructureData.OptionState memory);

 
}