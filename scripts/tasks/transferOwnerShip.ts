
import promptHelper from '../helper/promptHelper';
import { getFileStorage } from "../helper/storageHelper";
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
    const hodlBoosterOption = await deployments.get("PKKTHodlBoosterOption"); 
    const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", hodlBoosterOption.address);
    await hodlBoosterOptionContract.transferOwnership(result.ownerAddress);
    var fileStorage = getFileStorage();
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    
    console.log(`Transfer ownership of PKKTHodlBoosterOption on ${network.name} to ${result.ownerAddress}`);    

}; 
export default main;

 