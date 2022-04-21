
<<<<<<< HEAD
import {emailerCreator, emailer, emailerType, 
    MAILSERVICE_CONFIG,EMAIL_TO, EMAIL_CC, isEmptyAccounts} from "@pokket-finance/infrastructure";
=======
import {emailerCreator, emailer, emailerType, MAILSERVICE_CONFIG, storageCreator, EMAIL_TO, EMAIL_CC} from "@pokket-finance/infrastructure";
>>>>>>> parent of 665a2dc (Revert "Merge branch 'teragon-qa'")
import { getStorage } from "./storageHelper";
import * as dotenv from "dotenv"; 
dotenv.config(); 
 

export async function getEmailer(): Promise<{emailSender: emailer, emailTos: string[], emailCcs:string[]}> { 
    let creator: emailerCreator;
    let emailSender: emailer;
    let emailTos: string[];
    let emailCcs: string[];
    creator = new emailerCreator(); 
    let storage = await getStorage();
    if(process.env.USE_EMAILSERVICE) {
        
        const emailerConfig = {
            useKafka: true,
            clientId: process.env.KAFKA_CLIENT_ID,
            brokers:process.env.KAFKA_BROKERS?.split(",") ?? []
        };
        emailSender = await creator.createEmailer(emailerType.emailService, emailerConfig); 
        if (!emailerConfig.clientId){ 
            console.error("KAFKA_CLIENT_ID not specified");
        }
        if (emailerConfig.brokers.length == 0){
            
            console.error("KAFKA_BROKERS not specified");
        }
    }
    else{

        let configContent = await storage.readValue(MAILSERVICE_CONFIG); 
        let config:any = {};
        if (configContent) {
            config = JSON.parse(configContent);
        }
        emailSender = await creator.createEmailer(emailerType.nodemailer, config);
    }
    const emailTosFromStorage = await storage.readValue(EMAIL_TO);
    emailTos = (isEmptyAccounts(emailTosFromStorage) ? process.env.EMAIL_TO : emailTosFromStorage)?.split(";") ?? [];
    if (emailTos.length == 0 ){
        console.error("EMAIL_TO not specified");
    }
    const emailCcsFromStorage = await storage.readValue(EMAIL_CC) 
    emailCcs = (isEmptyAccounts(emailCcsFromStorage) ? process.env.EMAIL_CC : emailCcsFromStorage)?.split(";") ?? []; 
    return {
        emailSender,
        emailTos,
        emailCcs
    }
}