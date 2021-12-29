import { BigNumber, Contract } from "ethers";
import { ethers, deployments } from "hardhat";

import { PKKTHodlBoosterOption } from "../../typechain";

type OptionState = {
        round: BigNumber;
        totalAmount: BigNumber;
        strikePrice: BigNumber;
        premiumRate: number;
        pricePrecision: number;
        executed: boolean;
        callOrPut: boolean;
}

/**
 * Returns the current option state of the given hodl booster contract
 * @param hodlBoosterOption booster option we want to retrieve state from
 * @returns option state
 */
export async function getOptionState(hodlBoosterOption: PKKTHodlBoosterOption): Promise<OptionState> {
    let round = await hodlBoosterOption.currentRound();
    // We subtract 1 from round because we want the matured round
    return await hodlBoosterOption.optionStates(round.sub(1));
}

/**
 * Retrieves the contract from deployments
 * and creates an object from Contract abi and address
 * @param name name of the contract to get from deployments
 * @returns contract object
 */
export async function getDeployedContractHelper(name: string): Promise<Contract> {
    const Contract = await deployments.get(name);
    return await ethers.getContractAt(Contract.abi, Contract.address);
}

/**
 * Prints an option's state
 * @param optionState option state to print
 */
export function printOptionState(optionState: OptionState) {
    for(const [key, value] of Object.entries(optionState)) {
        console.log(`${key}: ${value}`);
    }
}

/**
 * Gets the tvl option data
 * @param options ethcall, ethput, wbtccall, wbtcput options
 * @param vault vault managing the options
 * @returns tvl option data including ongoing, locked, pending, released, and released counterparty
 */
export async function getTVLOptionData(options, vault) {
    let optionData: any = [];
    for(const option of options) {
        let name = await option.name();
        let assetDecimals = await option.depositAssetAmountDecimals();
        let counterPartyDecimals = await option.counterPartyAssetAmountDecimals();
        let optionTVL = await option.getOptionSnapShot();

        optionData.push(
            {
                name,
                active: ethers.utils.formatUnits(optionTVL.totalOngoing, assetDecimals),
                locked: ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals),
                pending: ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals),
                released: ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals),
                releasedCounterParty: ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)
            }
        );
    }
    return optionData;
}
