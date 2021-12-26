
import { BigNumberish } from "ethers";
import { PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption, ERC20Mock, OptionVault } from "../../typechain";

export type OptionPair = {
    callOption: PKKTHodlBoosterCallOption;
    putOption: PKKTHodlBoosterPutOption; 
    callOptionAssetDecimals: BigNumberish;
    putOptionAssetDecimals: BigNumberish;
    strikePriceDecimals:BigNumberish;
    callOptionAssetName: string;
    putOptionAssetName: string;

  };
    