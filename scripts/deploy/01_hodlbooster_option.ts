import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { HodlBoosterOptionStatic, HodlBoosterOptionUpgradeable} from "../../typechain";
import {deployUpgradeableContract, postDeployment} from "../helper/deployHelper";
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  
import {CHAINID} from "../../constants/constants"
import { getFileStorage } from "../helper/storageHelper";
dotenv.config();   
const main = async ({
  network,
  deployments, 
  run,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, owner, vaultAdmin, vaultManager, admin } = await getNamedAccounts();    
  if (network.config.chainId && network.config.chainId != CHAINID.ETH_MAINNET && network.config.chainId != CHAINID.ETH_GOERLI) {
    console.log('Not eth-mainnet/ropsten/hardhat, skip deploying HodlBooster');
    return;
  } 
  const emailer = await getEmailer();
  const isMainnet = network.name === "mainnet" ; 
  var usdcAddress = isMainnet ? USDC_ADDRESS : process.env.USDC_ADDRESS;
  var wbtcAddress = isMainnet? WBTC_ADDRESS : process.env.WBTC_ADDRESS;
  if (!usdcAddress && !isMainnet){
     const USDC_ARGS =  [
      "USDCToken",
      "USDC",
      BigNumber.from(100000000).mul(USDC_MULTIPLIER),
      USDC_DECIMALS,
  ];
     //deploy mock usdc and wbtc
     const USDC = await deploy("USDC", {
      contract: "ERC20Mock",
      from: deployer,
      args: USDC_ARGS,
      
  } ); 
  usdcAddress = USDC.address; 
  await postDeployment(USDC, run, "USDC", network.name, USDC_ARGS); 
}
   
  if (!wbtcAddress && !isMainnet){
    const WBTC_ARGS =  [
      "Wrapped BTC",
      "WBTC",
      BigNumber.from(10000).mul(WBTC_MULTIPLIER),
      WBTC_DECIMALS
  ];
      const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        args: WBTC_ARGS,
    });
    
  await postDeployment(WBTC, run, "WBTC", network.name, WBTC_ARGS);  

 }

  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer, 
  });
  
  
  await postDeployment(optionLifecycle, run, "OptionLifecycle", network.name);    

  const HODLBOOSTER_ARGS = [owner, vaultAdmin, vaultManager, [
    { 
      depositAssetAmountDecimals: ETH_DECIMALS,
      counterPartyAssetAmountDecimals: USDC_DECIMALS,
      depositAsset: NULL_ADDRESS,
      counterPartyAsset: usdcAddress,
      callOptionId: 0,
      putOptionId: 0
    
    },
    { 
      depositAssetAmountDecimals: WBTC_DECIMALS,
      counterPartyAssetAmountDecimals: USDC_DECIMALS,
      depositAsset: wbtcAddress,
      counterPartyAsset: usdcAddress,
      callOptionId: 0,
      putOptionId: 0
    
    }
  ]];
  const optionVaultLogic = await deploy("HodlBoosterOption", {
    from: deployer, 
    contract: "HodlBoosterOptionUpgradeable",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    }, 
  }); 

  await postDeployment(optionVaultLogic, run, "HodlBoosterOption", network.name);    
  
  const optionVault = await ethers.getContractFactory("HodlBoosterOptionUpgradeable", {
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    },
  });

  //this solution is not consistent with typechain generated class
  /*const initData = optionVault.interface.encodeFunctionData(
    "initialize",
    HODLBOOSTER_ARGS
  );

  const proxy = await deploy("HodlBoosterOptionProxy", {
    contract: "AdminUpgradeabilityProxy",
    from: deployer,
    args: [optionVaultLogic.address, admin, initData],
  });
 
  console.log(`Deployed BSC HodlBoosterOption Proxy on ${network.name} to ${proxy.address}`);

  try {
    await run("verify:verify", {
      address: proxy.address,
      constructorArguments: [optionVaultLogic.address, admin, initData],
    });
  } catch (error) {
    console.log(error);
  } */
  
  const useNewAdmin = admin && admin != deployer;
  const proxy = 
  useNewAdmin ?
  await deployUpgradeableContract(optionVault as ContractFactory, HODLBOOSTER_ARGS, admin) as HodlBoosterOptionUpgradeable:
  await deployUpgradeableContract(optionVault as ContractFactory, HODLBOOSTER_ARGS) as HodlBoosterOptionUpgradeable;
  
  if (useNewAdmin) {
    console.log(`Deployed HodlBoosterOption proxy on ${network.name} to ${proxy.address} and set the admin address to ${admin}`);
  }
  else {
    console.log(`Deployed HodlBoosterOption proxy on ${network.name} to ${proxy.address}`);
  }

  if (process.env.FROM_SECURE_STORAGE) { 
    var storage = await getFileStorage();
    await storage.writeValue("ownerAddress", "");
    await storage.writeValue("deployerPrivateKey", "");
    await storage.writeValue("adminAddress", "");
    await storage.writeValue("vaultManagerAddress", "");
    await storage.writeValue("vaultAdminPrivateKey", "");
  }

  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`HodlBoosterOption deployed on ${network.name}`,
    content: `<h2>Deployed HodlBoosterOption on ${network.name} to ${proxy.address}</h2><h3>Owner Address: ${owner}</h3><h3>Vault Manager Address: ${vaultManager}</h3><h3>Vault Admin Address: ${vaultAdmin}</h3>` + 
    (useNewAdmin ? `<h3>Proxy Admin Address: ${admin}</h3>` : "") + 
    `<ol><li>Please run "npm run new-epoch:${process.env.ENV?.toLocaleLowerCase()}" under the vault admin account(vault admin private key needs to be input if not set during initial deployment) to start the initial epoch</li>`+
    `<li>Please set the value of VAULT_ADDRESS to ${proxy.address} in .env at backend</li></ol>`,
    isHtml: true
}

  await emailer.emailSender.sendEmail(emailContent);
  
  console.log(`Deployment notification email sent`);    
};
main.tags = ["HodlBoosterOption"];

export default main;

 