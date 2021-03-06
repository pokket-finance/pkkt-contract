
import promptHelper from '../helper/promptHelper';
import { getFileStorage } from "../helper/storageHelper";
import {getEmailer} from '../helper/emailHelper';
import { HardhatRuntimeEnvironment } from "hardhat/types"; 
const main = async ({}, {
  network,
  deployments, 
  run,
  ethers,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {   
   
    var schema = {
        properties: {
          currentOwnerPrivateKey: { 
            name: 'Current Owner Account\'s Private Key',
            format: ' /^[0-9A-Fa-f]{64}$/', 
            required: false,
            hidden: true,
            message: 'Must be a 64 length hex without 0x as prefix', 
            replace: '*',
            conform: function (value) {
              return true;
            }
          },
          newOwnerAddress: {
            name:'New Owner Address',
            pattern: /^0x[0-9A-Fa-f]{40}$/,
            message: 'Must be a hex starts with 0x',
            required: true
          }, 

        }
      };

    var result = await promptHelper(schema); 
    let hodlBoosterOptionContract;
    if (!process.env.USE_PROXY) {
      const hodlBoosterOption = await deployments.get("HodlBoosterOption");  
      hodlBoosterOptionContract = await ethers.getContractAt("HodlBoosterOption", hodlBoosterOption.address); 
    }
    else{
      const optionLifecycle = await deployments.get("OptionLifecycle");
      var hodlBoosterOptionContractFactory = await ethers.getContractFactory("HodlBoosterOptionUpgradeable", {
        libraries: {
          OptionLifecycle: optionLifecycle.address,
        }
      });
      hodlBoosterOptionContract = await hodlBoosterOptionContractFactory.attach(process.env.PROXY_ADDRESS!);
    } 
    const oldOwner = await hodlBoosterOptionContract.owner(); 
    if (oldOwner == result.currentOwnerPrivateKey) {
      console.log("owner is the same, no need to change");
      return;
    }
    
    var ownerWallet = new ethers.Wallet(result.currentOwnerPrivateKey, ethers.provider); 
    //we need to get the owner private key in this case for ownership transfer 
    await hodlBoosterOptionContract.connect(ownerWallet).transferOwnership(result.newOwnerAddress);
    var fileStorage = getFileStorage();
    await fileStorage.writeValue("ownerAddress", result.newOwnerAddress);
    
    console.log(`Transfer ownership of HodlBoosterOption on ${network.name} to ${result.newOwnerAddress}`);    
    var emailer = await getEmailer();
    const emailContent = { 
      to: emailer.emailTos, 
      cc: emailer.emailCcs,
      subject:`Transfer ownership of HodlBoosterOption on ${network.name}`,
      content: `<h3>Transfer ownership of HodlBoosterOption on ${network.name} to <b>${result.newOwnerAddress}</b></h3>Please keep make sure that account ${result.newOwnerAddress} is fully secured.`,
      isHtml: true
  }
  
   await emailer.emailSender.sendEmail(emailContent);

}; 
export default main;

 