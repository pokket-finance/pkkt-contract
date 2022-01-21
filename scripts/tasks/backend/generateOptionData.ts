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
    NULL_ADDRESS,
    WBTC_USDC_OPTION_ID
} from "../../../constants/constants";
import { getDeployedContractHelper,packOptionParameter } from "./utilities"; 


async function main({ command }, { ethers, deployments, getNamedAccounts }) {
    console.log("Generating option data...");
    const ETHCALLOPTION = 1;
    const ETHPUTOPTION= 2;
    const WBTCCALLOPTION = 3;
    const WBTCPUTOPTION = 4;
    let [, , alice, bob, trader, carol] = await ethers.getSigners();
    let { settler } = await getNamedAccounts();
    settler = await ethers.getSigner(settler);
    let { deployer } = await getNamedAccounts();
    deployer = await ethers.getSigner(deployer);
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

    if (command == 20) {
        await optionVault.connect(settler as Signer).settle([OptionExecution.ExecuteCall, OptionExecution.ExecuteCall]);
    }

    // 30000000000
    // Set Option Parameters
    if (command == 1) {
        // round 1
        // let gasPrice = await ethers.provider.getGasPrice();
        // console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
        await optionVault.connect(settler as Signer).initiateSettlement({ gasPrice: 30000000000 });
        //
        //await optionVault.connect(settler as Signer).initiateSettlement();
        // const ethPrice = 4000 * (10**ETH_PRICE_PRECISION);
        // const btcPrice = 50000 * (10**WBTC_PRICE_PRECISION);
        // //set the strikeprice and premium of user deposits collected in round 1
        // await optionVault.connect(settler as Signer).setOptionParameters([
        // packOptionParameter(ethPrice*1.05, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(ethPrice*0.95, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(btcPrice*1.05, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(btcPrice* 0.95, 0.025 * RATIO_MULTIPLIER)
        // ]);

        // /* open round 3*/
        // await optionVault.connect(settler as Signer).initiateSettlement();
        //await optionVault.connect(settler as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
    }
    // initiate settlement
    else if (command == 2) {
        // await optionVault.connect(settler as Signer).initiateSettlement();
        let gasPrice = await ethers.provider.getGasPrice();
        console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
        await usdc.connect(deployer as Signer).approve(
            optionVault.address,
            BigNumber.from(1000000).mul(USDC_MULTIPLIER),
            { gasPrice }
        );
        await wbtc.connect(deployer as Signer).approve(
            optionVault.address,
            BigNumber.from(10).mul(WBTC_MULTIPLIER),
            { gasPrice }
        );
        //await deposits();

        // await optionVault.connect(alice as Signer).depositETH(ETHCALLOPTION, { value: BigNumber.from(5).mul(ETH_MULTIPLIER)});
        // await optionVault.connect(alice as Signer).deposit(WBTCCALLOPTION, BigNumber.from(2).mul(WBTC_MULTIPLIER));
        // await optionVault.connect(carol as Signer).deposit(WBTCCALLOPTION, BigNumber.from(1).mul(WBTC_MULTIPLIER));
        // await optionVault.connect(bob as Signer).deposit(ETHPUTOPTION, BigNumber.from(4000).mul(USDC_MULTIPLIER));
        // await optionVault.connect(carol as Signer).deposit(ETHPUTOPTION, BigNumber.from(2000).mul(USDC_MULTIPLIER));
        // await optionVault.connect(bob as Signer).deposit(WBTCPUTOPTION, BigNumber.from(50000).mul(USDC_MULTIPLIER));
        
        // await optionVault.connect(settler as Signer).initiateSettlement();
        // await optionVault.connect(bob as Signer).depositETH(ETHCALLOPTION , { value: BigNumber.from(1).mul(ETH_MULTIPLIER)});
        // await optionVault.connect(alice as Signer).deposit(WBTCPUTOPTION, BigNumber.from(100000).mul(USDC_MULTIPLIER));
        // await optionVault.connect(carol as Signer).deposit(WBTCPUTOPTION, BigNumber.from(50000).mul(USDC_MULTIPLIER));
        
        // const ethPrice = 4000 * (10**ETH_PRICE_PRECISION);
        // const btcPrice = 50000 * (10**WBTC_PRICE_PRECISION);
        // //set the strikeprice and premium of user deposits collected in round 1
        // await optionVault.connect(settler as Signer).setOptionParameters([
        // packOptionParameter(ethPrice*1.05, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(ethPrice*0.95, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(btcPrice*1.05, 0.025 * RATIO_MULTIPLIER), 
        // packOptionParameter(btcPrice* 0.95, 0.025 * RATIO_MULTIPLIER)
        // ]);

        // /* open round 3*/
        // await optionVault.connect(settler as Signer).initiateSettlement();
        
        // var balance = await optionVault.connect(alice as Signer).getAccountBalance(ETHCALLOPTION);
        // await optionVault.connect(alice as Signer).initiateWithraw(
        //     ETHCALLOPTION, 
        //     balance.lockedDepositAssetAmount
        //         .sub(balance.toTerminateDepositAssetAmount)
        // );
        // var balance2 = await optionVault.connect(bob as Signer).getAccountBalance(WBTCPUTOPTION);
        // await optionVault.connect(bob as Signer).initiateWithraw(
        //     WBTCPUTOPTION, 
        //     balance2.lockedDepositAssetAmount
        //         .sub(balance2.toTerminateDepositAssetAmount)
        // );  //51250.0 usdt with premium 
        // var balance3 = await optionVault.connect(carol as Signer).getAccountBalance(WBTCCALLOPTION);
        // await optionVault.connect(carol as Signer).initiateWithraw(
        //     WBTCCALLOPTION, 
        //     balance3.lockedDepositAssetAmount
        //         .sub(balance3.toTerminateDepositAssetAmount)
        // );

       // await optionVault.connect(settler as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
    }
    // set settlement parameters
    else if (command == 3) {
        // let gasPrice = await ethers.provider.getGasPrice();
        // console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
        // await optionVault.connect(deployer as Signer).deposit(WBTCCALLOPTION, BigNumber.from(1).mul(WBTC_MULTIPLIER), { gasPrice });
        // await optionVault.connect(deployer as Signer).deposit(WBTCPUTOPTION, BigNumber.from(50000).mul(USDC_MULTIPLIER))
        await optionVault.connect(deployer as Signer).depositETH(ETHCALLOPTION, { value: BigNumber.from(1).mul(ETH_MULTIPLIER), gasPrice: 30000000000 });

        // await optionVault.connect(settler as Signer).setOptionParameters([
        //     packOptionParameter(ethPrice*1.04, 0.02 * RATIO_MULTIPLIER), 
        //     packOptionParameter(ethPrice*0.96, 0.02 * RATIO_MULTIPLIER), 
        //     packOptionParameter(btcPrice*1.04, 0.02 * RATIO_MULTIPLIER), 
        //     packOptionParameter(btcPrice* 0.96, 0.02 * RATIO_MULTIPLIER)
        // ]);
            
        // /* open round 4*/
        // await optionVault.connect(settler as Signer).initiateSettlement();
        // await optionVault.connect(settler as Signer).settle([OptionExecution.ExecuteCall, OptionExecution.NoExecution])
        // await optionVault.connect(settler as Signer).setOptionParameters([

        //     packOptionParameter(ethPrice*1.03, 0.01 * RATIO_MULTIPLIER), 
        //     packOptionParameter(ethPrice*0.97, 0.01 * RATIO_MULTIPLIER), 
        //     packOptionParameter(btcPrice*1.03, 0.01 * RATIO_MULTIPLIER), 
        //     packOptionParameter(btcPrice* 0.97, 0.01 * RATIO_MULTIPLIER)
        //     ]); 
        // await optionVault.connect(settler as Signer).initiateSettlement();
        // await optionVault.connect(settler as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution])
    }
    // Deposits
    else if (command == 4) {
        var balance = await optionVault.connect(deployer as Signer).getAccountBalance(WBTCCALLOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(deployer as Signer).initiateWithraw(WBTCCALLOPTION, diff, { gasPrice: 30000000000 }); 

        var balance = await optionVault.connect(deployer as Signer).getAccountBalance(WBTCPUTOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        await optionVault.connect(deployer as Signer).initiateWithraw(WBTCPUTOPTION, diff, { gasPrice: 30000000000 }); 

        // var balance = await optionVault.connect(deployer as Signer).getAccountBalance(ETHCALLOPTION);
        // var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        // await optionVault.connect(deployer as Signer).initiateWithraw(ETHCALLOPTION, diff, { gasPrice: 30000000000 }); 
    }
    else if (command == 5) {
        await optionVault.connect(settler as Signer).settle([OptionExecution.ExecuteCall, OptionExecution.ExecuteCall], { gasPrice: 30000000000 });
    }
    else if (command == 6) {
        await settler.sendTransaction({
            to: optionVault.address,
            value: BigNumber.from(1).mul(ETH_MULTIPLIER), 
        });

        await wbtc.connect(settler as Signer).transfer(optionVault.address, BigNumber.from(1).mul(WBTC_MULTIPLIER));

        await usdc.connect(settler as Signer).transfer(optionVault.address, BigNumber.from(50000).mul(USDC_MULTIPLIER));
    }
    // Right before trader sends money back
    else if (command == 99) {
       await ethers.provider.send("evm_mine");
    }
    else if (command == 7) {
        var accountBalance = await optionVault.connect(deployer as Signer).getAccountBalance(WBTCCALLOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(WBTCCALLOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(WBTCCALLOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }

        var accountBalance = await optionVault.connect(deployer as Signer).getAccountBalance(WBTCPUTOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(WBTCPUTOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(WBTCPUTOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }

        var accountBalance = await optionVault.connect(deployer as Signer).getAccountBalance(ETHCALLOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(ETHCALLOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer as Signer).withdraw(ETHCALLOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }
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
    else if (command == 10){
        
        await optionVault.connect(settler as Signer).initiateSettlement();
    }
    else if (command == 11){
        await optionVault.connect(settler as Signer).settle(settleParams);
        await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
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