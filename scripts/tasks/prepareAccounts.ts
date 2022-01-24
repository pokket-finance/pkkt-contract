 
import { getStorage, getFileStorage } from "../helper/storageHelper";
import promptHelper from '../helper/promptHelper';
 
const main = async ({ forceSettlerPrivateKey }, {
    network,
    deployments,
    getNamedAccounts,
    ethers
  }) => { 

  
    var schema = {
      properties: {
        deployerAddress: {
          name:'Deployer Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
        },
        deployerPrivateKey: {
          name: 'Deployer Account\'s Private Key',
          format: ' /^[0-9A-Fa-f]{64}$/', 
          required: true,
          hidden: true,
          message: 'Must be a 64 length hex without 0x as prefix', 
          replace: '*',
          conform: function (value) {
            return true;
          }
        }, 
        settlerAddress: {
          name:'Settler Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
        } ,
        settlerPrivateKey: {
          name: 'Settler Account\'s Private Key',
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
    };
    var schema2 = {
      properties: { 
        settlerPrivateKey: {
          name: 'Settler Account\'s Private Key',
          format: ' /^\d{64}$/', 
          required: true,
          message: 'Must be a 64 length hex without 0x as prefix', 
          replace: '*',
          conform: function (value) {
            return true;
          }
        }, 
      }
    };
    var storage = getStorage();
    var fileStorage = getFileStorage();
    var deployerAddress = await fileStorage.readValue("deployerAddress");
    var settlerAddress = await fileStorage.readValue("settlerAddress");
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey");
    if (deployerAddress){
      process.env.DEPLOYER_PUBLIC_KEY = deployerAddress;
    }
    if (deployerPrivateKey){
      process.env.DEPLOYER_PRIVATE_KEY = deployerPrivateKey;
    }
    if (settlerAddress) {
      process.env.SETTLER_PUBLIC_KEY  = settlerAddress;
    }

    if (process.env.DEPLOYER_PUBLIC_KEY && process.env.SETTLER_PUBLIC_KEY && process.env.DEPLOYER_PRIVATE_KEY ){
      console.log(`Deployer Address: ${process.env.DEPLOYER_PUBLIC_KEY}; Settler Address: ${process.env.SETTLER_PUBLIC_KEY}`);
      if (!forceSettlerPrivateKey){
        return;
      }
      else {
        var settlerPrivateKey = await storage.readValue("SETTLER_PRIVATE_KEY");
        if (settlerPrivateKey){
           return;
        }
        var result = await promptHelper(schema2);  
        console.log(`Settler private key written to secured storage`); 
        await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
        return;
      }
    }

    
    result = await promptHelper(schema);   
    console.log(`Deployer Address: ${result.deployerAddress}; Settler Address: ${result.settlerAddress}`);
    process.env.DEPLOYER_PUBLIC_KEY = result.deployerAddress;
    process.env.SETTLER_PUBLIC_KEY = result.settlerAddress;
    process.env.DEPLOYER_PRIVATE_KEY = result.deployerPrivateKey;
    await fileStorage.writeValue("deployerAddress", result.deployerAddress);
    await fileStorage.writeValue("settlerAddress", result.settlerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey);
    await fileStorage.writeValue("ownerAddress", result.deployerAddress);
    if (result.settlerPrivateKey) { 
      console.log(`Settler private key written to secured storage`); 
      await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
  
  }; 
   

  export default main;
  
   