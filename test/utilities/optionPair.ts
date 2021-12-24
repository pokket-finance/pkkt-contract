
import { BigNumberish } from "ethers";
import { PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption, ERC20Mock, OptionVault } from "../../typechain";

export type OptionPair = {
    callOption: PKKTHodlBoosterCallOption;
    putOption: PKKTHodlBoosterPutOption; 
    callOptionAssetMultiplier: BigNumberish;
    putOptionAssetMultiplier: BigNumberish;
    strikePriceMultiplier:BigNumberish;
    callOptionAssetName: string;
    putOptionAssetName: string;

  };
    