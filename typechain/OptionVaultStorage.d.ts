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
    "adminRoleAddress()": FunctionFragment;
    "currentRound()": FunctionFragment;
    "executionAccountingResult(uint8)": FunctionFragment;
    "managerRoleAddress()": FunctionFragment;
    "optionPairCount()": FunctionFragment;
    "optionPairs(uint8)": FunctionFragment;
    "settlementCashflowResult(address)": FunctionFragment;
    "underSettlement()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "adminRoleAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "currentRound",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "executionAccountingResult",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "managerRoleAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "optionPairCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "optionPairs",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "settlementCashflowResult",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "underSettlement",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "adminRoleAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "currentRound",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "executionAccountingResult",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "managerRoleAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "optionPairCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "optionPairs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "settlementCashflowResult",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "underSettlement",
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
    adminRoleAddress(overrides?: CallOverrides): Promise<[string]>;

    currentRound(overrides?: CallOverrides): Promise<[number]>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        },
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        },
        number
      ] & {
        callOptionResult: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        };
        putOptionResult: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        };
        execute: number;
      }
    >;

    managerRoleAddress(overrides?: CallOverrides): Promise<[string]>;

    optionPairCount(overrides?: CallOverrides): Promise<[number]>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [number, number, number, number, string, string, boolean] & {
        callOptionId: number;
        putOptionId: number;
        depositAssetAmountDecimals: number;
        counterPartyAssetAmountDecimals: number;
        depositAsset: string;
        counterPartyAsset: string;
        manualDepositDisabled: boolean;
      }
    >;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, string, boolean] & {
        newDepositAmount: BigNumber;
        newReleasedAmount: BigNumber;
        leftOverAmount: BigNumber;
        contractAddress: string;
        sentOrWithdrawn: boolean;
      }
    >;

    underSettlement(overrides?: CallOverrides): Promise<[boolean]>;
  };

  adminRoleAddress(overrides?: CallOverrides): Promise<string>;

  currentRound(overrides?: CallOverrides): Promise<number>;

  executionAccountingResult(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        depositAmount: BigNumber;
        autoRollAmount: BigNumber;
        autoRollPremium: BigNumber;
        releasedAmount: BigNumber;
        releasedPremium: BigNumber;
        autoRollCounterPartyAmount: BigNumber;
        autoRollCounterPartyPremium: BigNumber;
        releasedCounterPartyAmount: BigNumber;
        releasedCounterPartyPremium: BigNumber;
        executed: boolean;
      },
      [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        depositAmount: BigNumber;
        autoRollAmount: BigNumber;
        autoRollPremium: BigNumber;
        releasedAmount: BigNumber;
        releasedPremium: BigNumber;
        autoRollCounterPartyAmount: BigNumber;
        autoRollCounterPartyPremium: BigNumber;
        releasedCounterPartyAmount: BigNumber;
        releasedCounterPartyPremium: BigNumber;
        executed: boolean;
      },
      number
    ] & {
      callOptionResult: [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        depositAmount: BigNumber;
        autoRollAmount: BigNumber;
        autoRollPremium: BigNumber;
        releasedAmount: BigNumber;
        releasedPremium: BigNumber;
        autoRollCounterPartyAmount: BigNumber;
        autoRollCounterPartyPremium: BigNumber;
        releasedCounterPartyAmount: BigNumber;
        releasedCounterPartyPremium: BigNumber;
        executed: boolean;
      };
      putOptionResult: [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        boolean
      ] & {
        depositAmount: BigNumber;
        autoRollAmount: BigNumber;
        autoRollPremium: BigNumber;
        releasedAmount: BigNumber;
        releasedPremium: BigNumber;
        autoRollCounterPartyAmount: BigNumber;
        autoRollCounterPartyPremium: BigNumber;
        releasedCounterPartyAmount: BigNumber;
        releasedCounterPartyPremium: BigNumber;
        executed: boolean;
      };
      execute: number;
    }
  >;

  managerRoleAddress(overrides?: CallOverrides): Promise<string>;

  optionPairCount(overrides?: CallOverrides): Promise<number>;

  optionPairs(
    arg0: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [number, number, number, number, string, string, boolean] & {
      callOptionId: number;
      putOptionId: number;
      depositAssetAmountDecimals: number;
      counterPartyAssetAmountDecimals: number;
      depositAsset: string;
      counterPartyAsset: string;
      manualDepositDisabled: boolean;
    }
  >;

  settlementCashflowResult(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber, string, boolean] & {
      newDepositAmount: BigNumber;
      newReleasedAmount: BigNumber;
      leftOverAmount: BigNumber;
      contractAddress: string;
      sentOrWithdrawn: boolean;
    }
  >;

  underSettlement(overrides?: CallOverrides): Promise<boolean>;

  callStatic: {
    adminRoleAddress(overrides?: CallOverrides): Promise<string>;

    currentRound(overrides?: CallOverrides): Promise<number>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        },
        [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        },
        number
      ] & {
        callOptionResult: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        };
        putOptionResult: [
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          BigNumber,
          boolean
        ] & {
          depositAmount: BigNumber;
          autoRollAmount: BigNumber;
          autoRollPremium: BigNumber;
          releasedAmount: BigNumber;
          releasedPremium: BigNumber;
          autoRollCounterPartyAmount: BigNumber;
          autoRollCounterPartyPremium: BigNumber;
          releasedCounterPartyAmount: BigNumber;
          releasedCounterPartyPremium: BigNumber;
          executed: boolean;
        };
        execute: number;
      }
    >;

    managerRoleAddress(overrides?: CallOverrides): Promise<string>;

    optionPairCount(overrides?: CallOverrides): Promise<number>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [number, number, number, number, string, string, boolean] & {
        callOptionId: number;
        putOptionId: number;
        depositAssetAmountDecimals: number;
        counterPartyAssetAmountDecimals: number;
        depositAsset: string;
        counterPartyAsset: string;
        manualDepositDisabled: boolean;
      }
    >;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, string, boolean] & {
        newDepositAmount: BigNumber;
        newReleasedAmount: BigNumber;
        leftOverAmount: BigNumber;
        contractAddress: string;
        sentOrWithdrawn: boolean;
      }
    >;

    underSettlement(overrides?: CallOverrides): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    adminRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    currentRound(overrides?: CallOverrides): Promise<BigNumber>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    managerRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    optionPairCount(overrides?: CallOverrides): Promise<BigNumber>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    underSettlement(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    adminRoleAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    currentRound(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    managerRoleAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    optionPairCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    underSettlement(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
