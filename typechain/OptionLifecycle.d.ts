/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface OptionLifecycleInterface extends ethers.utils.Interface {
  functions: {
    "PERIOD()": FunctionFragment;
    "ROUND_PRICE_DECIMALS()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "PERIOD", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ROUND_PRICE_DECIMALS",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "PERIOD", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ROUND_PRICE_DECIMALS",
    data: BytesLike
  ): Result;

  events: {};
}

export class OptionLifecycle extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: OptionLifecycleInterface;

  functions: {
    PERIOD(overrides?: CallOverrides): Promise<[BigNumber]>;

    ROUND_PRICE_DECIMALS(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  PERIOD(overrides?: CallOverrides): Promise<BigNumber>;

  ROUND_PRICE_DECIMALS(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    PERIOD(overrides?: CallOverrides): Promise<BigNumber>;

    ROUND_PRICE_DECIMALS(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    PERIOD(overrides?: CallOverrides): Promise<BigNumber>;

    ROUND_PRICE_DECIMALS(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    PERIOD(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ROUND_PRICE_DECIMALS(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
