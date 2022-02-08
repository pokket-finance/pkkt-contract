/**
 * Writes data to the subgraph manifest
 * Requires the name in subgraph manifest for contracts is the same as the deployment name
 * @param startBlock the block to start indexing data from, if not specified it defaults to 13,600,000
 * @param network the network we are deploying the graph to
 * @param deployments gives us access to deployed smart contracts
 */
declare const main: ({ startblock }: {
    startblock?: number | undefined;
}, { network, deployments }: {
    network: any;
    deployments: any;
}) => Promise<void>;
export default main;
