import { BigNumber, Signer, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    ERC20Mock,
    PKKTHodlBoosterOption,
    OptionVault
} from "../../../typechain";
import {
    CHAINID,
    ETH_MULTIPLIER,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER
} from "../../../constants/constants";
import { getDeployedContractHelper } from "./utilities";
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";

const main = async ({ target }, { network, ethers, deployments}) => {
    // The first two signers are the deployer and settler so we ignore them
    const [deployer] = await ethers.getSigners();
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock;
    await usdc.transfer(target, BigNumber.from(1000000).mul(USDC_MULTIPLIER)); 
    console.log("Send 1000000 usdc to " + target);
    await wbtc.transfer(target, BigNumber.from(10).mul(WBTC_MULTIPLIER));
    console.log("Send 10 wbtc to " + target);
     
     if (network.name === "hardhat")
     {
        await deployer.sendTransaction({
            to: target,
            value: ethers.utils.parseEther("100.0")
        }) ;
        console.log("Send 100 eth to " + target);
     }
     else if (network.config.chainId == CHAINID.BSC_TESTNET){
         
        const eth = await getDeployedContractHelper("ETH", ethers, deployments) as ERC20Mock; 
        await eth.transfer(target, BigNumber.from(100).mul(ETH_MULTIPLIER));
        console.log("Send 100 eth to " + target);
     }

     
}

export default main;