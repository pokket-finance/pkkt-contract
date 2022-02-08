declare function main({ command }: {
    command: any;
}, { ethers, deployments, getNamedAccounts }: {
    ethers: any;
    deployments: any;
    getNamedAccounts: any;
}): Promise<void>;
export default main;
