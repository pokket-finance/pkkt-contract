 
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
          name:'Change Settler on Chain?',
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
        settlerAddress: {
          name:'Settler Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
        } ,
        settlerPrivateKey: {
          name: 'Settler Account\'s Private Key',
          format: ' /^[0-9A-Fa-f]{64}$/', 
          required: true,
          hidden: true,
          message: 'Must be a 64 length hex without 0x as prefix', 
          replace: '*',
          conform: function (value) {
            return true;
          }
        }
      }
    };
  
    var storage = getStorage();
    var fileStorage = getFileStorage();  
    
    result = await promptHelper(schema3);    
    if (ownerWallet) {
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
      await hodlBoosterOptionContract.connect(ownerWallet).setSettler(result.settlerAddress);
      console.log( `Change settler of HodlBoosterOption on ${network.name} to ${result.settlerAddress}`)
      var emailer = await getEmailer();
      const emailContent = { 
        to: emailer.emailTos, 
        cc: emailer.emailCcs,
        subject:`Change settler of HodlBoosterOption on ${network.name}`,
        content: `<h3>Change settler of HodlBoosterOption on ${network.name} to <b>${result.settlerAddress}</b></h3>Please keep make sure that account ${result.newOwnerAddress} is fully secured.`,
        isHtml: true
      }  
    }

    await fileStorage.writeValue("settlerAddress", result.settlerAddress); 
    if (result.settlerPrivateKey) { 
      console.log(`Settler private key written to secured storage`); 
      await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
  
  }; 
   

  export default main;
  
   