 
import { getStorage, getFileStorage } from "../helper/storageHelper";
import promptHelper from '../helper/promptHelper';
 
const main = async ({ forcesettlerkey }, {
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
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey"); 
    if (deployerAddress && ownerAddress && settlerAddress && deployerPrivateKey ){
      console.log(`Deployer Address: ${deployerAddress}; Owner Address: ${ownerAddress}; Settler Address: ${settlerAddress}`);
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
    console.log(`Deployer Address: ${result.deployerAddress}; Owner Address: ${ownerAddress}; Settler Address: ${result.settlerAddress}`); 
    await fileStorage.writeValue("deployerAddress", result.deployerAddress);
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    await fileStorage.writeValue("settlerAddress", result.settlerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey); 
    if (result.settlerPrivateKey) { 
      console.log(`Settler private key written to secured storage`); 
      await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
  
  }; 
   

  export default main;
  
   