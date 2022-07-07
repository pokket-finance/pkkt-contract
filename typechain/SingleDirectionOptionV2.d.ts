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

interface SingleDirectionOptionV2Interface extends ethers.utils.Interface {
  functions: {
    "bidOption(uint8,uint16)": FunctionFragment;
    "cancelWithdraw(uint8,uint256)": FunctionFragment;
    "clearBidding()": FunctionFragment;
    "collectOptionHolderValues()": FunctionFragment;
    "deposit(uint8,uint256)": FunctionFragment;
    "depositETH(uint8)": FunctionFragment;
    "expireOptions((uint128,uint8)[])": FunctionFragment;
    "getUserState(uint8)": FunctionFragment;
    "getVaultState(uint8)": FunctionFragment;
    "initiateWithraw(uint8,uint256)": FunctionFragment;
    "kickOffOptions((uint8,uint128,uint8)[])": FunctionFragment;
    "managerRoleAddress()": FunctionFragment;
    "sellOptions((uint128,uint16,uint8)[])": FunctionFragment;
    "vaultCount()": FunctionFragment;
    "vaultDefinitions(uint8)": FunctionFragment;
    "withdraw(uint8,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "bidOption",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelWithdraw",
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
    functionFragment: "deposit",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "depositETH",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "expireOptions",
    values: [{ expiryLevel: BigNumberish; vaultId: BigNumberish }[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getUserState",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getVaultState",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "initiateWithraw",
    values: [BigNumberish, BigNumberish]
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
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [BigNumberish, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "bidOption", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "cancelWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "clearBidding",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "collectOptionHolderValues",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "depositETH", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "expireOptions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUserState",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getVaultState",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "initiateWithraw",
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
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "CancelWithdraw(address,uint8,uint256,uint16)": EventFragment;
    "Deposit(address,uint8,uint256,uint16)": EventFragment;
    "InitiateWithdraw(address,uint8,uint256,uint16)": EventFragment;
    "Withdraw(address,uint8,uint256,uint16)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "CancelWithdraw"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Deposit"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "InitiateWithdraw"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdraw"): EventFragment;
}

export type CancelWithdrawEvent = TypedEvent<
  [string, number, BigNumber, number] & {
    _account: string;
    _vaultId: number;
    _redeemAmount: BigNumber;
    _round: number;
  }
>;

export type DepositEvent = TypedEvent<
  [string, number, BigNumber, number] & {
    _account: string;
    _vaultId: number;
    _amount: BigNumber;
    _round: number;
  }
>;

export type InitiateWithdrawEvent = TypedEvent<
  [string, number, BigNumber, number] & {
    _account: string;
    _vaultId: number;
    _redeemAmount: BigNumber;
    _round: number;
  }
>;

export type WithdrawEvent = TypedEvent<
  [string, number, BigNumber, number] & {
    _account: string;
    _vaultId: number;
    _amount: BigNumber;
    _round: number;
  }
>;

export class SingleDirectionOptionV2 extends BaseContract {
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

  interface: SingleDirectionOptionV2Interface;

  functions: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    deposit(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    depositETH(
      _vaultId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getUserState(
      _vaultId: BigNumberish,
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
          number
        ] & {
          pending: BigNumber;
          redeemed: BigNumber;
          expiredAmount: BigNumber;
          expiredQueuedRedeemAmount: BigNumber;
          onGoingAmount: BigNumber;
          onGoingQueuedRedeemAmount: BigNumber;
          lastUpdateRound: number;
        }
      ]
    >;

    getVaultState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [
          BigNumber,
          BigNumber,
          number,
          number,
          BigNumber,
          [BigNumber, BigNumber, BigNumber, number, string] & {
            amount: BigNumber;
            queuedRedeemAmount: BigNumber;
            strike: BigNumber;
            premiumRate: number;
            buyerAddress: string;
          },
          [BigNumber, BigNumber, BigNumber, number, string] & {
            amount: BigNumber;
            queuedRedeemAmount: BigNumber;
            strike: BigNumber;
            premiumRate: number;
            buyerAddress: string;
          }
        ] & {
          totalPending: BigNumber;
          totalRedeemed: BigNumber;
          cutOffAt: number;
          currentRound: number;
          maxCapacity: BigNumber;
          onGoing: [BigNumber, BigNumber, BigNumber, number, string] & {
            amount: BigNumber;
            queuedRedeemAmount: BigNumber;
            strike: BigNumber;
            premiumRate: number;
            buyerAddress: string;
          };
          expired: [BigNumber, BigNumber, BigNumber, number, string] & {
            amount: BigNumber;
            queuedRedeemAmount: BigNumber;
            strike: BigNumber;
            premiumRate: number;
            buyerAddress: string;
          };
        }
      ]
    >;

    initiateWithraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
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

    withdraw(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  bidOption(
    _vaultId: BigNumberish,
    _premiumRate: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancelWithdraw(
    _vaultId: BigNumberish,
    _redeemAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  clearBidding(
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  collectOptionHolderValues(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  deposit(
    _vaultId: BigNumberish,
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  depositETH(
    _vaultId: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  expireOptions(
    _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getUserState(
    _vaultId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      BigNumber,
      number
    ] & {
      pending: BigNumber;
      redeemed: BigNumber;
      expiredAmount: BigNumber;
      expiredQueuedRedeemAmount: BigNumber;
      onGoingAmount: BigNumber;
      onGoingQueuedRedeemAmount: BigNumber;
      lastUpdateRound: number;
    }
  >;

  getVaultState(
    _vaultId: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [
      BigNumber,
      BigNumber,
      number,
      number,
      BigNumber,
      [BigNumber, BigNumber, BigNumber, number, string] & {
        amount: BigNumber;
        queuedRedeemAmount: BigNumber;
        strike: BigNumber;
        premiumRate: number;
        buyerAddress: string;
      },
      [BigNumber, BigNumber, BigNumber, number, string] & {
        amount: BigNumber;
        queuedRedeemAmount: BigNumber;
        strike: BigNumber;
        premiumRate: number;
        buyerAddress: string;
      }
    ] & {
      totalPending: BigNumber;
      totalRedeemed: BigNumber;
      cutOffAt: number;
      currentRound: number;
      maxCapacity: BigNumber;
      onGoing: [BigNumber, BigNumber, BigNumber, number, string] & {
        amount: BigNumber;
        queuedRedeemAmount: BigNumber;
        strike: BigNumber;
        premiumRate: number;
        buyerAddress: string;
      };
      expired: [BigNumber, BigNumber, BigNumber, number, string] & {
        amount: BigNumber;
        queuedRedeemAmount: BigNumber;
        strike: BigNumber;
        premiumRate: number;
        buyerAddress: string;
      };
    }
  >;

  initiateWithraw(
    _vaultId: BigNumberish,
    _redeemAmount: BigNumberish,
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

  withdraw(
    _vaultId: BigNumberish,
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    clearBidding(overrides?: CallOverrides): Promise<void>;

    collectOptionHolderValues(overrides?: CallOverrides): Promise<void>;

    deposit(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    depositETH(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: CallOverrides
    ): Promise<void>;

    getUserState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        BigNumber,
        number
      ] & {
        pending: BigNumber;
        redeemed: BigNumber;
        expiredAmount: BigNumber;
        expiredQueuedRedeemAmount: BigNumber;
        onGoingAmount: BigNumber;
        onGoingQueuedRedeemAmount: BigNumber;
        lastUpdateRound: number;
      }
    >;

    getVaultState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        BigNumber,
        BigNumber,
        number,
        number,
        BigNumber,
        [BigNumber, BigNumber, BigNumber, number, string] & {
          amount: BigNumber;
          queuedRedeemAmount: BigNumber;
          strike: BigNumber;
          premiumRate: number;
          buyerAddress: string;
        },
        [BigNumber, BigNumber, BigNumber, number, string] & {
          amount: BigNumber;
          queuedRedeemAmount: BigNumber;
          strike: BigNumber;
          premiumRate: number;
          buyerAddress: string;
        }
      ] & {
        totalPending: BigNumber;
        totalRedeemed: BigNumber;
        cutOffAt: number;
        currentRound: number;
        maxCapacity: BigNumber;
        onGoing: [BigNumber, BigNumber, BigNumber, number, string] & {
          amount: BigNumber;
          queuedRedeemAmount: BigNumber;
          strike: BigNumber;
          premiumRate: number;
          buyerAddress: string;
        };
        expired: [BigNumber, BigNumber, BigNumber, number, string] & {
          amount: BigNumber;
          queuedRedeemAmount: BigNumber;
          strike: BigNumber;
          premiumRate: number;
          buyerAddress: string;
        };
      }
    >;

    initiateWithraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
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

    withdraw(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "CancelWithdraw(address,uint8,uint256,uint16)"(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _redeemAmount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      {
        _account: string;
        _vaultId: number;
        _redeemAmount: BigNumber;
        _round: number;
      }
    >;

    CancelWithdraw(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _redeemAmount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      {
        _account: string;
        _vaultId: number;
        _redeemAmount: BigNumber;
        _round: number;
      }
    >;

    "Deposit(address,uint8,uint256,uint16)"(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _amount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      { _account: string; _vaultId: number; _amount: BigNumber; _round: number }
    >;

    Deposit(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _amount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      { _account: string; _vaultId: number; _amount: BigNumber; _round: number }
    >;

    "InitiateWithdraw(address,uint8,uint256,uint16)"(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _redeemAmount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      {
        _account: string;
        _vaultId: number;
        _redeemAmount: BigNumber;
        _round: number;
      }
    >;

    InitiateWithdraw(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _redeemAmount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      {
        _account: string;
        _vaultId: number;
        _redeemAmount: BigNumber;
        _round: number;
      }
    >;

    "Withdraw(address,uint8,uint256,uint16)"(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _amount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      { _account: string; _vaultId: number; _amount: BigNumber; _round: number }
    >;

    Withdraw(
      _account?: string | null,
      _vaultId?: BigNumberish | null,
      _amount?: null,
      _round?: null
    ): TypedEventFilter<
      [string, number, BigNumber, number],
      { _account: string; _vaultId: number; _amount: BigNumber; _round: number }
    >;
  };

  estimateGas: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    deposit(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    depositETH(
      _vaultId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getUserState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getVaultState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initiateWithraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
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

    withdraw(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    bidOption(
      _vaultId: BigNumberish,
      _premiumRate: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    clearBidding(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    collectOptionHolderValues(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    deposit(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    depositETH(
      _vaultId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    expireOptions(
      _expiryParameters: { expiryLevel: BigNumberish; vaultId: BigNumberish }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getUserState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getVaultState(
      _vaultId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initiateWithraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
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

    withdraw(
      _vaultId: BigNumberish,
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
