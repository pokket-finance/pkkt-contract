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

interface SingleDirectionOptionStaticInterface extends ethers.utils.Interface {
  functions: {
    "addToWhitelist(address[])": FunctionFragment;
    "addVaults((uint8,uint8,address,address,bool)[])": FunctionFragment;
    "buyOptions(uint8[])": FunctionFragment;
    "cancelWithdraw(uint8,uint256)": FunctionFragment;
    "collectOptionHolderValues()": FunctionFragment;
    "deposit(uint8,uint256)": FunctionFragment;
    "depositETH(uint8)": FunctionFragment;
    "expireOptions((uint128,uint8)[])": FunctionFragment;
    "getUserState(uint8)": FunctionFragment;
    "getVaultState(uint8)": FunctionFragment;
    "initiateWithraw(uint8,uint256)": FunctionFragment;
    "kickOffOptions((uint8,uint128,uint8)[])": FunctionFragment;
    "managerRoleAddress()": FunctionFragment;
    "optionHolderValues()": FunctionFragment;
    "owner()": FunctionFragment;
    "removeFromWhitelist(address[])": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "sellOptions((uint128,uint16,uint8)[])": FunctionFragment;
    "setCapacities((uint8,uint128)[])": FunctionFragment;
    "setManager(address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "vaultCount()": FunctionFragment;
    "vaultDefinitions(uint8)": FunctionFragment;
    "withdraw(uint8,uint256)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addToWhitelist",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "addVaults",
    values: [
      {
        vaultId: BigNumberish;
        assetAmountDecimals: BigNumberish;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "buyOptions",
    values: [BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "cancelWithdraw",
    values: [BigNumberish, BigNumberish]
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
    functionFragment: "optionHolderValues",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "removeFromWhitelist",
    values: [string[]]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
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
    functionFragment: "setCapacities",
    values: [{ vaultId: BigNumberish; maxCapacity: BigNumberish }[]]
  ): string;
  encodeFunctionData(functionFragment: "setManager", values: [string]): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
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

  decodeFunctionResult(
    functionFragment: "addToWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "addVaults", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "buyOptions", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "cancelWithdraw",
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
    functionFragment: "optionHolderValues",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeFromWhitelist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
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
  decodeFunctionResult(functionFragment: "setManager", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vaultCount", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "vaultDefinitions",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export type OwnershipTransferredEvent = TypedEvent<
  [string, string] & { previousOwner: string; newOwner: string }
>;

export class SingleDirectionOptionStatic extends BaseContract {
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

  interface: SingleDirectionOptionStaticInterface;

  functions: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    addVaults(
      _vaultDefinitions: {
        vaultId: BigNumberish;
        assetAmountDecimals: BigNumberish;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<
      [([string, BigNumber] & { asset: string; amount: BigNumber })[]]
    >;

    owner(overrides?: CallOverrides): Promise<[string]>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    sellOptions(
      _ongoingParameters: {
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

    setManager(
      _manager: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
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

  addToWhitelist(
    _whitelistAddresses: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  addVaults(
    _vaultDefinitions: {
      vaultId: BigNumberish;
      assetAmountDecimals: BigNumberish;
      asset: string;
      underlying: string;
      callOrPut: boolean;
    }[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  buyOptions(
    _vaultIds: BigNumberish[],
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancelWithdraw(
    _vaultId: BigNumberish,
    _redeemAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
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

  optionHolderValues(
    overrides?: CallOverrides
  ): Promise<([string, BigNumber] & { asset: string; amount: BigNumber })[]>;

  owner(overrides?: CallOverrides): Promise<string>;

  removeFromWhitelist(
    _delistAddresses: string[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  sellOptions(
    _ongoingParameters: {
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

  setManager(
    _manager: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
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
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    addVaults(
      _vaultDefinitions: {
        vaultId: BigNumberish;
        assetAmountDecimals: BigNumberish;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }[],
      overrides?: CallOverrides
    ): Promise<void>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: CallOverrides
    ): Promise<void>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

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

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<([string, BigNumber] & { asset: string; amount: BigNumber })[]>;

    owner(overrides?: CallOverrides): Promise<string>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    sellOptions(
      _ongoingParameters: {
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

    setManager(_manager: string, overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: string,
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
    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;

    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): TypedEventFilter<
      [string, string],
      { previousOwner: string; newOwner: string }
    >;
  };

  estimateGas: {
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    addVaults(
      _vaultDefinitions: {
        vaultId: BigNumberish;
        assetAmountDecimals: BigNumberish;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    optionHolderValues(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    sellOptions(
      _ongoingParameters: {
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

    setManager(
      _manager: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
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
    addToWhitelist(
      _whitelistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    addVaults(
      _vaultDefinitions: {
        vaultId: BigNumberish;
        assetAmountDecimals: BigNumberish;
        asset: string;
        underlying: string;
        callOrPut: boolean;
      }[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    buyOptions(
      _vaultIds: BigNumberish[],
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancelWithdraw(
      _vaultId: BigNumberish,
      _redeemAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
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

    optionHolderValues(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeFromWhitelist(
      _delistAddresses: string[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    sellOptions(
      _ongoingParameters: {
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

    setManager(
      _manager: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
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
