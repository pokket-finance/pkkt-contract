/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IOptionVaultManager,
  IOptionVaultManagerInterface,
} from "../IOptionVaultManager";

const _abi = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_whitelistAddresses",
        type: "address[]",
      },
    ],
    name: "addToWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8[]",
        name: "_vaultIds",
        type: "uint8[]",
      },
    ],
    name: "buyOptions",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "collectOptionHolderValues",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "expiryLevel",
            type: "uint128",
          },
          {
            internalType: "uint8",
            name: "vaultId",
            type: "uint8",
          },
        ],
        internalType: "struct StructureData.ExpiredOptionParameters[]",
        name: "_expired",
        type: "tuple[]",
      },
    ],
    name: "expireOptions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "expiredHistory",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "amount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "strike",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "expiryLevel",
            type: "uint128",
          },
          {
            internalType: "uint16",
            name: "round",
            type: "uint16",
          },
          {
            internalType: "uint8",
            name: "vaultId",
            type: "uint8",
          },
          {
            internalType: "uint16",
            name: "premiumRate",
            type: "uint16",
          },
          {
            internalType: "uint256",
            name: "optionHolderValue",
            type: "uint256",
          },
        ],
        internalType: "struct StructureData.ExpiredVaultState[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "vaultId",
            type: "uint8",
          },
          {
            internalType: "uint128",
            name: "maxCapacity",
            type: "uint128",
          },
          {
            internalType: "uint8",
            name: "environment",
            type: "uint8",
          },
        ],
        internalType: "struct StructureData.KickOffOptionParameters[]",
        name: "_kickoffs",
        type: "tuple[]",
      },
    ],
    name: "kickOffOptions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "optionHolderValues",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "asset",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct StructureData.CollectableValue[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_delistAddresses",
        type: "address[]",
      },
    ],
    name: "removeFromWhitelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "strike",
            type: "uint128",
          },
          {
            internalType: "uint16",
            name: "premiumRate",
            type: "uint16",
          },
          {
            internalType: "uint8",
            name: "vaultId",
            type: "uint8",
          },
        ],
        internalType: "struct StructureData.OnGoingOptionParameters[]",
        name: "_cutoff",
        type: "tuple[]",
      },
    ],
    name: "sellOptions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "vaultId",
            type: "uint8",
          },
          {
            internalType: "uint128",
            name: "maxCapacity",
            type: "uint128",
          },
        ],
        internalType: "struct StructureData.CapacityParameters[]",
        name: "_capacities",
        type: "tuple[]",
      },
    ],
    name: "setCapacities",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "whitelistTraders",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class IOptionVaultManager__factory {
  static readonly abi = _abi;
  static createInterface(): IOptionVaultManagerInterface {
    return new utils.Interface(_abi) as IOptionVaultManagerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IOptionVaultManager {
    return new Contract(address, _abi, signerOrProvider) as IOptionVaultManager;
  }
}
