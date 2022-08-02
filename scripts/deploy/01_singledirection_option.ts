import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract,ContractFactory } from "ethers";
import { ethers } from "hardhat"; 
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  
import {CHAINID} from "../../constants/constants"
import {deployUpgradeableContract, postDeployment} from '../helper/deployHelper';
import { SingleDirectionOptionUpgradeable } from "../../typechain";
import { getFileStorage } from "../helper/storageHelper";

dotenv.config();   
const main = async ({
  network,
  deployments, 
  run,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, owner, manager, admin } = await getNamedAccounts();    
  if (network.config.chainId && network.config.chainId != CHAINID.ETH_MAINNET && network.config.chainId != CHAINID.ETH_GOERLI) {
    console.log('Not eth-mainnet/goerli/hardhat, skip deploying SingleDirectionOption');
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
  /*change
    struct VaultDefinition {
        uint8 vaultId; 
        uint8 assetAmountDecimals; 
        address asset;
        bool callOrPut; //call for collateral -> stablecoin; put for stablecoin->collateral; 
    } */
  
  await postDeployment(optionLifecycle, run, "OptionLifecycle", network.name);    

  const SINGLEDIRECTION_ARGS = [owner, manager, [
    { 
      assetAmountDecimals: ETH_DECIMALS,
      asset: NULL_ADDRESS,
      underlying: NULL_ADDRESS,
      vaultId: 0,
      callOrPut: true
    
    },
    { 
      assetAmountDecimals: WBTC_DECIMALS,
      asset: wbtcAddress,
      underlying: wbtcAddress,
      vaultId: 0,
      callOrPut: true
    },
    { 
      assetAmountDecimals: USDC_DECIMALS,
      asset: usdcAddress,
      underlying: NULL_ADDRESS,
      vaultId: 0,
      callOrPut: false
    
    },
    { 
      assetAmountDecimals: USDC_DECIMALS,
      asset: usdcAddress,
      underlying: wbtcAddress,
      vaultId: 0,
      callOrPut: false
    }
  ]];
  const optionVaultLogic = await deploy("SingleDirectionOption", {
    from: deployer, 
    contract: "SingleDirectionOptionUpgradeable",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    }, 
  }); 

  await postDeployment(optionVaultLogic, run, "SingleDirectionOption", network.name);    
  
  const optionVault = await ethers.getContractFactory("SingleDirectionOptionUpgradeable", {
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
  await deployUpgradeableContract(optionVault as ContractFactory, SINGLEDIRECTION_ARGS, admin) as SingleDirectionOptionUpgradeable:
  await deployUpgradeableContract(optionVault as ContractFactory, SINGLEDIRECTION_ARGS) as SingleDirectionOptionUpgradeable;
  
  if (useNewAdmin) {
    console.log(`Deployed SingleDirectionOption proxy on ${network.name} to ${proxy.address} and set the admin address to ${admin}`);
  }
  else {
    console.log(`Deployed SingleDirectionOption proxy on ${network.name} to ${proxy.address}`);
  }

  if (process.env.FROM_SECURE_STORAGE) { 
    var storage = await getFileStorage();
    await storage.writeValue("deployerPrivateKey", "");
  }

  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`SingleDirectionOption deployed on ${network.name}`,
    content: `<h2>Deployed SingleDirectionOption on ${network.name} to ${proxy.address}</h2><h3>Owner Address: ${owner}</h3><h3>Manager Address: ${manager}</h3>` + 
    (useNewAdmin ? `<h3>Proxy Admin Address: ${admin}</h3>` : ""),
    isHtml: true
}

  await emailer.emailSender.sendEmail(emailContent);
  
  console.log(`Deployment notification email sent`);    
};   
main.tags = ["SingleDirectionOption"];

export default main;

 