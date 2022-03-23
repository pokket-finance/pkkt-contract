
import promptHelper from '../helper/promptHelper';
import { getFileStorage } from "../helper/storageHelper";
import {getEmailer} from '../helper/emailHelper';
const main = async ({}, {
    network, ethers, deployments
}) => {   
    var schema = {
        properties: {
          ownerAddress: {
            name:'New Owner Address',
            pattern: /^0x[0-9A-Fa-f]{40}$/,
            message: 'Must be a hex starts with 0x',
            required: true
          }, 
        }
      };

    var  result = await promptHelper(schema); 
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
    await hodlBoosterOptionContract.transferOwnership(result.ownerAddress);
    var fileStorage = getFileStorage();
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    
    console.log(`Transfer ownership of HodlBoosterOption on ${network.name} to ${result.ownerAddress}`);    
    var emailer = await getEmailer();
    const emailContent = { 
      to: emailer.emailTos, 
      cc: emailer.emailCcs,
      subject:`Transfer ownership of HodlBoosterOption on ${network.name}`,
      content: `<h3>Transfer ownership of HodlBoosterOption on ${network.name} to <b>${result.ownerAddress}</b></h3>Please keep make sure that account ${result.ownerAddress} is fully secured.`,
      isHtml: true
  }
  
   await emailer.emailSender.sendEmail(emailContent);

}; 
export default main;

 