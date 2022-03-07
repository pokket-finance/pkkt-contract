import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BSC_ETH_ADDRESS, BSC_USDC_ADDRESS, BSC_WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER, ETH_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption} from "../../typechain";
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  
import {CHAINID} from "../../constants/constants"

dotenv.config();   
const main = async ({
  network,
  deployments, 
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, settler } = await getNamedAccounts();    
  const emailer = await getEmailer();
   
  if (!network.config.chainId && network.config.chainId != CHAINID.BSC_MAINNET && network.config.chainId != CHAINID.BSC_TESTNET) {
    console.log('Not bsc mainnet/testnet, skip deploying BSC HodlBooster');
    return;
  }  

  const isMainnet = network.name === "bsc" ; 
  var usdcAddress = isMainnet ? BSC_USDC_ADDRESS : process.env.USDC_ADDRESS;
  var wbtcAddress = isMainnet? BSC_WBTC_ADDRESS : process.env.WBTC_ADDRESS;
  var ethAddress = isMainnet? BSC_ETH_ADDRESS : process.env.ETH_ADDRESS;
  
  //deploy mock usdc, wbtc and eth
  if (!usdcAddress && !isMainnet){
     const USDC = await deploy("USDC", {
      contract: "ERC20Mock",
      from: deployer,
      args: [
          "Pegged USDC",
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
            "Pegged BTC",
            "BTCB",
            BigNumber.from(10000).mul(WBTC_MULTIPLIER),
            WBTC_DECIMALS
        ],
    });
    
    console.log(`Deployed WBTC at ${WBTC.address} on ${network.name}`);
    wbtcAddress = WBTC.address;
 }

 if (!ethAddress && !isMainnet){
  const ETH = await deploy("ETH", {
    contract: "ERC20Mock",
    from: deployer,
    args: [
        "Pegged ETH",
        "ETH",
        BigNumber.from(100000).mul(ETH_MULTIPLIER),
        ETH_DECIMALS
    ],
  });

  console.log(`Deployed ETH at ${ETH.address} on ${network.name}`);
  ethAddress = ETH.address;

} 
  console.log(`04 - Deploying BSC PKKTHodlBoosterOption on ${network.name} from ${deployer}`); 
  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer, 
  });
  const optionVault = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    args: [settler, [
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
    ]],
    contract: "PKKTHodlBoosterOption",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    }, 
  }); 
  console.log(`04 - Deployed BSC PKKTHodlBoosterOption on ${network.name} to ${optionVault.address}`);
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
  
  console.log(`04 - Deployment notification email sent`);    
};
main.tags = ["BSCPKKTHodlBoosterOption"];

export default main;

 