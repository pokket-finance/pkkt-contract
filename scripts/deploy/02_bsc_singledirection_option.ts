import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BSC_ETH_ADDRESS, BSC_BUSD_ADDRESS, BSC_WBTC_ADDRESS, CMI_ADDRESS, BUSD_DECIMALS, 
  WBTC_DECIMALS, ETH_DECIMALS, CMI_DECIMALS, BUSD_MULTIPLIER, WBTC_MULTIPLIER, ETH_MULTIPLIER, CMI_MULTIPLIER
  } from "../../constants/constants"; 
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
    
  if (!network.config.chainId || 
    (network.config.chainId != CHAINID.BSC_MAINNET && network.config.chainId != CHAINID.BSC_TESTNET)) {
    console.log('Not bsc mainnet/testnet, skip deploying BSC SingleDirectionOption');
    return;
  }   
  const emailer = await getEmailer();
  const isMainnet = network.name === "bsc" ; 
  var busdAddress = isMainnet ? BSC_BUSD_ADDRESS : process.env.BUSD_ADDRESS;
  var wbtcAddress = isMainnet? BSC_WBTC_ADDRESS : process.env.WBTC_ADDRESS;
  var ethAddress = isMainnet? BSC_ETH_ADDRESS : process.env.ETH_ADDRESS;
  var cmiAddress = isMainnet ? CMI_ADDRESS: process.env.CMI_ADDRESS;
  
  //deploy mock usdc, wbtc and eth
  if (!busdAddress && !isMainnet){
    const BUSD_ARGS = [
      "Binance-Peg BSC-USD",
      "BUSD",
      BigNumber.from(100000000).mul(BUSD_MULTIPLIER),
      BUSD_DECIMALS,
  ];
     const BUSD = await deploy("BUSD", {
      contract: "ERC20Mock",
      from: deployer,
      args: BUSD_ARGS, 
    } );
    busdAddress = BUSD.address;
    await postDeployment(BUSD, run, "BUSD", network.name, BUSD_ARGS);
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
    
    await postDeployment(WBTC, run, "WBTC", network.name, WBTC_ARGS); 
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

  await postDeployment(ETH, run, "ETH", network.name, ETH_ARGS);  

}  
  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer, 
  });
  

  await postDeployment(optionLifecycle, run, "OptionLifecycle", network.name);  


  const SINGLEDIRECTION_ARGS = [owner, manager, [
    { 
      assetAmountDecimals: ETH_DECIMALS,
      asset: ethAddress,
      underlying: ethAddress,
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
      assetAmountDecimals: CMI_DECIMALS,
      asset: cmiAddress,
      underlying: cmiAddress,
      vaultId: 0,
      callOrPut: true
    },
    { 
      assetAmountDecimals: BUSD_DECIMALS,
      asset: busdAddress,
      underlying: ethAddress,
      vaultId: 0,
      callOrPut: false
    
    },
    { 
      assetAmountDecimals: BUSD_DECIMALS,
      asset: busdAddress,
      underlying: wbtcAddress,
      vaultId: 0,
      callOrPut: false
    },
    { 
      assetAmountDecimals: BUSD_DECIMALS,
      asset: busdAddress,
      underlying: cmiAddress,
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
main.tags = ["BSCSingleDirectionOption"];

export default main;

 