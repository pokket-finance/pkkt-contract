import { TaskArguments } from "hardhat/types";
import { exit } from "process";
import { NULL_ADDRESS, BSC_ETH_ADDRESS, USDC_ADDRESS, BSC_USDC_ADDRESS, 
  WBTC_ADDRESS, BSC_WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER, CHAINID} from "../../constants/constants"; 

import {getEmailer} from '../helper/emailHelper';
const main = async (
  _taskArgs: TaskArguments,
  { deployments, network, run, getNamedAccounts }
) => {
    
  const { settler } = await getNamedAccounts();  
  const OptionLifecycle = await deployments.get("OptionLifecycle");  
  const PKKTHodlBoosterOption = await deployments.get("PKKTHodlBoosterOption");  
  const chainId = network.config.chainId;
  let usdcAddress:string;
  let wbtcAddress:string;
  let ethAddress:string;
  if (!chainId || chainId == CHAINID.ETH_MAINNET){
     usdcAddress = USDC_ADDRESS;
     wbtcAddress = WBTC_ADDRESS;
     ethAddress = NULL_ADDRESS;
  }
  else if (chainId == CHAINID.BSC_MAINNET) { 
    usdcAddress = BSC_USDC_ADDRESS;
    wbtcAddress = BSC_WBTC_ADDRESS;
    ethAddress = BSC_ETH_ADDRESS;
  }
  else {
    usdcAddress = process.env.USDC_ADDRESS!;
    wbtcAddress = process.env.WBTC_ADDRESS!;
    ethAddress = process.env.WBTC_ADDRESS!;
  } 

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
      depositAsset: ethAddress,
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
