import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BSC_ETH_ADDRESS, BSC_USDC_ADDRESS, BSC_WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER, ETH_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract,ContractFactory } from "ethers";
import { ethers } from "hardhat"; 
import {getEmailer} from '../helper/emailHelper';
import * as dotenv from "dotenv";  
import {CHAINID} from "../../constants/constants"
import {deployUpgradeableContract} from '../helper/deployUpgradable';

dotenv.config();   
const main = async ({
  network,
  deployments, 
  run,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  var { deployer, owner, settler, admin } = await getNamedAccounts();    
    
  if (!network.config.chainId || 
    (network.config.chainId != CHAINID.BSC_MAINNET && network.config.chainId != CHAINID.BSC_TESTNET)) {
    console.log('Not bsc mainnet/testnet, skip deploying BSC HodlBooster');
    return;
  }   
  const emailer = await getEmailer();
  const isMainnet = network.name === "bsc" ; 
  var usdcAddress = isMainnet ? BSC_USDC_ADDRESS : process.env.USDC_ADDRESS;
  var wbtcAddress = isMainnet? BSC_WBTC_ADDRESS : process.env.WBTC_ADDRESS;
  var ethAddress = isMainnet? BSC_ETH_ADDRESS : process.env.ETH_ADDRESS;
  
  //deploy mock usdc, wbtc and eth
  if (!usdcAddress && !isMainnet){
    const USDC_ARGS = [
      "Pegged USDC",
      "USDC",
      BigNumber.from(100000000).mul(USDC_MULTIPLIER),
      USDC_DECIMALS,
  ];
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
    const WBTC_ARGS =[
      "Pegged BTC",
      "BTCB",
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

 if (!ethAddress && !isMainnet){
   const ETH_ARGS = [
    "Pegged ETH",
    "ETH",
    BigNumber.from(100000).mul(ETH_MULTIPLIER),
    ETH_DECIMALS
];
  const ETH = await deploy("ETH", {
    contract: "ERC20Mock",
    from: deployer,
    args: ETH_ARGS,
  });

  console.log(`Deployed ETH at ${ETH.address} on ${network.name}`);
  ethAddress = ETH.address;
  try{ 
    await run("verify:verify", {
      address: ethAddress,
      constructorArguments: ETH_ARGS
    });
    console.log(`Verified ETH on etherscan for ${network.name}`);
  }
  catch (e) {
    console.error(e);
    //exit(-1);
  }

} 
  console.log(`04 - Deploying BSC HodlBoosterOption on ${network.name} from ${deployer}`); 
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

  const optionVaultLogic = await deploy("HodlBoosterOption", {
    from: deployer, 
    contract: "HodlBoosterOptionUpgradeable",
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    }, 
  }); 

  console.log(`Deployed BSC HodlBoosterOption Logic on ${network.name} to ${optionVaultLogic.address}`);
  try {
    await run("verify:verify", {
      address: optionVaultLogic.address,
      libraries: { OptionLifecycle: optionLifecycle.address },
    });
    console.log(`Verified HodlBoosterOption Logic on etherscan for ${network.name}`);
  } catch (e) {
    console.error(e); 
  }

  
  const optionVault = await ethers.getContractFactory("HodlBoosterOptionUpgradeable", {
    libraries: {
      OptionLifecycle: optionLifecycle.address,
    },
  });

  const initData = optionVault.interface.encodeFunctionData(
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
  } 
  
  //const proxy = await deployUpgradeableContract(optionVault as ContractFactory, HODLBOOSTER_ARGS);
 

  const emailContent = { 
    to: emailer.emailTos, 
    cc: emailer.emailCcs,
    subject:`HodlBoosterOption deployed on ${network.name}`,
    content: `<h2>Deployed HodlBoosterOption on ${network.name} to ${proxy.address}</h2><h3>Owner Address: ${owner}</h3><h3>Settler Address: ${settler}</h3><h3>Proxy Admin Address: ${admin}</h3>` + 
    `<li>Please run "npm run new-epoch:${process.env.ENV?.toLocaleLowerCase()}" under the settler account(settler private key needs to be input if not set during initial deployment) to start the initial epoch</li></ol>`,
    isHtml: true
}

  await emailer.emailSender.sendEmail(emailContent);
  
  console.log(`Deployment notification email sent`);    
};
main.tags = ["BSCHodlBoosterOption"];

export default main;

 