import { BigNumber, Contract } from "ethers";
import { ethers, deployments } from "hardhat";

import { PKKTHodlBoosterOption } from "../typechain";

type OptionState = {
        round: BigNumber;
        totalAmount: BigNumber;
        strikePrice: BigNumber;
        underlyingPrice: BigNumber;
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
export async function printOptionState(optionState: OptionState) {
    for(const [key, value] of Object.entries(optionState)) {
        console.log(`${key}: ${value}`);
    }
    // console.log(`Underyling Price: ${optionState.underlyingPrice.toString()}`);
    // console.log(`Total Amount: ${optionState.totalAmount.toString()}`);
    // console.log(`Price Precision: ${optionState.pricePrecision.toString()}`);
    // console.log(`Premium Rate: ${optionState.premiumRate.toString()}`);
    // console.log(`Executed: ${optionState.executed}`);
    // console.log(`Strike Price: ${optionState.strikePrice.toString()}\n`);
}