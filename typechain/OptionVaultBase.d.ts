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

interface OptionVaultBaseInterface extends ethers.utils.Interface {
  functions: {
    "adminRoleAddress()": FunctionFragment;
    "balanceEnough(address)": FunctionFragment;
    "currentRound()": FunctionFragment;
    "executionAccountingResult(uint8)": FunctionFragment;
    "initiateSettlement()": FunctionFragment;
    "managerRoleAddress()": FunctionFragment;
    "optionPairCount()": FunctionFragment;
    "optionPairs(uint8)": FunctionFragment;
    "sendBackAssets()": FunctionFragment;
    "setOptionParameters(uint256[])": FunctionFragment;
    "settle(uint8[])": FunctionFragment;
    "settlementCashflowResult(address)": FunctionFragment;
    "toggleOptionPairDeposit(uint8)": FunctionFragment;
    "underSettlement()": FunctionFragment;
    "withdrawAssets()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "adminRoleAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "balanceEnough",
    values: [string]
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
    functionFragment: "sendBackAssets",
    values?: undefined
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
    functionFragment: "withdrawAssets",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "adminRoleAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "balanceEnough",
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
    functionFragment: "sendBackAssets",
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
    functionFragment: "withdrawAssets",
    data: BytesLike
  ): Result;

  events: {
    "AdminChanged(address,address)": EventFragment;
    "ManagerChanged(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ManagerChanged"): EventFragment;
}

export type AdminChangedEvent = TypedEvent<
  [string, string] & { oldAdmin: string; newAdmin: string }
>;

export type ManagerChangedEvent = TypedEvent<
  [string, string] & { oldManager: string; newManager: string }
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
    adminRoleAddress(overrides?: CallOverrides): Promise<[string]>;

    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

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

    sendBackAssets(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

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

    withdrawAssets(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  adminRoleAddress(overrides?: CallOverrides): Promise<string>;

  balanceEnough(_asset: string, overrides?: CallOverrides): Promise<boolean>;

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

  sendBackAssets(
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

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

  withdrawAssets(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    adminRoleAddress(overrides?: CallOverrides): Promise<string>;

    balanceEnough(_asset: string, overrides?: CallOverrides): Promise<boolean>;

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

    sendBackAssets(overrides?: CallOverrides): Promise<void>;

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

    withdrawAssets(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "AdminChanged(address,address)"(
      oldAdmin?: string | null,
      newAdmin?: string | null
    ): TypedEventFilter<
      [string, string],
      { oldAdmin: string; newAdmin: string }
    >;

    AdminChanged(
      oldAdmin?: string | null,
      newAdmin?: string | null
    ): TypedEventFilter<
      [string, string],
      { oldAdmin: string; newAdmin: string }
    >;

    "ManagerChanged(address,address)"(
      oldManager?: string | null,
      newManager?: string | null
    ): TypedEventFilter<
      [string, string],
      { oldManager: string; newManager: string }
    >;

    ManagerChanged(
      oldManager?: string | null,
      newManager?: string | null
    ): TypedEventFilter<
      [string, string],
      { oldManager: string; newManager: string }
    >;
  };

  estimateGas: {
    adminRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    currentRound(overrides?: CallOverrides): Promise<BigNumber>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initiateSettlement(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    managerRoleAddress(overrides?: CallOverrides): Promise<BigNumber>;

    optionPairCount(overrides?: CallOverrides): Promise<BigNumber>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    sendBackAssets(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
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

    withdrawAssets(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    adminRoleAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    balanceEnough(
      _asset: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    currentRound(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    executionAccountingResult(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initiateSettlement(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    managerRoleAddress(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    optionPairCount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    optionPairs(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    sendBackAssets(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
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

    withdrawAssets(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
