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

interface IOptionVaultManagerInterface extends ethers.utils.Interface {
  functions: {
    "addToWhitelist(address[])": FunctionFragment;
    "buyOptions(uint8[])": FunctionFragment;
    "collectOptionHolderValues()": FunctionFragment;
    "expireOptions((uint128,uint8)[])": FunctionFragment;
    "expiredHistory()": FunctionFragment;
    "kickOffOptions((uint8,uint128,uint8)[])": FunctionFragment;
    "optionHolderValues()": FunctionFragment;
    "removeFromWhitelist(address[])": FunctionFragment;
    "sellOptions((uint128,uint16,uint8)[])": FunctionFragment;
    "setCapacities((uint8,uint128)[])": FunctionFragment;
    "whitelistTraders()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addToWhitelist",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "buyOptions",
    values: [BigNumberish[]]
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
    functionFragment: "expiredHistory",
    values?: undefined
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
    functionFragment: "optionHolderValues",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "removeFromWhitelist",
    values: [string[]]
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
    functionFragment: "setCapacities",
    values: [{ vaultId: BigNumberish; maxCapacity: BigNumberish }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "whitelistTraders",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "addToWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "buyOptions", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "collectOptionHolderValues",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "expireOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "expiredHistory",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "kickOffOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "optionHolderValues",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeFromWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "sellOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setCapacities",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "whitelistTraders",
    data: BytesLike
  ): Result;

  events: {};
}

export class IOptionVaultManager extends BaseContract {
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

  interface: IOptionVaultManagerInterface;

  functions: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    expireOptions(
      _expired: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    expiredHistory(
      overrides?: CallOverrides
    ): Promise<
      [
        ([
          BigNumber,
          BigNumber,
          BigNumber,
          number,
          number,
          number,
          BigNumber
        ] & {
          amount: BigNumber;
          strike: BigNumber;
          expiryLevel: BigNumber;
          round: number;
          vaultId: number;
          premiumRate: number;
          optionHolderValue: BigNumber;
        })[]
      ]
    >;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<
      [([string, BigNumber] & { asset: string; amount: BigNumber })[]]
    >;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sellOptions(
      _cutoff: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setCapacities(
      _capacities: { vaultId: BigNumberish; maxCapacity: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    whitelistTraders(overrides?: CallOverrides): Promise<[string[]]>;
  };

  addToWhitelist(
    _whitelistAddresses: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyOptions(
    _vaultIds: BigNumberish[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  collectOptionHolderValues(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  expireOptions(
    _expired: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  expiredHistory(
    overrides?: CallOverrides
  ): Promise<
    ([BigNumber, BigNumber, BigNumber, number, number, number, BigNumber] & {
      amount: BigNumber;
      strike: BigNumber;
      expiryLevel: BigNumber;
      round: number;
      vaultId: number;
      premiumRate: number;
      optionHolderValue: BigNumber;
    })[]
  >;

  kickOffOptions(
    _kickoffs: {
      vaultId: BigNumberish;
      maxCapacity: BigNumberish;
      environment: BigNumberish;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  optionHolderValues(
    overrides?: CallOverrides
  ): Promise<([string, BigNumber] & { asset: string; amount: BigNumber })[]>;

  removeFromWhitelist(
    _delistAddresses: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sellOptions(
    _cutoff: {
      strike: BigNumberish;
      premiumRate: BigNumberish;
      vaultId: BigNumberish;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setCapacities(
    _capacities: { vaultId: BigNumberish; maxCapacity: BigNumberish }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  whitelistTraders(overrides?: CallOverrides): Promise<string[]>;

  callStatic: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    collectOptionHolderValues(overrides?: CallOverrides): Promise<void>;

    expireOptions(
      _expired: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: CallOverrides
    ): Promise<void>;

    expiredHistory(
      overrides?: CallOverrides
    ): Promise<
      ([BigNumber, BigNumber, BigNumber, number, number, number, BigNumber] & {
        amount: BigNumber;
        strike: BigNumber;
        expiryLevel: BigNumber;
        round: number;
        vaultId: number;
        premiumRate: number;
        optionHolderValue: BigNumber;
      })[]
    >;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<([string, BigNumber] & { asset: string; amount: BigNumber })[]>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    sellOptions(
      _cutoff: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    setCapacities(
      _capacities: { vaultId: BigNumberish; maxCapacity: BigNumberish }[],
      overrides?: CallOverrides
    ): Promise<void>;

    whitelistTraders(overrides?: CallOverrides): Promise<string[]>;
  };

  filters: {};

  estimateGas: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    expireOptions(
      _expired: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    expiredHistory(overrides?: CallOverrides): Promise<BigNumber>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    optionHolderValues(overrides?: CallOverrides): Promise<BigNumber>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sellOptions(
      _cutoff: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setCapacities(
      _capacities: { vaultId: BigNumberish; maxCapacity: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    whitelistTraders(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    expireOptions(
      _expired: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    expiredHistory(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    kickOffOptions(
      _kickoffs: {
        vaultId: BigNumberish;
        maxCapacity: BigNumberish;
        environment: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sellOptions(
      _cutoff: {
        strike: BigNumberish;
        premiumRate: BigNumberish;
        vaultId: BigNumberish;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setCapacities(
      _capacities: { vaultId: BigNumberish; maxCapacity: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    whitelistTraders(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
