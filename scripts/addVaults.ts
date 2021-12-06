// Script that adds a ERC20Mock vault to a deployed instance of PKKTVault
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { deployContract } from "../test/utilities/deploy";
import { ERC20Mock } from "../typechain";

const main = async (pkktVaultAddress, symbol: string, decimals) => {
    const pkktVaultContract = await ethers.getContractAt("PKKTVault", pkktVaultAddress);
    
    const multiplier = BigNumber.from(10).pow(decimals);
    const [deployer] = await ethers.getSigners();
    const token = await deployContract(
        "ERC20Mock",
        deployer as Signer,
        [`${symbol}Token`, symbol, BigNumber.from(10000).mul(multiplier), decimals]
    ) as ERC20Mock;
    console.log(`Mock ${symbol} deployed to: ${token.address}`);
    const vault = {
        underlying: token.address,
        decimals: decimals
    };
    await pkktVaultContract.add(vault, true);
    console.log(`Added ${symbol} vault to PKKTVault at ${pkktVaultAddress}`);

    await token.transfer(deployer.address, BigNumber.from(100).mul(multiplier));
    await token.connect(deployer as Signer).approve(pkktVaultContract.address, BigNumber.from(100).mul(multiplier));
    await pkktVaultContract.connect(deployer as Signer).deposit(0, BigNumber.from(50).mul(multiplier));
}


main("Insert deployed PKKT Vault address here (rinkeby)", "USDC", 6)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });