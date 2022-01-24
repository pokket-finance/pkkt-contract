 
import { getStorage } from "../helper/storageHelper";

const main = async ({}, {
  network,
  deployments,
  getNamedAccounts,
  ethers
}) => { 
  
    const { settler } = await getNamedAccounts(); 
    var storage = getStorage(); 
    var privateKey =  (await storage.readValue("SETTLER_PRIVATE_KEY")) as string;
    if (!privateKey) {
        console.error("Failed to find SETTLER_PRIVATE_KEY");
        return;
    }
    privateKey = privateKey.startsWith("0x") ? privateKey : ("0x" + privateKey);  
    var settlerWallet = new ethers.Wallet(privateKey, ethers.provider);

    const hodlBoosterOption = await deployments.get("PKKTHodlBoosterOption"); 
    const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", hodlBoosterOption.address);
    await hodlBoosterOptionContract.connect(settlerWallet).initiateSettlement();
    const currentRound = await hodlBoosterOptionContract.currentRound();
    
    console.log(`Initiate settlment for ${currentRound} round upon PKKTHodlBoosterOption on ${network.name} by ${settler}`);    

}; 
export default main;

 