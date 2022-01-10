import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, getNamedAccounts, deployments } from "hardhat";
import { OptionExecution, NULL_ADDRESS, ETH_USDC_OPTION_ID, WBTC_USDC_OPTION_ID } from "../../constants/constants";

import { OptionVault, PKKTHodlBoosterOption } from "../../typechain";

// type OptionState = {
//         round: BigNumber;
//         totalAmount: BigNumber;
//         strikePrice: BigNumber;
//         premiumRate: number;
//         pricePrecision: number;
//         executed: boolean;
//         callOrPut: boolean;
// }

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

/**
 * Sets the settlement parameters and settles the option vault
 * @param ethDecision exercise decision for the eth options
 * can only exercise one or none of the options they are European
 * @param wbtcDecision exercise decision for the wbtc options
 * can only exercise one or none of the options as they are European
 */
export async function setSettlementParameters(ethDecision: OptionExecution, wbtcDecision: OptionExecution) {
    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;

    const settler = await getSettler();

    const settleParameters = [ ethDecision, wbtcDecision];

    try {
        await optionVault.connect(settler as Signer).settle(settleParameters);
    } catch (err) {
        console.error(err);
    }
}

type SettlementAccountingResult = {
    round: BigNumber
    depositAmount: BigNumber 
    autoRollAmount: BigNumber
    autoRollPremium: BigNumber 
    releasedAmount: BigNumber 
    releasedPremium: BigNumber
    autoRollCounterPartyAmount: BigNumber
    autoRollCounterPartyPremium: BigNumber
    releasedCounterPartyAmount: BigNumber
    releasedCounterPartyPremium: BigNumber
    option: String
    executed: Boolean
}

type OptionPairExecutionAccountingResult = {  
    callOptionResult: SettlementAccountingResult
    putOptionResult: SettlementAccountingResult
    execute: OptionExecution
}

/**
 * Determines whether or not we can settle the vault
 * @param vault option vault to get execution accounting result
 * @param settler allows us to connect to vault
 * @param round checks if the option parameters are set
 * @returns whether or not we can settle the vault
 */
 export async function canSettle(vault: PKKTHodlBoosterOption): Promise<boolean> {
    return await vault.underSettlement();
}

export async function canShowMoneyMovement(vault: PKKTHodlBoosterOption, round): Promise<boolean> {
    return !(await canSettle(vault)) && round > 2;
}

/**
 * Checks if the option parameters are set for the given round.
 * @param round round to check
 * @returns whether or not the option parameters are set
 */
export async function areOptionParamsSet(round: number): Promise<boolean> {
    if (round === 0) {
        return false;
    }
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;

    const optionStates = await getOptionStateData(vault, round);
    for (let optionState of optionStates) {
        if (!optionState.strikePrice.isZero() || optionState.premiumRate !== 0) {
            return true;
        }
    }
    return false;
}

export async function getOptionStateData(vault: PKKTHodlBoosterOption, round: number) {
    let ethOption = await vault.optionPairs(ETH_USDC_OPTION_ID);
    let wbtcOption = await vault.optionPairs(WBTC_USDC_OPTION_ID);
    const ethCallOptionState = await vault.getOptionStateByRound(
        ethOption.callOptionId,
        round - 1
    );
    const ethPutOptionState = await vault.getOptionStateByRound(
        ethOption.putOptionId,
        round - 1
    );
    const wbtcCallOptionState = await vault.getOptionStateByRound(
        wbtcOption.callOptionId,
        round - 1
    );
    const wbtcPutOptionState = await vault.getOptionStateByRound(
        wbtcOption.putOptionId,
        round - 1
    );
    return [
        ethCallOptionState,
        ethPutOptionState,
        wbtcCallOptionState,
        wbtcPutOptionState
    ]
}

/**
 * Function to get the settler account
 * @returns the settler account
 */
export async function getSettler(): Promise<SignerWithAddress> {
    const { settler } = await getNamedAccounts();
    return await ethers.getSigner(settler);
}

/**
 * Function to get the trader account
 * @returns the trader account
 */
export async function getTrader(): Promise<SignerWithAddress> {
    const { trader } = await getNamedAccounts();
    return await ethers.getSigner(trader);
}

export function settlementResubmit(app): boolean {
    let initiateSettlementResubmit = app.get("initiateSettlementResubmit");
    if (initiateSettlementResubmit === undefined) {
        initiateSettlementResubmit = false;
    }
    return initiateSettlementResubmit;
}

/**
 * Gets the money movement data for the given asset
 * @param vault to get the settlement cash flow result
 * @param settler 
 * @param assetDecimals for formatting data
 * @param assetAddress asset to get data for
 * @returns data about the settlement cash flow result
 */
export async function getMoneyMovementData(vault: OptionVault, settler: SignerWithAddress, assetDecimals, assetAddress: string) {
    let assetCashFlow = await vault.connect(settler as Signer).settlementCashflowResult(assetAddress);
    return {
        queuedLiquidity: ethers.utils.formatUnits(
            assetCashFlow.newDepositAmount,
            assetDecimals
        ),
        withdrawalRequest: ethers.utils.formatUnits(
            assetCashFlow.newReleasedAmount,
            assetDecimals
        ),
        leftover: ethers.utils.formatUnits(
            assetCashFlow.leftOverAmount,
            assetDecimals
        ),
        required: ethers.utils.formatUnits(
            assetCashFlow.leftOverAmount
                .add(assetCashFlow.newDepositAmount)
                .sub(assetCashFlow.newReleasedAmount),
            assetDecimals
        )
    };
}