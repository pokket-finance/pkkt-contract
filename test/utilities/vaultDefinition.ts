import { BigNumber } from "ethers";

 

export type vaultDefinition = {
  vaultId: number;
  assetAmountDecimals: number;
  asset: string;
  underlying: string;
  callOrPut: boolean;
  name: string;
}
export function packOptionParameter (strikePrice: number, premiumRate: number): BigNumber { 
   return BigNumber.from(strikePrice).shl(16).or(BigNumber.from(premiumRate));
}

export function parseOptionParameter(value: BigNumber) : [number, number] {
   return [value.shr(16).toNumber(), 
    value.and(BigNumber.from("0xffff")).toNumber()];
}