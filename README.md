# pkkt-contracts

Smart constracts for HodlBHodlBoosterOption

## Deploy Factory smart contract

Project currently use hardhat for deployment. The variable should import from process.env or similar datasource:
 
## Deploy HodlBoosterOption contract
1. run **npm run prepare** (for bsctestnet) under the root folder to prepare for later operations.

2. run **npm run config-email** to configure the email server.
    - mailServerConfig would be persisted to a secured storege, and should be json configuration that can be understood by nodemailer.createTransport, example content can be **{"host": "smtp-mail.outlook.com", "secureConnection": false, "port":587, "tls": {"ciphers":"SSLv3"},"auth":{"user": "abc@xyz.com", "pass": "efg"}}**

3. run **npm run deploy** (for bsctestnet) under the root folder to deploy the contract and verify them on bscscan. 
    - Settler private key can be skipped at this stage. 
    - If admin address is missing, it would use the default deployer as the proxy admin, you can tranfer the admin later. 
    - Owner address must be specified, and recommend to be different from the deployer address. Any later admin operation is only allowed in this account.
    - Once deployed successfully, fill the value of proxy address to **PROXY_ADDRESS** env variable


4. run **npm run new-epoch** (for bsctestnet) under the root folder to start the initial epoch once you feel ready to kick off the contract.
    - Settler private key must be set at this stage and will be persisted to a secured storage, take, aws ssm.

## Optional Command
1. run **npm run transfer-ownership** (for bsctestnet) to transfer the ownership of HodlBoosterContract from the original owner specified during deployment.
    - Original owner's private key must be provided at this stage and stored in memory temporarily for transferring ownership on chain

2. run **npm run set-settler** (for bsctestnet) to change the settler on chain or simply upload the settler private key    
    - changeSettlerOnChain: if set to true, owner's private key must be provided at this stage and stored in memory temporarily for change the settler on chain. Also remember to restart traderperctive backend.
    - settlerPrivateKey: would be persisted to a secured storage, take, aws ssm. This must be set for traderperctive backend to function well

3. run **npm run send-coins --target <targetAddress>** (for bsctestnet) to send some mock coins to specific address 

## License

MIT
