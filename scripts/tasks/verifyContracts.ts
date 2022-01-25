import { TaskArguments } from "hardhat/types";
import { exit } from "process";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 

import {getEmailer} from '../helper/emailHelper';
const main = async (
  _taskArgs: TaskArguments,
  { deployments, network, run, getNamedAccounts }
) => {
    
  const { settler } = await getNamedAccounts();  
  const OptionLifecycle = await deployments.get("OptionLifecycle");  
  const PKKTHodlBoosterOption = await deployments.get("PKKTHodlBoosterOption");  

  const isMainnet = network.name === "mainnet" ; 
  var usdcAddress = isMainnet ? USDC_ADDRESS : process.env.USDC_ADDRESS;
  var wbtcAddress = isMainnet? WBTC_ADDRESS : process.env.WBTC_ADDRESS;

  try {
    await run("verify:verify", {
      address: OptionLifecycle.address,
    });
    console.log("Verified OptionLifecycle on etherscan");
  } catch (e) {
    console.error(e);
    //exit(-1);
  }
 

  const HODLBOOSTER_ARGS =  [settler, [
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

  try {
    await run("verify:verify", {
      address: PKKTHodlBoosterOption.address,
      constructorArguments: HODLBOOSTER_ARGS,
      libraries: { OptionLifecycle: OptionLifecycle.address },
    });
    console.log("Verified PKKTHodlBoosterOption on etherscan");
  } catch (e) {
    console.error(e);
    exit(-1);
  }

  var emailer = await getEmailer();
  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`PKKTHodlBoosterOption verified on etherscan`,
    content: `<h3>PKKTHodlBoosterOption verified on etherscan (${network.name})</h3>Please visit <a href="${process.env.ETHERSCAN_SITE}/address/${PKKTHodlBoosterOption.address}#code">smart contract code on etherscan (${network.name})</a>for more details`,
    isHtml: true
}

 await emailer.emailSender.sendEmail(emailContent);
};
export default main;
