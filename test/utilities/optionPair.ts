import { BigNumber } from "ethers";

 

export type OptionPair = {
  callOptionId: number;
  putOptionId: number;
  depositAssetAmountDecimals: number;
  counterPartyAssetAmountDecimals: number;
  depositAsset: string;
  counterPartyAsset: string;

  };

  export type OptionSetting = {
    name: string;
    optionId: number; 
    depositAssetAmountDecimals: number;
    counterPartyAssetAmountDecimals: number;
    depositAsset: string;
    counterPartyAsset: string;
  }
    

export function packOptionParameter (strikePrice: number, premiumRate: number): BigNumber { 
   return BigNumber.from(strikePrice).shl(16).or(BigNumber.from(premiumRate));
}

export function parseOptionParameter(value: BigNumber) : [number, number] {
   return [value.shr(16).toNumber(), 
    value.and(BigNumber.from("0xffff")).toNumber()];
}