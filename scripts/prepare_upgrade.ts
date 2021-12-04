import { ContractFactory } from "@ethersproject/contracts";
import { ethers, upgrades } from "hardhat";

async function main() {
    // TODO avoid hardcoding this address
    const proxyAddress = "0x430Ae5D7D6e5d8BA1Ad47857CAFF8E5fe760053f";
    const PKKTFarmV2Test = await ethers.getContractFactory("PKKTFarmV2Test");
    console.log("Preparing to upgrade...");
    const pkktFarmV2TestAddress = await upgrades.prepareUpgrade(proxyAddress, PKKTFarmV2Test as ContractFactory,  { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true });
    console.log(`PKKTFarmV2Test at: ${pkktFarmV2TestAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });