// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
 
interface IPKKTStructureOption {
 
     event Deposit(uint8 indexed optionId, address indexed account, uint16 indexed round, uint128 amount);
     event Withdraw(uint8 indexed optionId, address indexed account, address indexed asset, uint128 amount);
     //event CloseOption(uint8 indexed optionId, uint16 indexed round);
     //event CommitOption(uint8 indexed optionId, uint16 indexed round);
     //event OpenOption(uint8 indexed optionId, uint16 indexed round);
     //event OptionCreated(uint8 indexed optionId, string name);
     //event OptionTransfer(uint8 indexed optionId, address indexed account, uint16 premium, uint16 round);

    function getAccountBalance(uint8 _optionId) external view returns (StructureData.UserBalance memory); 

    //ISettlementAggregator.balanceEnough needs to be called if there is any release amount
    function getOptionSnapShot(uint8 _optionId) external view returns(StructureData.OptionSnapshot memory); 

    //deposit eth
    function depositETH(uint8 _optionId) external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint8 _optionId, uint128 _amount) external;

    //redeem unsettled amount
    //function redeem(uint256 _amount, uint8 _optionId) external;  

    //complete withdraw happens on the option vault
    function initiateWithraw(uint8 _optionId, uint128 _assetToTerminate) external; 

    function cancelWithdraw(uint8 _optionId, uint128 _assetToTerminate) external;

    //function maxInitiateWithdraw(uint8 _optionId) external;

    //function maxCancelWithdraw(uint8 _optionId) external;
    
    function withdraw(uint8 _optionId, uint128 _amount, address _asset) external; 

    //function completeWithdraw(uint8 _optionId, uint256 _amount, address _asset) external; 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    //function redeposit(uint8 _optionId, uint256 _amount) external;


    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    //function redepositToCounterParty(uint8 _optionId, uint256 _amount) external;
 

    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed 
    //function getRoundData(uint8 _optionId, uint256 _blockHeight) external view returns(StructureData.OptionState memory);

 
}

