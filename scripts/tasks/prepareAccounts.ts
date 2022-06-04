 
import { getStorage, getFileStorage } from "../helper/storageHelper";
import promptHelper from '../helper/promptHelper';
import * as dotenv from "dotenv";
dotenv.config();

const main = async ({  }, {
    network,
    deployments,
    getNamedAccounts,
    ethers
  }) => { 

    if (process.env.FROM_SECURE_STORAGE) {

      var storage = getStorage();
      var fileStorage = getFileStorage();
 
      var ownerAddress = await fileStorage.readValue("ownerAddress");
      var managerAddress = await storage.readValue("managerAddress");
      var adminAddress = process.env.USE_PROXY ? await storage.readValue("adminAddress") : null;
      var deployerPrivateKey = await storage.readValue("deployerPrivateKey"); 
      let deployerAddress = deployerPrivateKey ? (await new ethers.Wallet(deployerPrivateKey, network.provider)).getAddress() : null;
      if (!deployerAddress) {
        console.error('deployerPrivateKey missing')
        return;
      } 
      if (!managerAddress) {
        console.error('managerAddress missing')
        return;
      }
       
      if (ownerAddress) { 
        await fileStorage.writeValue("ownerAddress", ownerAddress);
      }
      if (adminAddress) { 
        await fileStorage.writeValue("adminAddress", adminAddress);
      }
      await fileStorage.writeValue("deployerPrivateKey", deployerPrivateKey!); 
      await fileStorage.writeValue("deployerAddress", deployerAddress!);
      await fileStorage.writeValue("managerAddress", managerAddress!); 
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
        managerAddress: {
          name:'Manager Address',
          pattern: /^0x[0-9A-Fa-f]{40}$/,
          message: 'Must be a hex starts with 0x',
          required: true
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
    var storage = getStorage();
    var fileStorage = getFileStorage();
    var deployerAddress = await fileStorage.readValue("deployerAddress");
    var ownerAddress = await fileStorage.readValue("ownerAddress");
    var managerAddress = await fileStorage.readValue("managerAddress");
    var adminAddress = process.env.USE_PROXY ? await fileStorage.readValue("adminAddress") : null;
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey"); 
    if (deployerAddress && ownerAddress && managerAddress && deployerPrivateKey){
      let message = `Deployer Address: ${deployerAddress}; Owner Address: ${ownerAddress}; Manager Address: ${managerAddress}`;
      if (adminAddress && adminAddress != deployerAddress) {
        message += `; Proxy Admin Address: ${adminAddress}`;
      } 
      console.log(message); 
    }

    const result = await promptHelper(schema);   
    if (!result.adminAddress && result.adminAddress != result.deployerAddress) {
      console.log(`Deployer Address: ${result.deployerAddress}; Owner Address: ${ownerAddress}; Manager Address: ${result.managerAddress}`); 
    }
    else{
      console.log(`Deployer Address: ${result.deployerAddress}; Owner Address: ${ownerAddress}; Manager Address: ${result.managerAddress}; Proxy Admin Address: ${result.adminAddress}`); 
 
    }
    await fileStorage.writeValue("deployerAddress", result.deployerAddress);
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    await fileStorage.writeValue("managerAddress", result.managerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey); 
    if(result.adminAddress){ 
      await fileStorage.writeValue("adminAddress", result.adminAddress);
    }
    else if (process.env.USE_PROXY) { 
      await fileStorage.writeValue("adminAddress", result.deployerAddress);
    }
  
  }; 
   

  export default main;
  
   