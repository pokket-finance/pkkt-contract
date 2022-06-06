/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  OptionVaultManager,
  OptionVaultManagerInterface,
} from "../OptionVaultManager";

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
        name: "_expiryParameters",
        type: "tuple[]",
      },
    ],
    name: "expireOptions",
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
    name: "managerRoleAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
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
        name: "_ongoingParameters",
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
    name: "vaultCount",
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
    name: "vaultDefinitions",
    outputs: [
      {
        internalType: "uint8",
        name: "vaultId",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "assetAmountDecimals",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "underlying",
        type: "address",
      },
      {
        internalType: "bool",
        name: "callOrPut",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class OptionVaultManager__factory {
  static readonly abi = _abi;
  static createInterface(): OptionVaultManagerInterface {
    return new utils.Interface(_abi) as OptionVaultManagerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OptionVaultManager {
    return new Contract(address, _abi, signerOrProvider) as OptionVaultManager;
  }
}
