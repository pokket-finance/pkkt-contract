import { PKKTHodlBoosterOption } from "../typechain";
import { getOptionState } from "./utilities/utilities";

/**
 * Retrieves the vault information for a specific PKKTHodlBoosterOption
 * @param name name of the vault to get information for.
 */
export async function getVaultInfo(hodlBoosterOption: PKKTHodlBoosterOption) {
    const optionState = await getOptionState(hodlBoosterOption);
    console.log("Total Value Locked: ", optionState.totalAmount.toString());
}