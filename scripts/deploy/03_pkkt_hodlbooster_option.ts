import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption} from "../../typechain";
import * as dotenv from "dotenv";  
 
dotenv.config();   
const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer, settler } = await getNamedAccounts(); 
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
  });
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


  console.log("03 - Deploying PKKTHodlBoosterOption on", network.name); 
  const optionLifecycle = await deploy("OptionLifecycle", {
    from: deployer,
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
    } 
  }); 
  console.log(`03 - Deployed PKKTHodlBoosterOption on ${network.name} to ${optionVault.address}`);    

};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 