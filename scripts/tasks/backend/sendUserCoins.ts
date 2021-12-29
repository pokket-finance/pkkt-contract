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
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";

const main = async ({ target }, { ethers, deployments}) => {
    // The first two signers are the deployer and settler so we ignore them
    const [deployer] = await ethers.getSigners();
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock;
    await usdc.transfer(target, BigNumber.from(1000000).mul(USDC_MULTIPLIER)); 
    await wbtc.transfer(target, BigNumber.from(10).mul(WBTC_MULTIPLIER));
    
    await deployer.sendTransaction({
        to: target,
        value: ethers.utils.parseEther("100.0")
    }) ;
     
}

export default main;