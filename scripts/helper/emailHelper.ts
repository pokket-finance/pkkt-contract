
import {emailerCreator, emailer, emailerType} from "@pokket-finance/infrastructure"
import * as dotenv from "dotenv"; 
dotenv.config(); 
 

export async function getEmailer(): Promise<{emailSender: emailer, emailTos: string[], emailCcs:string[]}> { 
    let creator: emailerCreator;
    let emailSender: emailer;
    let emailTos: string[];
    let emailCcs: string[];
    creator = new emailerCreator(); 
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
        emailSender = await creator.createEmailer(emailerType.nodemailer, {});
    }
    emailTos = process.env.EMAIL_TO?.split(";") ?? [];
    if (emailTos.length == 0 ){
        console.error("EMAIL_TO not specified");
    }
    emailCcs = process.env.EMAIL_CC?.split(";") ?? []; 
    return {
        emailSender,
        emailTos,
        emailCcs
    }
}