// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
 
interface IPKKTStructureOption {
 
    
    function getAccountBalance(uint8 _optionId) external view returns (StructureData.UserBalance memory); 

    //ISettlementAggregator.balanceEnough needs to be called if there is any release amount
    function getOptionSnapShot(uint8 _optionId) external view returns(StructureData.OptionSnapshot memory);
 
    //function getWithdrawable(address _asset, uint8 _optionId) external view returns(uint256); 
 

    //deposit eth
    function depositETH(uint8 _optionId) external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint256 _amount, uint8 _optionId) external;

    //redeem unsettled amount
    //function redeem(uint256 _amount, uint8 _optionId) external;  

    //complete withdraw happens on the option vault
    function initiateWithraw(uint256 _assetToTerminate, uint8 _optionId) external; 

    function cancelWithdraw(uint256 _assetToTerminate, uint8 _optionId) external;

    //function maxInitiateWithdraw(uint8 _optionId) external;

    //function maxCancelWithdraw(uint8 _optionId) external;
    
    function withdraw(uint256 _amount, address _asset, uint8 _optionId) external; 

    //function completeWithdraw(uint256 _amount, address _asset, uint8 _optionId) external; 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    //function redeposit(uint256 _amount, uint8 _optionId) external;


    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    //function redepositToCounterParty(uint256 _amount,uint8 _optionId) external;
 

    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed 
    function getRoundData(uint256 _blockHeight, uint8 _optionId) external view returns(StructureData.OptionState memory);

 
}

