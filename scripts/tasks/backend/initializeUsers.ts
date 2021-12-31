import { BigNumber, Signer, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    ERC20Mock,
    PKKTHodlBoosterOption,
    OptionVault
} from "../../../typechain";
import {
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER
} from "../../../constants/constants";
import { getDeployedContractHelper } from "./utilities";

const main = async (taskArgs, { ethers, deployments, 
    getNamedAccounts}) => {
    console.log("Initializing users...");
    // The first two signers are the deployer and settler so we ignore them
    const [, , alice, bob] = await ethers.getSigners();
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock;
    const ethHodlBoosterPutOption = await getDeployedContractHelper(
        "ETHHodlBoosterPutOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterPutOption = await getDeployedContractHelper(
        "WBTCHodlBoosterPutOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const users = [alice, bob];
    for (let user of users) {
        
        //console.log(`${user.address} `);
        await usdc.transfer(user.address, BigNumber.from(1000000).mul(USDC_MULTIPLIER));
        await usdc.connect(user as Signer).approve(
            ethHodlBoosterPutOption.address,
            BigNumber.from(1000000).mul(USDC_MULTIPLIER)
        );
        await usdc.connect(user as Signer).approve(
            wbtcHodlBoosterPutOption.address,
            BigNumber.from(1000000).mul(USDC_MULTIPLIER)
        );
        
        await wbtc.transfer(user.address, BigNumber.from(100).mul(WBTC_MULTIPLIER));
        await wbtc.connect(user as Signer).approve(
            wbtcHodlBoosterCallOption.address,
            BigNumber.from(100).mul(WBTC_MULTIPLIER)
        );
        
        // var b = await user.getBalance();
        // console.log(b.toString());
        // await user.sendTransaction({
        //     to: "0x98DC5e836bF40496a5190a02c0c8412505eBE52F",
        //     value: ethers.utils.parseEther("5.0")
        // }) 
    }
}

export default main;