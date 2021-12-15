import { BigNumber, Signer } from "ethers";

import { PKKTHodlBoosterOption } from "../typechain";

/**
 * Calculates the users nav from the PKKTHodlBoosterOption
 * @param hodlBoosterOption option to calculate nav from
 * @param user user to calculate nav for
 */
export async function getUserNAV (hodlBoosterOption: PKKTHodlBoosterOption, user: Signer) {
    let pendingAmount: BigNumber = await hodlBoosterOption
        .connect(user)
        .getPendingAsset();
    let ongoingAmount: BigNumber = await hodlBoosterOption
        .connect(user)
        .getOngoingAsset(0);
    let userNAV: BigNumber = pendingAmount.add(ongoingAmount);
    console.log("User NAV: ", userNAV.toString());
}
