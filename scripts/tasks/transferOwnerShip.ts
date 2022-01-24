const main = async ({ owneraccount }, {
  network,
  deployments,
  getNamedAccounts,
  ethers
}) => { 
    const { deployer } = await getNamedAccounts(); 
    const hodlBoosterOption = await deployments.get("PKKTHodlBoosterOption"); 
    const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", hodlBoosterOption.address);
    await hodlBoosterOptionContract.transferOwnership(owneraccount);
    
    console.log(`Transfer ownership of PKKTHodlBoosterOption on ${network.name} from ${deployer} to ${owneraccount}`);    

}; 
export default main;

 