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
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface OptionVaultBaseInterface extends ethers.utils.Interface {
  functions: {
    "balanceEnough(address)": FunctionFragment;
    "batchWithdrawAssets(address,address[])": FunctionFragment;
    "currentRound()": FunctionFragment;
    "executionAccountingResult(uint8)": FunctionFragment;
    "initiateSettlement()": FunctionFragment;
    "optionPairCount()": FunctionFragment;
    "optionPairs(uint8)": FunctionFragment;
    "setOptionParameters(uint256[])": FunctionFragment;
    "settle(uint8[])": FunctionFragment;
    "settlementCashflowResult(address)": FunctionFragment;
    "toggleOptionPairDeposit(uint8)": FunctionFragment;
    "underSettlement()": FunctionFragment;
    "withdrawAsset(address,address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "balanceEnough",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "batchWithdrawAssets",
    values: [string, string[]]
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
    functionFragment: "initiateSettlement",
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
    functionFragment: "setOptionParameters",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "settle",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "settlementCashflowResult",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "toggleOptionPairDeposit",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "underSettlement",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawAsset",
    values: [string, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "balanceEnough",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "batchWithdrawAssets",
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
    functionFragment: "initiateSettlement",
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
    functionFragment: "setOptionParameters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "settle", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "settlementCashflowResult",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "toggleOptionPairDeposit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "underSettlement",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawAsset",
    data: BytesLike
  ): Result;

  events: {
    "SettlerChanged(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "SettlerChanged"): EventFragment;
}

export type SettlerChangedEvent = TypedEvent<
  [string, string] & { previousSettler: string; newSettler: string }
>;

export class OptionVaultBase extends BaseContract {
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

  interface: OptionVaultBaseInterface;

  functions: {
    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    batchWithdrawAssets(
      _trader: string,
      _assets: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

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

    initiateSettlement(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

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

    setOptionParameters(
      _parameters: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    settle(
      _execution: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, string] & {
        newDepositAmount: BigNumber;
        newReleasedAmount: BigNumber;
        leftOverAmount: BigNumber;
        contractAddress: string;
      }
    >;

    toggleOptionPairDeposit(
      _pairId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    underSettlement(overrides?: CallOverrides): Promise<[boolean]>;

    withdrawAsset(
      _trader: string,
      _asset: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  balanceEnough(_asset: string, overrides?: CallOverrides): Promise<boolean>;

  batchWithdrawAssets(
    _trader: string,
    _assets: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

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

  initiateSettlement(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

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

  setOptionParameters(
    _parameters: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  settle(
    _execution: BigNumberish[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  settlementCashflowResult(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, BigNumber, string] & {
      newDepositAmount: BigNumber;
      newReleasedAmount: BigNumber;
      leftOverAmount: BigNumber;
      contractAddress: string;
    }
  >;

  toggleOptionPairDeposit(
    _pairId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  underSettlement(overrides?: CallOverrides): Promise<boolean>;

  withdrawAsset(
    _trader: string,
    _asset: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    balanceEnough(_asset: string, overrides?: CallOverrides): Promise<boolean>;

    batchWithdrawAssets(
      _trader: string,
      _assets: string[],
      overrides?: CallOverrides
    ): Promise<void>;

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

    initiateSettlement(overrides?: CallOverrides): Promise<void>;

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

    setOptionParameters(
      _parameters: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    settle(
      _execution: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, BigNumber, string] & {
        newDepositAmount: BigNumber;
        newReleasedAmount: BigNumber;
        leftOverAmount: BigNumber;
        contractAddress: string;
      }
    >;

    toggleOptionPairDeposit(
      _pairId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    underSettlement(overrides?: CallOverrides): Promise<boolean>;

    withdrawAsset(
      _trader: string,
      _asset: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "SettlerChanged(address,address)"(
      previousSettler?: string | null,
      newSettler?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousSettler: string; newSettler: string }
    >;

    SettlerChanged(
      previousSettler?: string | null,
      newSettler?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousSettler: string; newSettler: string }
    >;
  };

  estimateGas: {
    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    batchWithdrawAssets(
      _trader: string,
      _assets: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    currentRound(overrides?: CallOverrides): Promise<BigNumber>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initiateSettlement(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    optionPairCount(overrides?: CallOverrides): Promise<BigNumber>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setOptionParameters(
      _parameters: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    settle(
      _execution: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    toggleOptionPairDeposit(
      _pairId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    underSettlement(overrides?: CallOverrides): Promise<BigNumber>;

    withdrawAsset(
      _trader: string,
      _asset: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    batchWithdrawAssets(
      _trader: string,
      _assets: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    currentRound(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initiateSettlement(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    optionPairCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setOptionParameters(
      _parameters: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    settle(
      _execution: BigNumberish[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    settlementCashflowResult(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    toggleOptionPairDeposit(
      _pairId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    underSettlement(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdrawAsset(
      _trader: string,
      _asset: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
