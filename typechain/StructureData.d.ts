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

interface StructureDataInterface extends ethers.utils.Interface {
  functions: {
    "MATUREROUND()": FunctionFragment;
    "OPTION_ROLE()": FunctionFragment;
    "PRICE_PRECISION()": FunctionFragment;
    "SETTLER_ROLE()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "MATUREROUND",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "OPTION_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PRICE_PRECISION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "SETTLER_ROLE",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "MATUREROUND",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "OPTION_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PRICE_PRECISION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "SETTLER_ROLE",
    data: BytesLike
  ): Result;

  events: {};
}

export class StructureData extends BaseContract {
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

  interface: StructureDataInterface;

  functions: {
    MATUREROUND(overrides?: CallOverrides): Promise<[number]>;

    OPTION_ROLE(overrides?: CallOverrides): Promise<[string]>;

    PRICE_PRECISION(overrides?: CallOverrides): Promise<[number]>;

    SETTLER_ROLE(overrides?: CallOverrides): Promise<[string]>;
  };

  MATUREROUND(overrides?: CallOverrides): Promise<number>;

  OPTION_ROLE(overrides?: CallOverrides): Promise<string>;

  PRICE_PRECISION(overrides?: CallOverrides): Promise<number>;

  SETTLER_ROLE(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    MATUREROUND(overrides?: CallOverrides): Promise<number>;

    OPTION_ROLE(overrides?: CallOverrides): Promise<string>;

    PRICE_PRECISION(overrides?: CallOverrides): Promise<number>;

    SETTLER_ROLE(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    MATUREROUND(overrides?: CallOverrides): Promise<BigNumber>;

    OPTION_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PRICE_PRECISION(overrides?: CallOverrides): Promise<BigNumber>;

    SETTLER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    MATUREROUND(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    OPTION_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PRICE_PRECISION(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    SETTLER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}