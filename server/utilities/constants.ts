// *
// Vault constants
//

import { BigNumber} from "ethers";

export enum OptionExecution{
    NoExecution,
    ExecuteCall,
    ExecutePut
};
export const ETH_USDC_OPTION_ID = 0;
export const WBTC_USDC_OPTION_ID = 1;
export const WEI = BigNumber.from(10).pow(18);
export const GWEI = BigNumber.from(10).pow(9);
export const SETTLEMENTPERIOD = 1;
export const USDC_DECIMALS = 6;
export const USDT_DECIMALS = 6;
export const DAI_DECIMALS = 18; 
export const ETH_DECIMALS = 18;
export const WBTC_DECIMALS = 8;
export const USDC_MULTIPLIER = BigNumber.from(10).pow(USDC_DECIMALS);
export const WBTC_MULTIPLIER = BigNumber.from(10).pow(WBTC_DECIMALS);
export const ETH_MULTIPLIER = BigNumber.from(10).pow(ETH_DECIMALS)
export const WBTC_PRICE_PRECISION = 4;
export const ETH_PRICE_PRECISION = 4;
export const RATIO_MULTIPLIER = 10000;
export const NULL_ADDRESS ="0x0000000000000000000000000000000000000000";