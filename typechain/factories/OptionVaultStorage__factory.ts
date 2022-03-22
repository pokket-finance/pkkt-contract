/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  OptionVaultStorage,
  OptionVaultStorageInterface,
} from "../OptionVaultStorage";

const _abi = [
  {
    inputs: [],
    name: "currentRound",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    name: "executionAccountingResult",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "depositAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollCounterPartyAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollCounterPartyPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedCounterPartyAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedCounterPartyPremium",
            type: "uint128",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
        ],
        internalType: "struct StructureData.SettlementAccountingResult",
        name: "callOptionResult",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint128",
            name: "depositAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollCounterPartyAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "autoRollCounterPartyPremium",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedCounterPartyAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "releasedCounterPartyPremium",
            type: "uint128",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
        ],
        internalType: "struct StructureData.SettlementAccountingResult",
        name: "putOptionResult",
        type: "tuple",
      },
      {
        internalType: "enum StructureData.OptionExecution",
        name: "execute",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "optionPairCount",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    name: "optionPairs",
    outputs: [
      {
        internalType: "uint8",
        name: "callOptionId",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "putOptionId",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "depositAssetAmountDecimals",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "counterPartyAssetAmountDecimals",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "depositAsset",
        type: "address",
      },
      {
        internalType: "address",
        name: "counterPartyAsset",
        type: "address",
      },
      {
        internalType: "bool",
        name: "manualDepositDisabled",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "settlementCashflowResult",
    outputs: [
      {
        internalType: "uint128",
        name: "newDepositAmount",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "newReleasedAmount",
        type: "uint128",
      },
      {
        internalType: "int128",
        name: "leftOverAmount",
        type: "int128",
      },
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "underSettlement",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class OptionVaultStorage__factory {
  static readonly abi = _abi;
  static createInterface(): OptionVaultStorageInterface {
    return new utils.Interface(_abi) as OptionVaultStorageInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OptionVaultStorage {
    return new Contract(address, _abi, signerOrProvider) as OptionVaultStorage;
  }
}
