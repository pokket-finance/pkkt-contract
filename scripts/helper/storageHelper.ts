

import {storageCreator, storage, storageType} from "@pokket-finance/infrastructure"
import * as dotenv from "dotenv"; 
dotenv.config(); 
export function getStorage(): storage {   
    let creator: storageCreator;
    creator = new storageCreator();
    var secureStorage: storage;
    if (process.env.USE_ENVVARSTORAGE){
        secureStorage = creator.createStorage(storageType.environmentVariable, {});
    }
    else{
        secureStorage = creator.createStorage(storageType.awsSSM, {
            region: process.env.AWS_REGION,
            tableName: process.env.AWS_TABLENAME
        });
    }
    
     return secureStorage;
}
export function getFileStorage(): storage {
    let creator: storageCreator;
    creator = new storageCreator();
    var secureStorage: storage;
    secureStorage = creator.createStorage(storageType.disk, { 
        fileName:"./data.json",
     });
    
     return secureStorage;
}
 