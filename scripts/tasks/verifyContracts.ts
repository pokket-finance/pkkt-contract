import { TaskArguments } from "hardhat/types";
import { NULL_ADDRESS, USDC_ADDRESS, WBTC_ADDRESS, USDC_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS,USDC_MULTIPLIER, WBTC_MULTIPLIER} from "../../constants/constants"; 

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
  } catch (e) {
    console.error(e);
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
  } catch (e) {
    console.error(e);
  }

   
};
export default main;
