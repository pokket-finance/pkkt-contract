import { emailer } from "@pokket-finance/infrastructure";
export declare function getEmailer(): Promise<{
    emailSender: emailer;
    emailTos: string[];
    emailCcs: string[];
}>;
