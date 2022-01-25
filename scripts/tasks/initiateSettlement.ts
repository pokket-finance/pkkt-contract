 
import { getStorage } from "../helper/storageHelper";
import {getEmailer} from '../helper/emailHelper';

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

    var emailer = await getEmailer();
    const emailContent = { 
      to: emailer.emailReceivers, 
      cc: [],
      subject:`Start new round for PKKTHodlBoosterOption on ${network.name}`,
      content: `Start new round for PKKTHodlBoosterOption on ${network.name}</br>Currently <b>Round ${currentRound}</b></br>Please visit <a href="${process.env.TRADER_SITE}">Trader Site</a> with account ${settler} for more details.`,
      isHtml: true
  }
  
   await emailer.emailSender.sendEmail(emailContent);

}; 
export default main;

 