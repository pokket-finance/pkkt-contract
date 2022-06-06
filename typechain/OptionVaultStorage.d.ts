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

interface OptionVaultStorageInterface extends ethers.utils.Interface {
  functions: {
    "managerRoleAddress()": FunctionFragment;
    "vaultCount()": FunctionFragment;
    "vaultDefinitions(uint8)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "managerRoleAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "vaultCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "vaultDefinitions",
    values: [BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "managerRoleAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vaultCount", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "vaultDefinitions",
    data: BytesLike
  ): Result;

  events: {};
}

export class OptionVaultStorage extends BaseContract {
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

  interface: OptionVaultStorageInterface;

  functions: {
    managerRoleAddress(overrides?: CallOverrides): Promise<[string]>;

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

  managerRoleAddress(overrides?: CallOverrides): Promise<string>;

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
    managerRoleAddress(overrides?: CallOverrides): Promise<string>;

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
    managerRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    vaultCount(overrides?: CallOverrides): Promise<BigNumber>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    managerRoleAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    vaultCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    vaultDefinitions(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
