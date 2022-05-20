// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4; 
import {StructureData} from "../libraries/StructureData.sol";

interface IDOVOption {
 
     //event Deposit(uint8 indexed optionId, address indexed account, uint16 indexed round, uint256 amount);
    // event Withdraw(uint8 indexed optionId, address indexed account, address indexed asset, uint256 amount); 

    function getAccountBalance(uint8 _optionId) external view returns (StructureData.UserBalance memory); 

    //ISettlementAggregator.balanceEnough needs to be called if there is any release amount
    function getOptionSnapShot(uint8 _optionId) external view returns(StructureData.OptionSnapshot memory); 

    //deposit eth
    function depositETH(uint8 _optionId) external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint8 _optionId, uint256 _amount) external;

    //complete withdraw happens on the option vault
    function initiateWithraw(uint8 _optionId, uint256 _assetToTerminate) external; 

    function cancelWithdraw(uint8 _optionId, uint256 _assetToTerminate) external;
 
    
    function withdraw(uint8 _optionId, uint256 _amount, address _asset) external; 
 
 

    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed 
    //function getRoundDataByBlock(uint8 _optionId, uint256 _blockHeight) external view returns(StructureData.OptionState memory);

    function getOptionStateByRound(uint8 _optionId, uint16 _round) external view returns(StructureData.OptionState memory);
 
}

