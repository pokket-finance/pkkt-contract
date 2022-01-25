 
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
    const previousRound = await hodlBoosterOptionContract.currentRound();
    console.log(`PKKTHodlBoosterOption is currently under ${previousRound} epoch`);
    await hodlBoosterOptionContract.connect(settlerWallet).initiateSettlement();
    console.log("Initiated new epoch upon PKKTHodlBoosterOption");
    //wait for longer
    //await new Promise(resolve => setTimeout(resolve, parseInt(process.env.NETWORK_DELAY?? "10000"))); 
    const currentRound = previousRound + 1;
    console.log(`Initiate settlment for epoch ${currentRound} upon PKKTHodlBoosterOption on ${network.name} by ${settler}`);    

    var emailer = await getEmailer();
    const emailContent = { 
      to: emailer.emailTos, 
      cc: emailer.emailCcs,
      subject:`Start new round for PKKTHodlBoosterOption on ${network.name}`,
      content: `Start new epoch for PKKTHodlBoosterOption on ${network.name}</br>Current epoch number is <b>${currentRound}</b>.</br>Please visit <a href="${process.env.TRADER_SITE}">Trader Site</a> with account ${settler} for more details.`,
      isHtml: true
  }
  
   await emailer.emailSender.sendEmail(emailContent);

}; 
export default main;

 