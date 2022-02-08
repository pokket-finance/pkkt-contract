"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main = async ({ proxyname, implname, libraryname }, { deployments, getNamedAccounts }) => {
    const { deploy, catchUnknownSigner } = deployments;
    const { deployer, owner } = await getNamedAccounts();
    const library = await deployments.get(libraryname);
    // Upgrade the proxied implementation
    console.log("Deploying new implementation and proposing upgrade...");
    await catchUnknownSigner(deploy(proxyname, {
        from: deployer,
        contract: implname,
        proxy: {
            owner: owner,
            proxyContract: "OpenZeppelinTransparentProxy",
        },
        libraries: {
            [libraryname]: library.address,
        },
    }));
};
exports.default = main;
