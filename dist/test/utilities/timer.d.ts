import { BigNumber } from "ethers";
export declare function advanceBlock(): Promise<any>;
export declare function advanceBlockTo(blockNumber: number): Promise<void>;
export declare function increase(value: number): Promise<void>;
export declare function latest(): Promise<BigNumber>;
export declare function advanceTimeAndBlock(time: any): Promise<void>;
export declare function advanceTime(time: any): Promise<void>;
export declare const duration: {
    seconds: (val: any) => BigNumber;
    minutes: (val: any) => BigNumber;
    hours: (val: any) => BigNumber;
    days: (val: any) => BigNumber;
    weeks: (val: any) => BigNumber;
    years: (val: any) => BigNumber;
};
