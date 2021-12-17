// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";
 
interface IPKKTStructureOption {

    
    function vaultAddress() external view returns(address);

    //deposit eth
    function depositETH() external payable;

    //deposit other erc20 coin, take wbtc or stable coin
    function deposit(uint256 _amount) external;

    //redeem unsettled amount
    function redeem(uint256 _amount) external; 

    function getPendingAsset() external view returns (uint256);   

    //0 for latest, 6 for 7 days ago
    function getOngoingAsset(uint8 _backwardRound) external view returns (uint256);

    //complete withdraw happens on the option vault
    function initiateWithraw(uint256 _assetToTerminate) external; 

    function cancelWithdraw(uint256 _assetToTerminate) external;

    function maxInitiateWithdraw() external;

    function maxCancelWithdraw() external;
    
    function withdraw(uint256 _amount, address _asset) external; 

    function completeWithdraw(uint256 _amount, address _asset) external;

    function getMatured() external view returns (StructureData.MaturedAmount[] memory);

    function getAvailable() external view returns (StructureData.Available memory);



    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    function redeposit(uint256 _amount) external;


    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    function redepositToCounterParty(uint256 _amount) external;

    //can only be called from counterparty option 
    function depositFromCounterParty(address[] memory _addresses, uint256[] memory _amounts) external;




    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed 
    function getRoundData(uint256 _blockHeight) external view returns(StructureData.OptionState memory);

    
 
}

