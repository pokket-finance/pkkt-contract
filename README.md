# pkkt-contracts

Smart constracts for PKKT HodlBooster

## Deploy Factory smart contract

Project currently use hardhat for deployment. The variable should import from process.env or similar datasource:

## Plugins

PKKT Farming is currently extended with the following plugins.
Instructions on how to use them in your own application are linked below.
Plugin should import from hardhat.config.js

| Plugin               | npm                                                           |
| -------------------- | ------------------------------------------------------------- |
| hardhat-waffle       | https://www.npmjs.com/package/@nomiclabs/hardhat-waffle       |
| hardhat-etherscan    | https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan    |
| hardhat-gas-reporter | https://www.npmjs.com/package/@nomiclabs/hardhat-gas-reporter |

## Deploy PKKT Factory contract

1. run "npm run deploy:dev" or "npm run deploy:qa" or "npm run deploy:prod" under the root folder to deploy the contract to localhost/ropsten/eth-mainnet

2. run "npm run etherscan-verify:qa" or "npm run etherscan-verify:prod" under the root folder to deploy verify the contract on etherscan for ropsten/eth-mainnet

3. run "npm run transfer-ownership:dev" or "npm run transfer-ownership:qa" or "npm run transfer-ownership:prod" under the root folder to transfer ownership the smart contract to a more secured account under localhost/ropsten/eth-mainnet

## License

MIT
