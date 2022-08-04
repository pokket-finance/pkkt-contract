// *
// Vault constants
//

import { BigNumber} from "ethers";

export enum OptionExecution{
    NoExecution,
    ExecuteCall,
    ExecutePut
};


export enum CHAINID {
    ETH_MAINNET = 1, // eslint-disable-line no-unused-vars
    ETH_GOERLI = 5, // eslint-disable-line no-unused-vars 
    BSC_MAINNET = 56, // eslint-disable-line no-unused-vars
    BSC_TESTNET = 97, // eslint-disable-line no-unused-vars
}

export const ETH_USDC_OPTION_ID = 0;
export const WBTC_USDC_OPTION_ID = 1;
export const WEI = BigNumber.from(10).pow(18);
export const GWEI = BigNumber.from(10).pow(9);
export const SETTLEMENTPERIOD = 1;
export const USDC_DECIMALS = 6;
export const USDT_DECIMALS = 6;
export const BUSD_DECIMALS = 18;
export const DAI_DECIMALS = 18; 
export const ETH_DECIMALS = 18;
export const WBTC_DECIMALS = 8;
export const CMI_DECIMALS = 18;
export const USDC_MULTIPLIER = BigNumber.from(10).pow(USDC_DECIMALS);
export const BUSD_MULTIPLIER = BigNumber.from(10).pow(BUSD_DECIMALS);
export const WBTC_MULTIPLIER = BigNumber.from(10).pow(WBTC_DECIMALS);
export const ETH_MULTIPLIER = BigNumber.from(10).pow(ETH_DECIMALS);
export const CMI_MULTIPLIER = BigNumber.from(10).pow(CMI_DECIMALS);
export const WBTC_PRICE_PRECISION = 4;
export const ETH_PRICE_PRECISION = 4;
export const RATIO_MULTIPLIER = 10000;
export const PKKT_VAULT_MAX="10000000000000000000000000";
export const PKKT_FARM_MAX="10000000000000000000000000"; 
export const NULL_ADDRESS ="0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
export const DAI_ADDRESS="0x6b175474e89094c44da98b954eedeac495271d0f"; 
export const WBTC_ADDRESS = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"; 
export const BSC_WBTC_ADDRESS = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
export const BSC_ETH_ADDRESS = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
export const BSC_BUSD_ADDRESS = "0x55d398326f99059ff775485246999027b3197955";
export const CMI_ADDRESS = "0x91db9937520BCf17B3427f2a092163dBC1FB4027";
