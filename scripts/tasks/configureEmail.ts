 
import { getStorage } from "../helper/storageHelper";
import {getEmailer} from '../helper/emailHelper';
import promptHelper from '../helper/promptHelper';
 
const main = async ({ forcesettlerkey }, {
    network,
    deployments,
    getNamedAccounts,
    ethers
  }) => { 
   
    var schema = {
      properties: { 
        mailServerConfig: {
          name:'Settler Address',
          pattern: /^\{.*\}$/,
          message: 'Configure the mail server json',
          required: true
        } 
      }
    };
  
    var storage = getStorage(); 
    
    const result = await promptHelper(schema);     
    if (result.mailServerConfig) {  
      console.log(`Mail Server Config written to secured storage`); 
      await storage.writeValue("MAILSERVICE_CONFIG", result.mailServerConfig); 
      
        var emailer = await getEmailer();
        const emailContent = { 
            to: emailer.emailTos, 
            cc: emailer.emailCcs,
            subject:`Test email`,
            content: `Test email create at ${new Date().toLocaleDateString()}`,
            isHtml: true
        }
 
        await emailer.emailSender.sendEmail(emailContent);
        console.log(`Test email send`); 
    }
  
  }; 
   

  export default main;
  
   