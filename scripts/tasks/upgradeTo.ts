const main = async ({ proxyname, implname, libraryname }, { deployments, getNamedAccounts }) => {
    const library = await deployments.get(libraryname);
    const { deploy } = deployments;
    const { deployer, owner } = await getNamedAccounts();
    
    // Actually deploy the upgrade
    console.log("Upgrading contract...");
    const pkktFarmV2Test = await deploy(proxyname, {
        from: deployer,
        contract: implname,
        proxy: {
          owner: owner,
          proxyContract: "OpenZeppelinTransparentProxy",
        },
        libraries: {
          libraryname: library.address,
        },
    });

    console.log(`New implmentation deployed at: ${pkktFarmV2Test.address}`);
}

export default main;