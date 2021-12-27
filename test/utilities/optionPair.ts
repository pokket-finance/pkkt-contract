
import { BigNumberish } from "ethers";
import { PKKTHodlBoosterOption,ERC20Mock, OptionVault } from "../../typechain";

export type OptionPair = {
    callOption: PKKTHodlBoosterOption;
    putOption: PKKTHodlBoosterOption; 
    callOptionAssetDecimals: BigNumberish;
    putOptionAssetDecimals: BigNumberish;
    strikePriceDecimals:BigNumberish;
    callOptionAssetName: string;
    putOptionAssetName: string;

  };
    