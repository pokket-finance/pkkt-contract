import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption} from "../../typechain";
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  

dotenv.config();   
const main = async ({
  network,
  deployments, 
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, settler } = await getNamedAccounts();    
  const emailer = await getEmailer();
  const isMainnet = network.name === "mainnet" ; 
  var usdcAddress = isMainnet ? USDC_ADDRESS : process.env.USDC_ADDRESS;
  var wbtcAddress = isMainnet? WBTC_ADDRESS : process.env.WBTC_ADDRESS;
  if (!usdcAddress && !isMainnet){
     //deploy mock usdc and wbtc
     const USDC = await deploy("USDC", {
      contract: "ERC20Mock",
      from: deployer,
      args: [
          "USDCToken",
          "USDC",
          BigNumber.from(100000000).mul(USDC_MULTIPLIER),
          USDC_DECIMALS,
      ],
      
  } );
  usdcAddress = USDC.address;
  console.log(`Deployed USDC at ${USDC.address} on ${network.name}`);

  }
   
  if (!wbtcAddress && !isMainnet){
      const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "Wrapped BTC",
            "WBTC",
            BigNumber.from(10000).mul(WBTC_MULTIPLIER),
            WBTC_DECIMALS
        ],
    });
    
    console.log(`Deployed WBTC at ${WBTC.address} on ${network.name}`);
    wbtcAddress = WBTC.address;

 }


  console.log(`03 - Deploying PKKTHodlBoosterOption on ${network.name} from ${deployer}`); 
  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer,
    gasPrice: BigNumber.from(200e9)
  });
  const optionVault = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    args: [settler, [
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
    ]],
    contract: "PKKTHodlBoosterOption",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    },
    gasPrice: BigNumber.from(200e9)
  }); 
  console.log(`03 - Deployed PKKTHodlBoosterOption on ${network.name} to ${optionVault.address}`);
  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`PKKTHodlBoosterOption deployed on ${network.name}`,
    content: `<h2>Deployed PKKTHodlBoosterOption on ${network.name} to ${optionVault.address}</h2><h3>Initial Deployer Address: ${deployer}</h3><h3>Settler Address: ${settler}</h3>` + 
    `<ol><li>Please run "npm run transfer-ownership:${process.env.ENV?.toLocaleLowerCase()}" to transfer ownership to a more secured account.</li>`+
    `<li>Please run "npm run etherscan-verify:${process.env.ENV?.toLocaleLowerCase()}" to verify the contract deployed on etherscan.</li>` + 
    `<li>Please run "npm run new-epoch:${process.env.ENV?.toLocaleLowerCase()}" under the settler account(settler private key needs to be input if not set during initial deployment) to start the initial epoch</li></ol>`,
    isHtml: true
}

  await emailer.emailSender.sendEmail(emailContent);
  
  console.log(`03 - Deployment notification email sent`);    
};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 