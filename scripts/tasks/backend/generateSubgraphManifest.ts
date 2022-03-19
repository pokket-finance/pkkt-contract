import fs from "fs";
import YAML from "yaml";

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
    const subgraphManifest = fs.readFileSync(subgraphManifestFile, "utf-8");
    let parsedSubgraph = YAML.parse(subgraphManifest);
    let optionName;
    let HodlBoosterOption;
    for (let dataSource of parsedSubgraph.dataSources) {
        optionName = dataSource.name;
        HodlBoosterOption = await deployments.get(optionName);
        dataSource.source.address = HodlBoosterOption.address;
        dataSource.source.startBlock = startblock;
        dataSource.network = networkName;
    }
    let stringSubgraph = YAML.stringify(parsedSubgraph);
    fs.writeFileSync(subgraphManifestFile, stringSubgraph, "utf-8");
}

export default main;