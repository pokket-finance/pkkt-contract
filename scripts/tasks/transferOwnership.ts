
/**
 * Transfers the Proxy Admin ownership to the address given by account
 * This task can be run from the command line: npx hardhat transfer-ownership --account 0x...
 * @param account address of the account to transfer ownership 
 * @param upgrades openzeppelin upgrades library injected from config file 
 */
const main = async ({ account }, { upgrades }) => {
    console.log("Transferring ownership of ProxyAdmin...");
    // The owner of ProxyAdmin can upgrade our contracts
    // To get this to work I had to manually specify gas price and limit
    // For the rinkeby test network in harhat config
    await upgrades.admin.transferProxyAdminOwnership(account);
    console.log(`Transferred ownership of ProxyAdmin to: ${account}`);
}

export default main;
