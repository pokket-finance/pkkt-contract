declare const main: ({ fresh, init, initbackend }: {
    fresh: any;
    init: any;
    initbackend: any;
}, { network, ethers, deployments, getNamedAccounts }: {
    network: any;
    ethers: any;
    deployments: any;
    getNamedAccounts: any;
}) => Promise<void>;
export default main;
