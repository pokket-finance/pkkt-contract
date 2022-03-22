import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { HodlBoosterOptionStatic} from "../../typechain";
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  
import {CHAINID} from "../../constants/constants"
dotenv.config();   
const main = async ({
  network,
  deployments, 
  run,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, owner, settler } = await getNamedAccounts();   
  if (network.config.chainId && network.config.chainId != CHAINID.ETH_MAINNET && network.config.chainId != CHAINID.ETH_ROPSTEN) {
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
  
  console.log(`Deployed USDC at ${USDC.address} on ${network.name}`);
  try{ 
    await run("verify:verify", {
      address: usdcAddress,
      constructorArguments:USDC_ARGS 
    });
    console.log(`Verified USDC on etherscan for ${network.name}`);
  }
  catch (e) {
    console.error(e);
    //exit(-1);
  }
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
    
    console.log(`Deployed WBTC at ${WBTC.address} on ${network.name}`);
    wbtcAddress = WBTC.address;
    try{ 
      await run("verify:verify", {
        address: wbtcAddress,
        constructorArguments: WBTC_ARGS
      });
      console.log(`Verified WBTC on etherscan for ${network.name}`);
    }
    catch (e) {
      console.error(e);
      //exit(-1);
    }

 }


  console.log(`Deploying HodlBoosterOption on ${network.name} from ${deployer}`); 
  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer, 
  });
  
  console.log(`Deployed OptionLifecycle at ${optionLifecycle.address} on ${network.name}`);
  try {
    await run("verify:verify", {
      address: optionLifecycle.address,
    });
    console.log(`Verified OptionLifecycle on etherscan ${network.name}`);
  } catch (e) {
    console.error(e);
    //exit(-1);
  }

  const HODLBOOSTER_ARGS = [owner, settler, [
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
  const optionVault = await deploy("HodlBoosterOption", {
    from: deployer,
    args: HODLBOOSTER_ARGS,
    contract: "HodlBoosterOptionStatic",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    }, 
  }); 
  console.log(`Deployed HodlBoosterOption on ${network.name} to ${optionVault.address}`);
  try {
    await run("verify:verify", {
      address: optionVault.address,
      constructorArguments: HODLBOOSTER_ARGS,
      libraries: { OptionLifecycle: optionLifecycle.address },
    });
    console.log(`Verified HodlBoosterOption on etherscan for ${network.name}`);
  } catch (e) {
    console.error(e); 
  }

  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`HodlBoosterOption deployed on ${network.name}`,
    content: `<h2>Deployed HodlBoosterOption on ${network.name} to ${optionVault.address}</h2><h3>Owner Address: ${owner}</h3><h3>Settler Address: ${settler}</h3>` +  
    `<li>Please run "npm run new-epoch:${process.env.ENV?.toLocaleLowerCase()}" under the settler account(settler private key needs to be input if not set during initial deployment) to start the initial epoch</li></ol>`,
    isHtml: true
}

  await emailer.emailSender.sendEmail(emailContent);
  
  console.log(`Deployment notification email sent`);    
};
main.tags = ["HodlBoosterOption"];

export default main;

 