/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  OptionVaultBaseV2,
  OptionVaultBaseV2Interface,
} from "../OptionVaultBaseV2";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldAdmin",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldManager",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newManager",
        type: "address",
      },
    ],
    name: "ManagerChanged",
    type: "event",
  },
  {
    inputs: [],
    name: "adminRoleAddress",
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
    inputs: [
      {
        internalType: "address",
        name: "_asset",
        type: "address",
      },
    ],
    name: "balanceEnough",
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
    name: "getMoneyMovements",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "blockTime",
            type: "uint256",
          },
          {
            internalType: "int128",
            name: "movementAmount",
            type: "int128",
          },
          {
            internalType: "address",
            name: "asset",
            type: "address",
          },
        ],
        internalType: "struct StructureData.MoneyMovementResult[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initiateSettlement",
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
    inputs: [],
    name: "sendBackAssets",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "_parameters",
        type: "uint256[]",
      },
    ],
    name: "setOptionParameters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "enum StructureData.OptionExecution[]",
        name: "_execution",
        type: "uint8[]",
      },
    ],
    name: "settle",
    outputs: [],
    stateMutability: "nonpayable",
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
    inputs: [
      {
        internalType: "uint8",
        name: "_pairId",
        type: "uint8",
      },
    ],
    name: "toggleOptionPairDeposit",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "whitelist",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawAssets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class OptionVaultBaseV2__factory {
  static readonly abi = _abi;
  static createInterface(): OptionVaultBaseV2Interface {
    return new utils.Interface(_abi) as OptionVaultBaseV2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): OptionVaultBaseV2 {
    return new Contract(address, _abi, signerOrProvider) as OptionVaultBaseV2;
  }
}
