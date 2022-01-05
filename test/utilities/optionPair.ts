 

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
    