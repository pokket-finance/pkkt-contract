 
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
    
    const result = await promptHelper(schema);    
    await fileStorage.writeValue("settlerAddress", result.settlerAddress); 
    if (result.settlerPrivateKey) { 
      console.log(`Settler private key written to secured storage`); 
      await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
  
  }; 
   

  export default main;
  
   