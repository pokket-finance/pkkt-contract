 
import { getStorage, getFileStorage } from "../helper/storageHelper";
import promptHelper from '../helper/promptHelper';
import { ethers } from "ethers";
import {getEmailer} from '../helper/emailHelper';
 
const main = async ({ forcesettlerkey }, {
    network,
    deployments,
    getNamedAccounts,
    ethers
  }) => {  
    let ownerWallet:ethers.Wallet | null = null;
    const schema = {
      properties: {
        changeSettlerOnChain: {
          name:'Change Manager on Chain?',
          pattern:/^Y|y|N|n$/,
          message:'Do you want to change the settler on chain?',
          require:true,
        }
      }
    }
    
    let result = await promptHelper(schema);    
    if (result.changeSettlerOnChain.toLocaleLowerCase() == "y") {
      const schema2 = {
        properties:{
          ownerPrivateKey: { 
            name: 'Owner Account\'s Private Key',
            format: ' /^[0-9A-Fa-f]{64}$/', 
            required: false,
            hidden: true,
            message: 'Must be a 64 length hex without 0x as prefix', 
            replace: '*',
            conform: function (value) {
              return true;
            }
          }
        }
      }
      result = await promptHelper(schema2); 
      ownerWallet = new ethers.Wallet(result.ownerPrivateKey, ethers.provider); 
    }
    const schema3 = {
      properties: { 
        managerAddress: {
          name:'Manager Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
        }
      }
    };
  
    var fileStorage = getFileStorage();  
    
    result = await promptHelper(schema3);    
    if (ownerWallet) {
      let singleDirectionOptionContract;
      if (!process.env.USE_PROXY) {
        const singleDirectionOption = await deployments.get("SingleDirectionOption");  
        singleDirectionOptionContract = await ethers.getContractAt("SingleDirectionOptionStatic", singleDirectionOption.address); 
      }
      else{
        const optionLifecycle = await deployments.get("OptionLifecycle");
        var singleDirectionOptionContractFactory = await ethers.getContractFactory("SingleDirectionOptionUpgradeable", {
          libraries: {
            OptionLifecycle: optionLifecycle.address,
          }
        });
        singleDirectionOptionContract = await singleDirectionOptionContractFactory.attach(process.env.PROXY_ADDRESS!);
      } 
      await singleDirectionOptionContract.connect(ownerWallet).setSettler(result.managerAddress);
      console.log( `Change manager of SingleDirectionOption on ${network.name} to ${result.managerAddress}`)
      var emailer = await getEmailer();
      const emailContent = { 
        to: emailer.emailTos, 
        cc: emailer.emailCcs,
        subject:`Change manager of SingleDirectionOption on ${network.name}`,
        content: `<h3>Change manager of SingleDirectionOption on ${network.name} to <b>${result.managerAddress}</b>`,
        isHtml: true
      }
      
       await emailer.emailSender.sendEmail(emailContent);
    }

    await fileStorage.writeValue("managerAddress", result.managerAddress);
  
  }; 
   

  export default main;
  
   