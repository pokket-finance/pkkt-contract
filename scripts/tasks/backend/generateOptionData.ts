import { BigNumber, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
    ERC20Mock, 
    PKKTHodlBoosterOption,
} from "../../../typechain";

import {
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    ETH_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution,
    NULL_ADDRESS
} from "../../../constants/constants";
import { getDeployedContractHelper,packOptionParameter } from "./utilities";


async function main({ command }, { ethers, deployments }) {
    console.log("Generating option data...");
    const ETHCALLOPTION = 1;
    const ETHPUTOPTION= 2;
    const WBTCCALLOPTION = 3;
    const WBTCPUTOPTION = 4;
    const [deployer, settler, alice, bob, trader, carol] = await ethers.getSigners();
    const [
        usdc,
        wbtc,
        optionVault 
    ] = await getDeployedContracts(ethers, deployments);
    const users = [alice]

    const ethPrice = 4000 * (10**ETH_PRICE_PRECISION);
    const btcPrice = 50000 * (10**WBTC_PRICE_PRECISION);

    let settleParams = [OptionExecution.NoExecution, OptionExecution.NoExecution
    ];

    let commitParams = [packOptionParameter(ethPrice*1.05, 0.025 * RATIO_MULTIPLIER),
        packOptionParameter(ethPrice*0.95, 0.025 * RATIO_MULTIPLIER),
        packOptionParameter(btcPrice*1.05, 0.025 * RATIO_MULTIPLIER),
        packOptionParameter(btcPrice*0.95, 0.025 * RATIO_MULTIPLIER),
    ];

    // Set Option Parameters
    if (command == 1) {
        // round 1
        await optionVault.connect(settler as Signer).initiateSettlement();

        await deposits();

        // round 2
        await optionVault.connect(settler as Signer).initiateSettlement();

        await deposits();
 
    }
    // initiate settlement
    else if (command == 2) {
        await optionVault.connect(settler as Signer).initiateSettlement();
        await deposits();
    }
    // set settlement parameters
    else if (command == 3) {
        // round 1
        await optionVault.connect(settler as Signer).initiateSettlement();

        await deposits();

        // round 2
        await optionVault.connect(settler as Signer).initiateSettlement();

        await deposits();
 
        await optionVault.connect(settler as Signer).setOptionParameters(commitParams);

        // round 3
        await optionVault.connect(settler as Signer).initiateSettlement();
    }
    // Deposits
    else if (command == 4) {
        await deposits();
    }
    // Right before trader sends money back
    else if (command == 99) {
        /* open round 1*/
        await optionVault.connect(settler as Signer).initiateSettlement();  

        await optionVault.connect(alice as Signer).depositETH(ETHCALLOPTION, { value: BigNumber.from(5).mul(ETH_MULTIPLIER)});
        await optionVault.connect(alice as Signer).deposit(WBTCCALLOPTION, BigNumber.from(2).mul(WBTC_MULTIPLIER));
        await optionVault.connect(carol as Signer).deposit(WBTCCALLOPTION,BigNumber.from(1).mul(WBTC_MULTIPLIER));
        await optionVault.connect(bob as Signer).deposit(ETHPUTOPTION, BigNumber.from(4000).mul(USDC_MULTIPLIER));
        await optionVault.connect(carol as Signer).deposit(ETHPUTOPTION, BigNumber.from(2000).mul(USDC_MULTIPLIER));
        await optionVault.connect(bob as Signer).deposit(WBTCPUTOPTION, BigNumber.from(50000).mul(USDC_MULTIPLIER));
        
        /* open round 2*/
        await optionVault.connect(settler as Signer).initiateSettlement();

        await optionVault.connect(bob as Signer).depositETH(ETHCALLOPTION, { value: BigNumber.from(1).mul(ETH_MULTIPLIER)});
        await optionVault.connect(alice as Signer).deposit(WBTCPUTOPTION,BigNumber.from(100000).mul(USDC_MULTIPLIER));
        await optionVault.connect(carol as Signer).deposit(WBTCPUTOPTION, BigNumber.from(50000).mul(USDC_MULTIPLIER));
        await optionVault.connect(settler as Signer).settle([]);  
    }
    else if (command == 7) {
        await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
        /* open round 3*/
        await optionVault.connect(settler as Signer).initiateSettlement();   
        var balance = await optionVault.connect(alice as Signer).getAccountBalance(ETHCALLOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(alice as Signer).initiateWithraw(ETHCALLOPTION, diff); //5.125 eth with premium
        
        balance = await optionVault.connect(bob as Signer).getAccountBalance(WBTCPUTOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(bob as Signer).initiateWithraw(WBTCPUTOPTION, diff);  //51250.0 usdt with premium 
        
        
        balance = await optionVault.connect(carol as Signer).getAccountBalance(WBTCCALLOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(carol as Signer).initiateWithraw(WBTCCALLOPTION, carol); //1.025 wbtc with premium
        
        await optionVault.connect(settler as Signer).settle([settleParams]);
    }
    else if (command == 8) {
        await optionVault.connect(settler as Signer).setOptionParameters([
            packOptionParameter(ethPrice*1.04, 0.02 * RATIO_MULTIPLIER),
            packOptionParameter(ethPrice*0.96, 0.02 * RATIO_MULTIPLIER),
            packOptionParameter(btcPrice*1.04, 0.02 * RATIO_MULTIPLIER),
            packOptionParameter(btcPrice*0.96, 0.02 * RATIO_MULTIPLIER),]);
            
        /* open round 4*/
        await optionVault.connect(settler as Signer).initiateSettlement();   

        await optionVault.connect(settler as Signer).settle([OptionExecution.ExecuteCall, OptionExecution.NoExecution]);
    } else if (command == 9) {
        await optionVault.connect(settler as Signer).initiateSettlement();   
        var balance = await optionVault.connect(alice as Signer).getAccountBalance(ETHCALLOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(alice as Signer).initiateWithraw(ETHCALLOPTION, diff); //5.125 eth with premium
        
        balance = await optionVault.connect(bob as Signer).getAccountBalance(WBTCPUTOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(bob as Signer).initiateWithraw(WBTCPUTOPTION, diff);  //51250.0 usdt with premium 
        
        
        balance = await optionVault.connect(carol as Signer).getAccountBalance(WBTCCALLOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(carol as Signer).initiateWithraw(WBTCCALLOPTION, carol); //1.025 wbtc with premium
    }

    async function deposits() {
        await optionVault.connect(alice as Signer).depositETH(
            ETHCALLOPTION,
            { value: BigNumber.from(5).mul(ETH_MULTIPLIER) }
        );
        await optionVault.connect(alice as Signer).deposit(
            ETHPUTOPTION,
            BigNumber.from(6000).mul(USDC_MULTIPLIER)
        );
        await optionVault.connect(alice as Signer).deposit(
            WBTCCALLOPTION,
            BigNumber.from(3).mul(WBTC_MULTIPLIER)
        );
        await optionVault.connect(bob as Signer).deposit(
            WBTCPUTOPTION,
            BigNumber.from(50000).mul(USDC_MULTIPLIER)
        );
    }
}

const getDeployedContracts = async (ethers, deployments): Promise<[
    ERC20Mock,
    ERC20Mock, 
    PKKTHodlBoosterOption, 
]> => {
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock; 
    const optionVault = await getDeployedContractHelper(
        "PKKTHodlBoosterOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    
    return [
        usdc,
        wbtc,
        optionVault 
    ];
}

export default main;