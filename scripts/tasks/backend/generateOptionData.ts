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
import { getDeployedContractHelper } from "./utilities";

async function main({ command }, { ethers, deployments }) {
    console.log("Generating option data...");
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

    let commitParams = [
        {
            strikePrice: ethPrice*1.05,
            pricePrecision: ETH_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterCallOption.address
          },  
          {
            strikePrice: ethPrice*0.95,
            pricePrecision: ETH_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterPutOption.address
          },
          {
            strikePrice: btcPrice*1.05,
            pricePrecision: WBTC_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterCallOption.address
          }, 
          {
            strikePrice: btcPrice * 0.95,
            pricePrecision: WBTC_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterPutOption.address
          },
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
    // empty settle
    else if (command == 5 ) {
        await optionVault.connect(settler as Signer).initiateSettlement();
        await deposits();
        await optionVault.connect(settler as Signer).settle([]);
    }
    // Right before trader sends money back
    else if (command == 6) {
        /* open round 1*/
        await optionVault.connect(settler as Signer).initiateSettlement();  

        await ethHodlBoosterCallOption.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETH_MULTIPLIER)});
        await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTC_MULTIPLIER));
        await wbtcHodlBoosterCallOption.connect(carol as Signer).deposit(BigNumber.from(1).mul(WBTC_MULTIPLIER));
        await ethHodlBoosterPutOption.connect(bob as Signer).deposit(BigNumber.from(4000).mul(USDC_MULTIPLIER));
        await ethHodlBoosterPutOption.connect(carol as Signer).deposit(BigNumber.from(2000).mul(USDC_MULTIPLIER));
        await wbtcHodlBoosterPutOption.connect(bob as Signer).deposit(BigNumber.from(50000).mul(USDC_MULTIPLIER));
        
        /* open round 2*/
        await optionVault.connect(settler as Signer).initiateSettlement();

        await ethHodlBoosterCallOption.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETH_MULTIPLIER)});
        await wbtcHodlBoosterPutOption.connect(alice as Signer).deposit(BigNumber.from(100000).mul(USDC_MULTIPLIER));
        await wbtcHodlBoosterPutOption.connect(carol as Signer).deposit(BigNumber.from(50000).mul(USDC_MULTIPLIER));
        await optionVault.connect(settler as Signer).settle([]);  
    }
    else if (command == 7) {
        await optionVault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice*1.05,
              pricePrecision:ETH_PRICE_PRECISION,
              premiumRate: 0.025 * RATIO_MULTIPLIER,
              option: ethHodlBoosterCallOption.address
            },  
            {
              strikePrice:ethPrice*0.95,
              pricePrecision:ETH_PRICE_PRECISION,
              premiumRate: 0.025 * RATIO_MULTIPLIER,
              option: ethHodlBoosterPutOption.address
            },
            {
              strikePrice:btcPrice*1.05,
              pricePrecision:WBTC_PRICE_PRECISION,
              premiumRate: 0.025 * RATIO_MULTIPLIER,
              option: wbtcHodlBoosterCallOption.address
            }, 
            {
              strikePrice:btcPrice * 0.95,
              pricePrecision:WBTC_PRICE_PRECISION,
              premiumRate: 0.025 * RATIO_MULTIPLIER,
              option: wbtcHodlBoosterPutOption.address
            },
        ]);
        /* open round 3*/
        await optionVault.connect(settler as Signer).initiateSettlement();   
        await ethHodlBoosterCallOption.connect(alice as Signer).maxInitiateWithdraw(); //5.125 eth with premium
        await wbtcHodlBoosterPutOption.connect(bob as Signer).maxInitiateWithdraw();  //51250.0 usdt with premium 
        await wbtcHodlBoosterCallOption.connect(carol as Signer).maxInitiateWithdraw(); //1.025 wbtc with premium
        await optionVault.connect(settler as Signer).settle([{
            callOption: ethHodlBoosterCallOption.address,
            putOption: ethHodlBoosterPutOption.address,
            execute: OptionExecution.NoExecution
        }, 
        {
            callOption: wbtcHodlBoosterCallOption.address,
            putOption: wbtcHodlBoosterPutOption.address,
            execute: OptionExecution.NoExecution
        }]);
    }
    else if (command == 8) {
        await optionVault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice*1.04,
              pricePrecision:ETH_PRICE_PRECISION,
              premiumRate: 0.02 * RATIO_MULTIPLIER,
              option: ethHodlBoosterCallOption.address
            },  
            {
              strikePrice:ethPrice*0.96,
              pricePrecision:ETH_PRICE_PRECISION,
              premiumRate: 0.02 * RATIO_MULTIPLIER,
              option: ethHodlBoosterPutOption.address
            },
            {
              strikePrice:btcPrice*1.04,
              pricePrecision:WBTC_PRICE_PRECISION,
              premiumRate: 0.02 * RATIO_MULTIPLIER,
              option: wbtcHodlBoosterCallOption.address
            }, 
            {
              strikePrice:btcPrice * 0.96,
              pricePrecision:WBTC_PRICE_PRECISION,
              premiumRate: 0.02 * RATIO_MULTIPLIER,
              option: wbtcHodlBoosterPutOption.address
            },
        ]);
            
        /* open round 4*/
        await optionVault.connect(settler as Signer).initiateSettlement();   

        await optionVault.connect(settler as Signer).settle([{
        callOption: ethHodlBoosterCallOption.address,
        putOption: ethHodlBoosterPutOption.address,
        execute: OptionExecution.ExecuteCall
        }, 
        {
        callOption: wbtcHodlBoosterCallOption.address,
        putOption: wbtcHodlBoosterPutOption.address,
        execute: OptionExecution.NoExecution
        }]);
    } else if (command == 9) {
        await optionVault.connect(settler as Signer).initiateSettlement();   
        await ethHodlBoosterCallOption.connect(alice as Signer).maxInitiateWithdraw(); //5.125 eth with premium
        await wbtcHodlBoosterPutOption.connect(bob as Signer).maxInitiateWithdraw();  //51250.0 usdt with premium 
        await wbtcHodlBoosterCallOption.connect(carol as Signer).maxInitiateWithdraw(); //1.025 wbtc with premium
    }

    async function deposits() {
        await ethHodlBoosterCallOption.connect(alice as Signer).depositETH(
            { value: BigNumber.from(5).mul(ETH_MULTIPLIER) }
        );
        await ethHodlBoosterPutOption.connect(alice as Signer).deposit(
            BigNumber.from(6000).mul(USDC_MULTIPLIER)
        );
        await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
            BigNumber.from(3).mul(WBTC_MULTIPLIER)
        );
        await wbtcHodlBoosterPutOption.connect(bob as Signer).deposit(
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