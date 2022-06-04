// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.4;
import {StructureData} from "../libraries/StructureData.sol";  

interface IOptionVaultManagerV2 {

    function kickOffOptions(StructureData.KickOffOptionParameters[] memory _kickoffs) external;
    function expireOptions(StructureData.ExpiredOptionParameters[] memory _expired) external;
    function collectOptionHolderValues() external;
    function sellOptions(StructureData.OnGoingOptionParameters[] memory _cutoff) external;
    function bidOption(uint8 _vaultId, uint16 _premiumRate) external payable;
    function clearBidding() external payable;
}