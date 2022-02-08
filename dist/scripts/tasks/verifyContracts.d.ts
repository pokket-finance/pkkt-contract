import { TaskArguments } from "hardhat/types";
declare const main: (_taskArgs: TaskArguments, { deployments, network, run, getNamedAccounts }: {
    deployments: any;
    network: any;
    run: any;
    getNamedAccounts: any;
}) => Promise<void>;
export default main;
