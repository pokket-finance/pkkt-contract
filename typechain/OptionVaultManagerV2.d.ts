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
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface OptionVaultManagerV2Interface extends ethers.utils.Interface {
  functions: {
    "bidOption(uint8,uint16)": FunctionFragment;
    "clearBidding()": FunctionFragment;
    "collectOptionHolderValues()": FunctionFragment;
    "expireOptions((uint128,uint8)[])": FunctionFragment;
    "kickOffOptions((uint8,uint128,uint8)[])": FunctionFragment;
    "managerRoleAddress()": FunctionFragment;
    "sellOptions((uint128,uint16,uint8)[])": FunctionFragment;
    "vaultCount()": FunctionFragment;
    "vaultDefinitions(uint8)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "bidOption",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "clearBidding",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "collectOptionHolderValues",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "expireOptions",
    values: [{ expiryLevel: BigNumberish; vaultId: BigNumberish }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "kickOffOptions",
    values: [
      {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "managerRoleAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "sellOptions",
    values: [
      {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "vaultCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "vaultDefinitions",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "bidOption", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "clearBidding",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "collectOptionHolderValues",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "expireOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "kickOffOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "managerRoleAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "sellOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vaultCount", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "vaultDefinitions",
    data: BytesLike
  ): Result;

  events: {};
}

export class OptionVaultManagerV2 extends BaseContract {
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

  interface: OptionVaultManagerV2Interface;

  functions: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    managerRoleAddress(overrides?: CallOverrides): Promise<[string]>;

    sellOptions(
      _ongoingParameters: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    vaultCount(overrides?: CallOverrides): Promise<[number]>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [number, number, string, string, boolean] & {
        vaultId: number;
        assetAmountDecimals: number;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }
    >;
  };

  bidOption(
    _vaultId: BigNumberish,
    _premiumRate: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  clearBidding(
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  collectOptionHolderValues(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  expireOptions(
    _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  kickOffOptions(
    _kickoffs: {
      vaultId: BigNumberish;
      maxCapacity: BigNumberish;
      environment: BigNumberish;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  managerRoleAddress(overrides?: CallOverrides): Promise<string>;

  sellOptions(
    _ongoingParameters: {
      strike: BigNumberish;
      premiumRate: BigNumberish;
      vaultId: BigNumberish;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  vaultCount(overrides?: CallOverrides): Promise<number>;

  vaultDefinitions(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [number, number, string, string, boolean] & {
      vaultId: number;
      assetAmountDecimals: number;
      asset: string;
      underlying: string;
      callOrPut: boolean;
    }
  >;

  callStatic: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    clearBidding(overrides?: CallOverrides): Promise<void>;

    collectOptionHolderValues(overrides?: CallOverrides): Promise<void>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: CallOverrides
    ): Promise<void>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    managerRoleAddress(overrides?: CallOverrides): Promise<string>;

    sellOptions(
      _ongoingParameters: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    vaultCount(overrides?: CallOverrides): Promise<number>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [number, number, string, string, boolean] & {
        vaultId: number;
        assetAmountDecimals: number;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }
    >;
  };

  filters: {};

  estimateGas: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    managerRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    sellOptions(
      _ongoingParameters: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    vaultCount(overrides?: CallOverrides): Promise<BigNumber>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    managerRoleAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    sellOptions(
      _ongoingParameters: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    vaultCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
