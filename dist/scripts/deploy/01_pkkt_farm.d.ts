import { HardhatRuntimeEnvironment } from "hardhat/types";
declare const main: {
    ({ network, deployments, getNamedAccounts, }: HardhatRuntimeEnvironment): Promise<void>;
    tags: string[];
    dependencies: string[];
};
export default main;
