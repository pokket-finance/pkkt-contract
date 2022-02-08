"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("../../../constants/constants");
const utilities_1 = require("./utilities");
//import { settlerWallet } from "../../../server/utilities/utilities";
async function main({ command }, { ethers, deployments, getNamedAccounts }) {
    console.log("Generating option data...");
    const ETHCALLOPTION = 1;
    const ETHPUTOPTION = 2;
    const WBTCCALLOPTION = 3;
    const WBTCPUTOPTION = 4;
    let [, , alice, bob, trader, carol] = await ethers.getSigners();
    let { settler } = await getNamedAccounts();
    settler = await ethers.getSigner(settler);
    let { deployer } = await getNamedAccounts();
    deployer = await ethers.getSigner(deployer);
    const [usdc, wbtc, optionVault] = await getDeployedContracts(ethers, deployments);
    const users = [alice];
    const ethPrice = 4000 * (10 ** constants_1.ETH_PRICE_PRECISION);
    const btcPrice = 50000 * (10 ** constants_1.WBTC_PRICE_PRECISION);
    let settleParams = [constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution
    ];
    let commitParams = [(0, utilities_1.packOptionParameter)(ethPrice * 1.05, 0.025 * constants_1.RATIO_MULTIPLIER),
        (0, utilities_1.packOptionParameter)(ethPrice * 0.95, 0.025 * constants_1.RATIO_MULTIPLIER),
        (0, utilities_1.packOptionParameter)(btcPrice * 1.05, 0.025 * constants_1.RATIO_MULTIPLIER),
        (0, utilities_1.packOptionParameter)(btcPrice * 0.95, 0.025 * constants_1.RATIO_MULTIPLIER),
    ];
    if (command == 20) {
        await optionVault.connect(settler).settle([0, 1], { gasPrice: 50000000000, gasLimit: 2100000 });
    }
    // 30000000000
    // Set Option Parameters
    if (command == 1) {
        // round 1
        // let gasPrice = await ethers.provider.getGasPrice();
        // console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
        await optionVault.connect(settler).initiateSettlement({ gasPrice: 50000000000, gasLimit: 2100000 });
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
        // console.log(ethers.utils.formatUnits(gasPrice, "gwei"));
        await usdc.connect(settler).approve(optionVault.address, ethers_1.BigNumber.from(100000000000).mul(constants_1.USDC_MULTIPLIER), { gasPrice });
        await wbtc.connect(settler).approve(optionVault.address, ethers_1.BigNumber.from(100000000000).mul(constants_1.WBTC_MULTIPLIER), { gasPrice });
        await optionVault.connect(deployer).deposit(WBTCCALLOPTION, ethers_1.BigNumber.from(1).mul(constants_1.WBTC_MULTIPLIER), { gasPrice: 50000000000, gasLimit: 2100000 });
        await optionVault.connect(deployer).deposit(WBTCPUTOPTION, ethers_1.BigNumber.from(5000).mul(constants_1.USDC_MULTIPLIER), { gasPrice: 50000000000, gasLimit: 2100000 });
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
        await optionVault.connect(deployer).deposit(WBTCCALLOPTION, ethers_1.BigNumber.from(1).mul(constants_1.WBTC_MULTIPLIER), { gasPrice: 50000000000, gasLimit: 2100000 });
        await optionVault.connect(deployer).deposit(WBTCPUTOPTION, ethers_1.BigNumber.from(5000).mul(constants_1.USDC_MULTIPLIER), { gasPrice: 50000000000, gasLimit: 2100000 });
        await optionVault.connect(deployer).depositETH(ETHCALLOPTION, { value: ethers_1.BigNumber.from(1).mul(constants_1.ETH_MULTIPLIER), gasPrice: 50000000000, gasLimit: 2100000 });
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
        var balance = await optionVault.connect(deployer).getAccountBalance(WBTCCALLOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
        await optionVault.connect(settler).initiateWithraw(WBTCCALLOPTION, diff, { gasPrice: 50000000000, gasLimit: 2100000 });
        var balance = await optionVault.connect(deployer).getAccountBalance(WBTCPUTOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
        await optionVault.connect(settler).initiateWithraw(WBTCPUTOPTION, diff, { gasPrice: 50000000000, gasLimit: 2100000 });
        // var balance = await optionVault.connect(deployer as Signer).getAccountBalance(ETHCALLOPTION);
        // var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
        // await optionVault.connect(deployer as Signer).initiateWithraw(ETHCALLOPTION, diff, { gasPrice: 30000000000 }); 
    }
    else if (command == 5) {
        await optionVault.connect(settler).settle([constants_1.OptionExecution.ExecuteCall, constants_1.OptionExecution.ExecuteCall], { gasPrice: 30000000000 });
    }
    else if (command == 6) {
        await settler.sendTransaction({
            to: optionVault.address,
            value: ethers_1.BigNumber.from(1).mul(constants_1.ETH_MULTIPLIER),
        });
        await wbtc.connect(settler).transfer(optionVault.address, ethers_1.BigNumber.from(1).mul(constants_1.WBTC_MULTIPLIER));
        await usdc.connect(settler).transfer(optionVault.address, ethers_1.BigNumber.from(50000).mul(constants_1.USDC_MULTIPLIER));
    }
    // Right before trader sends money back
    else if (command == 99) {
        await ethers.provider.send("evm_mine");
    }
    else if (command == 7) {
        var accountBalance = await optionVault.connect(deployer).getAccountBalance(WBTCCALLOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(WBTCCALLOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(WBTCCALLOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }
        var accountBalance = await optionVault.connect(deployer).getAccountBalance(WBTCPUTOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(WBTCPUTOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(WBTCPUTOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }
        var accountBalance = await optionVault.connect(deployer).getAccountBalance(ETHCALLOPTION);
        if (accountBalance.releasedDepositAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(ETHCALLOPTION, accountBalance.releasedDepositAssetAmount, wbtc.address, { gasPrice: 30000000000 });
        }
        if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
            await optionVault.connect(deployer).withdraw(ETHCALLOPTION, accountBalance.releasedCounterPartyAssetAmount, usdc.address, { gasPrice: 30000000000 });
        }
    }
    else if (command == 8) {
        await optionVault.connect(settler).setOptionParameters([
            (0, utilities_1.packOptionParameter)(ethPrice * 1.04, 0.02 * constants_1.RATIO_MULTIPLIER),
            (0, utilities_1.packOptionParameter)(ethPrice * 0.96, 0.02 * constants_1.RATIO_MULTIPLIER),
            (0, utilities_1.packOptionParameter)(btcPrice * 1.04, 0.02 * constants_1.RATIO_MULTIPLIER),
            (0, utilities_1.packOptionParameter)(btcPrice * 0.96, 0.02 * constants_1.RATIO_MULTIPLIER),
        ]);
        /* open round 4*/
        await optionVault.connect(settler).initiateSettlement();
        await optionVault.connect(settler).settle([constants_1.OptionExecution.ExecuteCall, constants_1.OptionExecution.NoExecution]);
    }
    else if (command == 9) {
        await optionVault.connect(settler).initiateSettlement();
        var balance = await optionVault.connect(alice).getAccountBalance(ETHCALLOPTION);
        var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
        await optionVault.connect(alice).initiateWithraw(ETHCALLOPTION, diff); //5.125 eth with premium
        balance = await optionVault.connect(bob).getAccountBalance(WBTCPUTOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
        await optionVault.connect(bob).initiateWithraw(WBTCPUTOPTION, diff); //51250.0 usdt with premium 
        balance = await optionVault.connect(carol).getAccountBalance(WBTCCALLOPTION);
        diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
        await optionVault.connect(carol).initiateWithraw(WBTCCALLOPTION, carol); //1.025 wbtc with premium
    }
    else if (command == 10) {
        await optionVault.connect(settler).initiateSettlement();
    }
    else if (command == 11) {
        await optionVault.connect(settler).settle(settleParams);
        await optionVault.connect(settler).setOptionParameters(commitParams);
    }
    async function deposits() {
        await optionVault.connect(alice).depositETH(ETHCALLOPTION, { value: ethers_1.BigNumber.from(5).mul(constants_1.ETH_MULTIPLIER) });
        await optionVault.connect(alice).deposit(ETHPUTOPTION, ethers_1.BigNumber.from(6000).mul(constants_1.USDC_MULTIPLIER));
        await optionVault.connect(alice).deposit(WBTCCALLOPTION, ethers_1.BigNumber.from(3).mul(constants_1.WBTC_MULTIPLIER));
        await optionVault.connect(bob).deposit(WBTCPUTOPTION, ethers_1.BigNumber.from(50000).mul(constants_1.USDC_MULTIPLIER));
    }
}
const getDeployedContracts = async (ethers, deployments) => {
    const usdc = await (0, utilities_1.getDeployedContractHelper)("USDC", ethers, deployments);
    const wbtc = await (0, utilities_1.getDeployedContractHelper)("WBTC", ethers, deployments);
    const optionVault = await (0, utilities_1.getDeployedContractHelper)("PKKTHodlBoosterOption", ethers, deployments);
    return [
        usdc,
        wbtc,
        optionVault
    ];
};
exports.default = main;
