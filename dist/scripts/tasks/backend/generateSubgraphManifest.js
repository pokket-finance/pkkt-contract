"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
/**
 * Writes data to the subgraph manifest
 * Requires the name in subgraph manifest for contracts is the same as the deployment name
 * @param startBlock the block to start indexing data from, if not specified it defaults to 13,600,000
 * @param network the network we are deploying the graph to
 * @param deployments gives us access to deployed smart contracts
 */
const main = async ({ startblock = 13600000 }, { network, deployments }) => {
    const networkName = network.name === "rinkeby" ? network.name : "mainnet";
    const subgraphManifestFile = "./subgraph.yaml";
    const subgraphManifest = fs_1.default.readFileSync(subgraphManifestFile, "utf-8");
    let parsedSubgraph = yaml_1.default.parse(subgraphManifest);
    let optionName;
    let PKKTHodlBoosterOption;
    for (let dataSource of parsedSubgraph.dataSources) {
        optionName = dataSource.name;
        PKKTHodlBoosterOption = await deployments.get(optionName);
        dataSource.source.address = PKKTHodlBoosterOption.address;
        dataSource.source.startBlock = startblock;
        dataSource.network = networkName;
    }
    let stringSubgraph = yaml_1.default.stringify(parsedSubgraph);
    fs_1.default.writeFileSync(subgraphManifestFile, stringSubgraph, "utf-8");
};
exports.default = main;
