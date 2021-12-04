import { ethers, upgrades } from "hardhat";
import { BigNumber, Signer } from "ethers";
import * as dotenv from "dotenv";  
import { ContractFactory } from "@ethersproject/contracts";
import { deployContract } from "../test/utilities/deploy";
dotenv.config();

const WEI = BigNumber.from(10).pow(18);

const CAP = BigNumber.from(1000).mul(WEI);

async function main() {
    const PKKTToken = await ethers.getContractFactory("PKKTToken");
    console.log("Deploying PKKTToken...");
    const pkktToken = await PKKTToken.deploy("Pokket Token", "PKKT", CAP.toString());
    console.log(`PKKTToken deployed to ${pkktToken.address}`);
    
    const PKKTFarm = await ethers.getContractFactory("PKKTFarm");
    console.log("Deploying PKKTFarm");
    const pkktFarm = await upgrades.deployProxy(
        PKKTFarm as ContractFactory,
        [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK],
        { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true }
    );
    // This is really the proxy address
    console.log(`PKKTFarm deployed to ${pkktFarm.address}`);

    const [deployer] = await ethers.getSigners();

    const vault = await deployContract("Vault", deployer as Signer);
    const PKKTVault = await ethers.getContractFactory("PKKTVault", { signer:deployer as Signer, libraries: { Vault: vault.address } });
    console.log("Deploying PKKTVault");
    const pkktVault = await upgrades.deployProxy(
        PKKTVault as ContractFactory,
        [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK, deployer.address],
        { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true }
    );
    console.log(`PKKTVault deployed to ${pkktVault.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.log(error);
        process.exit(1);
    });