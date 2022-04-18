 
import { getStorage, getFileStorage } from "../helper/storageHelper";
import promptHelper from '../helper/promptHelper';
import * as dotenv from "dotenv";
dotenv.config();

const main = async ({ forcesettlerkey }, {
    network,
    deployments,
    getNamedAccounts,
    ethers
  }) => { 

    if (process.env.FROM_SECURE_STORAGE) {

      var storage = getStorage();
      var fileStorage = getFileStorage();
 
      var ownerAddress = await fileStorage.readValue("ownerAddress");
      var settlerPrivateKey = await storage.readValue("settlerPrivateKey");
      var adminAddress = process.env.USE_PROXY ? await storage.readValue("adminAddress") : null;
      var deployerPrivateKey = await storage.readValue("deployerPrivateKey"); 
      var deployerAddress = deployerPrivateKey ? (await new ethers.Wallet(deployerPrivateKey, network.provider)).getAddress() : null;
      var settlerAddress = settlerPrivateKey ? (await new ethers.Wallet(settlerPrivateKey, network.provider)).getAddress() : null;
      if (!deployerAddress) {
        console.error('deployerPrivateKey missing')
        return;
      } 
      if (!settlerAddress) {
        console.error('settlerPrivateKey missing')
        return;
      }
       
      if (ownerAddress) { 
        await fileStorage.writeValue("ownerAddress", ownerAddress);
      }
      if (adminAddress) { 
        await fileStorage.writeValue("adminAddress", adminAddress);
      }
      await fileStorage.writeValue("settlerPrivateKey", settlerPrivateKey!);
      await fileStorage.writeValue("deployerPrivateKey", deployerPrivateKey!); 
      return;
    }
  
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
        ownerAddress: {
          name:'Owner Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
        } ,
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
    if (process.env.USE_PROXY) {
      schema["properties"]["adminAddress"] = {
        name: "Proxy Admin Address",
        pattern: /^0x[0-9A-Fa-f]{40}$/,
        message: 'Must be a hex starts with 0x, and should be a multisig wallet address that support openzeppelin proxy, take GnosisSafe wallet address.',
        required: false
      }
    }
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
    var ownerAddress = await fileStorage.readValue("ownerAddress");
    var settlerAddress = await fileStorage.readValue("settlerAddress");
    var adminAddress = process.env.USE_PROXY ? await fileStorage.readValue("adminAddress") : null;
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey"); 
    if (deployerAddress && ownerAddress && settlerAddress && deployerPrivateKey){
      let message = `Deployer Address: ${deployerAddress}; Owner Address: ${ownerAddress}; Settler Address: ${settlerAddress}`;
      if (adminAddress && adminAddress != deployerAddress) {
        message += `; Proxy Admin Address: ${adminAddress}`;
      } 
      console.log(message); 
      if (!forcesettlerkey){
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
    if (!result.adminAddress && result.adminAddress != result.deployerAddress) {
      console.log(`Deployer Address: ${result.deployerAddress}; Owner Address: ${ownerAddress}; Settler Address: ${result.settlerAddress}`); 
    }
    else{
      console.log(`Deployer Address: ${result.deployerAddress}; Owner Address: ${ownerAddress}; Settler Address: ${result.settlerAddress}; Proxy Admin Address: ${result.adminAddress}`); 
 
    }
    await fileStorage.writeValue("deployerAddress", result.deployerAddress);
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    await fileStorage.writeValue("settlerAddress", result.settlerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey); 
    if(result.adminAddress){ 
      await fileStorage.writeValue("adminAddress", result.adminAddress);
    }
    else if (process.env.USE_PROXY) { 
      await fileStorage.writeValue("adminAddress", result.deployerAddress);
    }
    if (result.settlerPrivateKey) { 
      console.log(`Settler private key written to secured storage`); 
      await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
  
  }; 
   

  export default main;
  
   