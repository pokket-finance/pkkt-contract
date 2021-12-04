import { ethers, upgrades } from "hardhat";

async function main() {
    const gnosisSafe = "0x8c10633bb6933E5850Ff9c38F9699b780029CBEF";
    console.log("Transferring ownership of ProxyAdmin...");
    // The owner of ProxyAdmin can upgrade our contracts
    // To get this to work I had to manually specify gas price and limit
    // For the rinkeby test network in hargat config
    await upgrades.admin.transferProxyAdminOwnership(gnosisSafe);
    console.log(`Transferred ownership of ProxyAdmin to: ${gnosisSafe}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });