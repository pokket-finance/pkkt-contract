import { BigNumber } from "ethers";
export declare type OptionPair = {
    callOptionId: number;
    putOptionId: number;
    depositAssetAmountDecimals: number;
    counterPartyAssetAmountDecimals: number;
    depositAsset: string;
    counterPartyAsset: string;
};
export declare type OptionSetting = {
    name: string;
    optionId: number;
    depositAssetAmountDecimals: number;
    counterPartyAssetAmountDecimals: number;
    depositAsset: string;
    counterPartyAsset: string;
};
export declare function packOptionParameter(strikePrice: number, premiumRate: number): BigNumber;
export declare function parseOptionParameter(value: BigNumber): [number, number];
