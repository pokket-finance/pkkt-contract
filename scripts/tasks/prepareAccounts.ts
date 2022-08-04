 
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

    const provider = new ethers.providers.JsonRpcProvider(
      network.config.url,
      network.config.chainId
    ); 
    if (process.env.FROM_SECURE_STORAGE) {

      var storage = getStorage();
      var fileStorage = getFileStorage();
 
      var ownerAddress = await storage.readValue("ownerAddress");
      var vaultManagerAddress = await storage.readValue("vaultManagerAddress");
      var vaultAdminPrivateKey = await storage.readValue("vaultAdminPrivateKey");
      var adminAddress = process.env.USE_PROXY ? await storage.readValue("adminAddress") : null;
      var deployerPrivateKey = await storage.readValue("deployerPrivateKey"); 
      var deployerAddress = deployerPrivateKey ? (await new ethers.Wallet(deployerPrivateKey, provider).getAddress()) : null;
      var vaultAdminAddress = vaultAdminPrivateKey ? (await new ethers.Wallet(vaultAdminPrivateKey, provider).getAddress()) : null;
      if (!deployerAddress) {
        console.error('deployerPrivateKey missing')
        return;
      } 
      if (!vaultAdminAddress) {
        console.error('vaultAdminPrivateKey missing')
        return;
      }
      if (!vaultManagerAddress) {
        console.error('vaultManagerAddress missing')
      }
       
      if (ownerAddress) { 
        await fileStorage.writeValue("ownerAddress", ownerAddress);
      }
      if (adminAddress) { 
        await fileStorage.writeValue("adminAddress", adminAddress);
      }
      await fileStorage.writeValue("vaultAdminPrivateKey", vaultAdminPrivateKey!);
      await fileStorage.writeValue("deployerPrivateKey", deployerPrivateKey!); 
      await fileStorage.writeValue("deployerAddress", deployerAddress!); 
      await fileStorage.writeValue('vaultAdminAddress', vaultAdminAddress!);
      await fileStorage.writeValue("vaultManagerAddress", vaultManagerAddress!);
      return;
    }
  
    var schema = {
      properties: { 
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
        vaultAdminPrivateKey: {
          name: 'Vault Admin Account\'s Private Key',
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
        vaultManagerAddress: {
          name:'Valut Manager Address',
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
    var ownerAddress = await fileStorage.readValue("ownerAddress");
    var vaultManagerAddress = await fileStorage.readValue("vaultManagerAddress");
    var adminAddress = process.env.USE_PROXY ? await fileStorage.readValue("adminAddress") : null;
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey"); 
    var deployerAddress = deployerPrivateKey ? (await new ethers.Wallet(deployerPrivateKey, provider).getAddress()) : null;
    var vaultAdminPrivateKey = await fileStorage.readValue("vaultAdminPrivateKey"); 
    var vaultAdminAddress = vaultAdminPrivateKey ? (await new ethers.Wallet(vaultAdminPrivateKey, provider).getAddress()) : null;

    if (deployerAddress && ownerAddress && vaultManagerAddress && vaultAdminAddress && vaultAdminPrivateKey && deployerPrivateKey){
      let message = `Deployer Address: ${deployerAddress}; Owner Address: ${ownerAddress}; Vault Manager Address: ${vaultManagerAddress}; Vault Admin Address: ${vaultAdminAddress}`;
      if (adminAddress && adminAddress != deployerAddress) {
        message += `; Proxy Admin Address: ${adminAddress}`;
      } 
      console.log(message); 
      return;
    }
    
    const result = await promptHelper(schema);   
    
    deployerAddress = result.deployerPrivateKey ? (await new ethers.Wallet(result.deployerPrivateKey, provider).getAddress()) : null;
    vaultAdminAddress = result.vaultAdminPrivateKey ? (await new ethers.Wallet(result.vaultAdminPrivateKey, provider).getAddress()) : null; 

    if (!result.adminAddress && result.adminAddress != deployerAddress) {
      console.log(`Deployer Address: ${deployerAddress}; Owner Address: ${result.ownerAddress}; Vault Admin Address: ${vaultAdminAddress}; Vault Manager Address: ${result.vaultManagerAddress}`); 
    }
    else{
      console.log(`Deployer Address: ${deployerAddress}; Owner Address: ${result.ownerAddress}; Vault Admin Address: ${vaultAdminAddress}; Vault Manager Address: ${result.vaultManagerAddress}; Proxy Admin Address: ${result.adminAddress}`); 
 
    }
    await fileStorage.writeValue("deployerAddress", deployerAddress);
    await fileStorage.writeValue("vaultAdminAddress", vaultAdminAddress);
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    await fileStorage.writeValue("vaultManagerAddress", result.vaultManagerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey); 
    await fileStorage.writeValue("vaultAdminPrivateKey", result.vaultAdminPrivateKey); 
    if(result.adminAddress){ 
      await fileStorage.writeValue("adminAddress", result.adminAddress);
    }
    else if (process.env.USE_PROXY) { 
      await fileStorage.writeValue("adminAddress", result.deployerAddress);
    }
  
  
  }; 
   

  export default main;
  
   