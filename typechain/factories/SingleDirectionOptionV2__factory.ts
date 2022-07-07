/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  SingleDirectionOptionV2,
  SingleDirectionOptionV2Interface,
} from "../SingleDirectionOptionV2";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_redeemAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "_round",
        type: "uint16",
      },
    ],
    name: "CancelWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "_round",
        type: "uint16",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_redeemAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "_round",
        type: "uint16",
      },
    ],
    name: "InitiateWithdraw",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "_round",
        type: "uint16",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        internalType: "uint16",
        name: "_premiumRate",
        type: "uint16",
      },
    ],
    name: "bidOption",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_redeemAmount",
        type: "uint256",
      },
    ],
    name: "cancelWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "clearBidding",
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
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
    ],
    name: "depositETH",
    outputs: [],
    stateMutability: "payable",
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
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
    ],
    name: "getUserState",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "pending",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "redeemed",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "expiredAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "expiredQueuedRedeemAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "onGoingAmount",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "onGoingQueuedRedeemAmount",
            type: "uint128",
          },
          {
            internalType: "uint16",
            name: "lastUpdateRound",
            type: "uint16",
          },
        ],
        internalType: "struct StructureData.UserState",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
    ],
    name: "getVaultState",
    outputs: [
      {
        components: [
          {
            internalType: "uint128",
            name: "totalPending",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "totalRedeemed",
            type: "uint128",
          },
          {
            internalType: "uint32",
            name: "cutOffAt",
            type: "uint32",
          },
          {
            internalType: "uint16",
            name: "currentRound",
            type: "uint16",
          },
          {
            internalType: "uint128",
            name: "maxCapacity",
            type: "uint128",
          },
          {
            components: [
              {
                internalType: "uint128",
                name: "amount",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "queuedRedeemAmount",
                type: "uint128",
              },
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
                internalType: "address",
                name: "buyerAddress",
                type: "address",
              },
            ],
            internalType: "struct StructureData.OptionState",
            name: "onGoing",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint128",
                name: "amount",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "queuedRedeemAmount",
                type: "uint128",
              },
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
                internalType: "address",
                name: "buyerAddress",
                type: "address",
              },
            ],
            internalType: "struct StructureData.OptionState",
            name: "expired",
            type: "tuple",
          },
        ],
        internalType: "struct StructureData.VaultSnapShot",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_redeemAmount",
        type: "uint256",
      },
    ],
    name: "initiateWithraw",
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
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_vaultId",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50612ae1806100206000396000f3fe6080604052600436106100f35760003560e01c8063a7c6a1001161008a578063ca0502a411610059578063ca0502a4146102fa578063d5da2bab1461031a578063e0af4b73146103b6578063f4d4c9d7146103c957600080fd5b8063a7c6a10014610267578063ac4b8a641461029a578063ad70c3c7146102d2578063b0482c38146102f257600080fd5b806326161ec6116100c657806326161ec6146101785780633f489914146102075780637332655b1461022757806396721fbf1461024757600080fd5b806306a45d3f146100f85780631b3580491461012e578063222f6b8314610145578063256d43d714610165575b600080fd5b34801561010457600080fd5b50610118610113366004612553565b6103e9565b60405161012591906126f0565b60405180910390f35b34801561013a57600080fd5b506101436104bc565b005b34801561015157600080fd5b506101436101603660046125a3565b6105e8565b610143610173366004612553565b610694565b34801561018457600080fd5b50610198610193366004612553565b61083c565b6040516101259190600060e0820190506001600160801b038084511683528060208501511660208401528060408501511660408401528060608501511660608401528060808501511660808401528060a08501511660a08401525061ffff60c08401511660c083015292915050565b34801561021357600080fd5b506101436102223660046125a3565b610990565b34801561023357600080fd5b506101436102423660046125a3565b610af1565b34801561025357600080fd5b5061014361026236600461231a565b610b68565b34801561027357600080fd5b5060015461028890600160a01b900460ff1681565b60405160ff9091168152602001610125565b3480156102a657600080fd5b506001546102ba906001600160a01b031681565b6040516001600160a01b039091168152602001610125565b3480156102de57600080fd5b506101436102ed36600461217a565b610d7d565b610143611229565b34801561030657600080fd5b50610143610315366004612243565b6115cd565b34801561032657600080fd5b5061037b610335366004612553565b6002602052600090815260409020805460019091015460ff8083169261010081048216926001600160a01b036201000090920482169291811691600160a01b9091041685565b6040805160ff96871681529590941660208601526001600160a01b03928316938501939093521660608301521515608082015260a001610125565b6101436103c436600461256d565b611706565b3480156103d557600080fd5b506101436103e43660046125a3565b611b48565b6103f1612014565b8160ff811615801590610413575060015460ff600160a01b9091048116908216105b61041c57600080fd5b60ff83166000908152600460208190526040918290209151630aaf5c2360e21b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__90632abd708c906024016101e06040518083038186803b15801561047c57600080fd5b505af4158015610490573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104b491906124bc565b949350505050565b600054156104e55760405162461bcd60e51b81526004016104dc90612688565b60405180910390fd5b60016000908155338152600560205260408120905b600154600160a01b900460ff168110156105e05760ff81166000908152600260209081526040808320546201000090046001600160a01b0316808452918590529091205480156105cb576001600160a01b0382166000908152602085905260408082209190915551631a4ca37b60e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9061059a90339085908790600401612632565b60006040518083038186803b1580156105b257600080fd5b505af41580156105c6573d6000803e3d6000fd5b505050505b505080806105d890612a3c565b9150506104fa565b505060008055565b8160ff81161580159061060a575060015460ff600160a01b9091048116908216105b61061357600080fd5b60ff8316600090815260046020819052604091829020915163f6d4a19560e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9263f6d4a1959261065f92339188910161276b565b60006040518083038186803b15801561067757600080fd5b505af415801561068b573d6000803e3d6000fd5b50505050505050565b8060ff8116158015906106b6575060015460ff600160a01b9091048116908216105b6106bf57600080fd5b600054156106df5760405162461bcd60e51b81526004016104dc90612688565b60016000553461071a5760405162461bcd60e51b81526020600482015260066024820152652176616c756560d01b60448201526064016104dc565b60ff82166000908152600260205260409020546201000090046001600160a01b031680156107735760405162461bcd60e51b81526004016104dc906020808252600490820152630428aa8960e31b604082015260600190565b60ff83166000908152600460205260409020600181015463ffffffff166107c75760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b60448201526064016104dc565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c906108029084903390349060040161276b565b60006040518083038186803b15801561081a57600080fd5b505af415801561082e573d6000803e3d6000fd5b505060008055505050505050565b6040805160e081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c08101919091528160ff811615801590610897575060015460ff600160a01b9091048116908216105b6108a057600080fd5b60ff83166000908152600460205260409020600181015461ffff640100000000820416904263ffffffff909116116108e0576108dd81600161284e565b90505b33600090815260098301602052604090819020905163a8a328e760e01b8152600481018490526024810182905261ffff8316604482015273__$e36f5330ef2566ea8a183e1e27b10de643$__9063a8a328e79060640160e06040518083038186803b15801561094e57600080fd5b505af4158015610962573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109869190612405565b9695505050505050565b8160ff8116158015906109b2575060015460ff600160a01b9091048116908216105b6109bb57600080fd5b600054156109db5760405162461bcd60e51b81526004016104dc90612688565b6001600090815560ff84168152600460208190526040918290209151631d48b99160e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__92637522e64492610a2b92339188910161276b565b60006040518083038186803b158015610a4357600080fd5b505af4158015610a57573d6000803e3d6000fd5b5050505060ff831660009081526002602052604090819020549051631a4ca37b60e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__916369328dec91610ab891339187916201000090046001600160a01b031690600401612632565b60006040518083038186803b158015610ad057600080fd5b505af4158015610ae4573d6000803e3d6000fd5b5050600080555050505050565b8160ff811615801590610b13575060015460ff600160a01b9091048116908216105b610b1c57600080fd5b60ff831660009081526004602081905260409182902091516347e5296160e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__926347e529619261065f92339188910161276b565b60005b8151811015610d79576000828281518110610b9657634e487b7160e01b600052603260045260246000fd5b602002602001015190506000816020015161ffff1611610be35760405162461bcd60e51b8152602060048201526008602482015267217072656d69756d60c01b60448201526064016104dc565b80516001600160801b0316610c245760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b60448201526064016104dc565b60408181015160ff16600090815260046020819052908290209151631d319eb160e31b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b158015610c8657600080fd5b505af4158015610c9a573d6000803e3d6000fd5b50505050600181810154640100000000900461ffff1611610cf05760405162461bcd60e51b815260206004820152601060248201526f139bc81cd95b1b1a5b99c81c9bdd5b9960821b60448201526064016104dc565b600481015460028201906001600160a01b031615610d205760405162461bcd60e51b81526004016104dc906126ca565b82516001909101805460209094015161ffff16600160801b0271ffffffffffffffffffffffffffffffffffff199094166001600160801b0390921691909117929092179091555080610d7181612a3c565b915050610b6b565b5050565b6001546001600160a01b03163314610da75760405162461bcd60e51b81526004016104dc906126a8565b60005b8151811015610d79576000828281518110610dd557634e487b7160e01b600052603260045260246000fd5b60200260200101519050600081600001516001600160801b031611610e2b5760405162461bcd60e51b815260206004820152600c60248201526b08595e1c1a5c9e53195d995b60a21b60448201526064016104dc565b60208181015160ff1660009081526004918290526040908190209051631d319eb160e31b81529182018190529073__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b158015610e8f57600080fd5b505af4158015610ea3573d6000803e3d6000fd5b505050506001810154600264010000000090910461ffff1611610efb5760405162461bcd60e51b815260206004820152601060248201526f139bc8195e1c1a5c9959081c9bdd5b9960821b60448201526064016104dc565b6005810180546001600160801b03161580610f21575060028101546001600160a01b0316155b15610f2e57505050611217565b60018101546001600160801b0316610f725760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b60448201526064016104dc565b6020838101805160ff90811660009081526002909352604080842054925182168452832060010154620100009092046001600160a01b03169291600160a01b900416610ff757845160018401546001600160801b03918216911611610fd8576000611031565b84516001840154610ff291906001600160801b03166129b6565b611031565b600183015485516001600160801b03918216911611611017576000611031565b60018301548551611031916001600160801b0316906129b6565b60028401546001600160a01b0316600090815260056020526040812087516001600160801b039384169450909261107f91166110796110726008600a6128ef565b8690611d03565b90611d18565b90508086600801600060028960010160049054906101000a900461ffff166110a791906129de565b61ffff1681526020810191909152604001600090812080546001600160801b0319166001600160801b039384161790558851875491926110f1929181169161107991889116611d03565b6001600160a01b038616600090815260208590526040902054909150611118908290611d24565b6001600160a01b03861660009081526020859052604081206001600160801b03928316905560018801548854919261116b928592611165929190911690600160801b900461ffff16611d30565b90611d45565b8754909150600090611196906001600160801b0380821691611079918691600160801b900416611d03565b89549091506111b6908290600160801b90046001600160801b0316611d24565b89546001600160801b03918216600160801b02908216178a5560028a01546111e991166111e38484611d45565b90611d24565b60029990990180546001600160801b0319166001600160801b03909a16999099179098555050505050505050505b8061122181612a3c565b915050610daa565b6001546001600160a01b031633146112535760405162461bcd60e51b81526004016104dc906126a8565b600054156112735760405162461bcd60e51b81526004016104dc90612688565b600160009081555b600154600160a01b900460ff168110156115c65760ff81166000908152600460205260409020600180820154640100000000900461ffff16116112f15760405162461bcd60e51b815260206004820152600e60248201526d139bdd1a1a5b99c81d1bc8189a5960921b60448201526064016104dc565b600481015460028201906001600160a01b0316156113215760405162461bcd60e51b81526004016104dc906126ca565b60008060005b60ff81166000908152600a60205260409020546001600160a01b03168061134e5750611397565b60ff80881660009081526009602090815260408083209386168352929052205461ffff908116908516811115611382578293505b5050808061138f90612a3c565b915050611327565b5061ffff82166113aa57505050506115b4565b60ff81166000908152600a60205260408120546002850180546001600160a01b0319166001600160a01b039092169190911790555b60ff81166000908152600a60205260409020546001600160a01b03168061140657506115ae565b8260ff1682141561143f575060ff8087166000908152600960209081526040808320938516835292905220805461ffff1916905561159c565b60ff87811660009081526009602090815260408083209386168352929052908120805461ffff198116909155865461ffff9091169190611488906001600160801b031683611d51565b60ff8a166000908152600260205260409020549091506201000090046001600160a01b03168061152b5773__$e36f5330ef2566ea8a183e1e27b10de643$__6369328dec336114d78534611d24565b846040518463ffffffff1660e01b81526004016114f693929190612632565b60006040518083038186803b15801561150e57600080fd5b505af4158015611522573d6000803e3d6000fd5b50505050611597565b604051631a4ca37b60e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9061156690339086908690600401612632565b60006040518083038186803b15801561157e57600080fd5b505af4158015611592573d6000803e3d6000fd5b505050505b505050505b806115a681612a3c565b9150506113df565b50505050505b806115be81612a3c565b91505061127b565b5060008055565b6001546001600160a01b031633146115f75760405162461bcd60e51b81526004016104dc906126a8565b60005b8151811015610d7957600082828151811061162557634e487b7160e01b600052603260045260246000fd5b602090810291909101810151805160ff166000908152600490925260409091206001810154919250904263ffffffff909116111561169a5760405162461bcd60e51b815260206004820152601260248201527130b63932b0b23c9035b4b1b5b2b21037b33360711b60448201526064016104dc565b6116a74262093a80611d24565b600190910180546020909301516001600160801b031666010000000000000275ffffffffffffffffffffffffffffffff0000ffffffff1990931663ffffffff9290921691909117919091179055806116fe81612a3c565b9150506115fa565b600054156117265760405162461bcd60e51b81526004016104dc90612688565b6001600081815560ff8416815260046020526040902080820154909164010000000090910461ffff161161178d5760405162461bcd60e51b815260206004820152600e60248201526d139bdd1a1a5b99c81d1bc8189a5960921b60448201526064016104dc565b600481015460028201906001600160a01b0316156117bd5760405162461bcd60e51b81526004016104dc906126ca565b600181015461ffff808516600160801b9092041611156118165760405162461bcd60e51b81526020600482015260146024820152737072656d69756d207261746520746f6f206c6f7760601b60448201526064016104dc565b6000805b60ff81166000908152600a60205260409020546001600160a01b0316338114156118475781925050611893565b6001600160a01b038116611880575060ff81166000908152600a6020526040902080546001600160a01b03191633179055905080611893565b508061188b81612a3c565b91505061181a565b5060ff8581166000908152600960209081526040808320938516835292905220805461ffff86811661ffff19831681179093551690811015611a055760006118f66118e561ffff888116908516611d45565b85546001600160801b031690611d51565b60ff88166000908152600260205260409020549091506201000090046001600160a01b0316806119e957813410156119705760405162461bcd60e51b815260206004820152601760248201527f6e6f7420656e6f756768207072656d69756d2073656e7400000000000000000060448201526064016104dc565b813411156119e457604051631a4ca37b60e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec906119b390339086908690600401612632565b60006040518083038186803b1580156119cb57600080fd5b505af41580156119df573d6000803e3d6000fd5b505050505b6119fe565b6119fe6001600160a01b038216333085611d63565b5050611b3c565b8061ffff168561ffff161015611b3c576000611a2b6118e561ffff848116908916611d45565b60ff88166000908152600260205260409020549091506201000090046001600160a01b031680611ace5773__$e36f5330ef2566ea8a183e1e27b10de643$__6369328dec33611a7a8534611d24565b846040518463ffffffff1660e01b8152600401611a9993929190612632565b60006040518083038186803b158015611ab157600080fd5b505af4158015611ac5573d6000803e3d6000fd5b5050505061082e565b604051631a4ca37b60e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec90611b0990339086908690600401612632565b60006040518083038186803b158015611b2157600080fd5b505af4158015611b35573d6000803e3d6000fd5b5050505050505b50506000805550505050565b8160ff811615801590611b6a575060015460ff600160a01b9091048116908216105b611b7357600080fd5b60005415611b935760405162461bcd60e51b81526004016104dc90612688565b600160005581611bcf5760405162461bcd60e51b815260206004820152600760248201526608585b5bdd5b9d60ca1b60448201526064016104dc565b60ff83166000908152600260205260409020546201000090046001600160a01b031680611c245760405162461bcd60e51b815260206004820152600360248201526208aa8960eb1b60448201526064016104dc565b60ff84166000908152600460205260409020600181015463ffffffff16611c785760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b60448201526064016104dc565b611c8d6001600160a01b038316333087611d63565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c90611cc89084903390899060040161276b565b60006040518083038186803b158015611ce057600080fd5b505af4158015611cf4573d6000803e3d6000fd5b50506000805550505050505050565b6000611d0f8284612997565b90505b92915050565b6000611d0f828461288c565b6000611d0f8284612874565b6000611d0f6127106110796110728583612874565b6000611d0f82846129f9565b6000611d0f6127106110798585611d03565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b179052611dbd908590611dc3565b50505050565b6000611e18826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316611e9a9092919063ffffffff16565b805190915015611e955780806020019051810190611e3691906123e5565b611e955760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016104dc565b505050565b6060611ea98484600085611eb3565b90505b9392505050565b606082471015611f145760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016104dc565b843b611f625760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016104dc565b600080866001600160a01b03168587604051611f7e9190612616565b60006040518083038185875af1925050503d8060008114611fbb576040519150601f19603f3d011682016040523d82523d6000602084013e611fc0565b606091505b5091509150611fd0828286611fdb565b979650505050505050565b60608315611fea575081611eac565b825115611ffa5782518084602001fd5b8160405162461bcd60e51b81526004016104dc9190612655565b6040805160e08101825260008082526020820181905291810182905260608101829052608081019190915260a081016120746040805160a08101825260008082526020820181905291810182905260608101829052608081019190915290565b81526040805160a0810182526000808252602082810182905292820181905260608201819052608082015291015290565b600060a082840312156120b6578081fd5b60405160a0810181811067ffffffffffffffff821117156120d9576120d9612a6d565b806040525080915082516120ec81612a83565b815260208301516120fc81612a83565b6020820152604083015161210f81612a83565b6040820152606083015161212281612a9b565b606082015260808301516001600160a01b038116811461214157600080fd5b6080919091015292915050565b805161215981612a83565b919050565b805161215981612a9b565b803560ff8116811461215957600080fd5b6000602080838503121561218c578182fd5b823567ffffffffffffffff8111156121a2578283fd5b8301601f810185136121b2578283fd5b80356121c56121c08261282a565b6127f9565b80828252848201915084840188868560061b87010111156121e4578687fd5b8694505b8385101561223757604080828b031215612200578788fd5b61220861278a565b823561221381612a83565b8152612220838901612169565b8189015284526001959095019492860192016121e8565b50979650505050505050565b60006020808385031215612255578182fd5b823567ffffffffffffffff81111561226b578283fd5b8301601f8101851361227b578283fd5b80356122896121c08261282a565b818152838101908385016060808502860187018a10156122a7578788fd5b8795505b8486101561230c5780828b0312156122c1578788fd5b6122c96127b3565b6122d283612169565b8152878301356122e181612a83565b8189015260406122f2848201612169565b9082015284526001959095019492860192908101906122ab565b509098975050505050505050565b6000602080838503121561232c578182fd5b823567ffffffffffffffff811115612342578283fd5b8301601f81018513612352578283fd5b80356123606121c08261282a565b818152838101908385016060808502860187018a101561237e578788fd5b8795505b8486101561230c5780828b031215612398578788fd5b6123a06127b3565b82356123ab81612a83565b8152828801356123ba81612a9b565b8189015260406123cb848201612169565b908201528452600195909501949286019290810190612382565b6000602082840312156123f6578081fd5b81518015158114611eac578182fd5b600060e08284031215612416578081fd5b60405160e0810181811067ffffffffffffffff8211171561243957612439612a6d565b604052825161244781612a83565b8152602083015161245781612a83565b6020820152604083015161246a81612a83565b6040820152606083015161247d81612a83565b606082015261248e6080840161214e565b608082015261249f60a0840161214e565b60a08201526124b060c0840161215e565b60c08201529392505050565b60006101e082840312156124ce578081fd5b6124d66127d6565b82516124e181612a83565b815260208301516124f181612a83565b6020820152604083015163ffffffff8116811461250c578283fd5b604082015261251d6060840161215e565b606082015261252e6080840161214e565b60808201526125408460a085016120a5565b60a08201526124b08461014085016120a5565b600060208284031215612564578081fd5b611d0f82612169565b6000806040838503121561257f578081fd5b61258883612169565b9150602083013561259881612a9b565b809150509250929050565b600080604083850312156125b5578182fd5b6125be83612169565b946020939093013593505050565b80516001600160801b0390811683526020808301518216908401526040808301519091169083015260608082015161ffff16908301526080908101516001600160a01b0316910152565b60008251612628818460208701612a10565b9190910192915050565b6001600160a01b0393841681526020810192909252909116604082015260600190565b6020815260008251806020840152612674816040850160208701612a10565b601f01601f19169190910160400192915050565b6020808252600690820152651b1bd8dad95960d21b604082015260600190565b60208082526008908201526710b6b0b730b3b2b960c11b604082015260600190565b6020808252600c908201526b105b1c9958591e481cdbdb1960a21b604082015260600190565b60006101e0820190506001600160801b0380845116835280602085015116602084015263ffffffff604085015116604084015261ffff60608501511660608401528060808501511660808401525060a083015161275060a08401826125cc565b5060c08301516127646101408401826125cc565b5092915050565b9283526001600160a01b03919091166020830152604082015260600190565b6040805190810167ffffffffffffffff811182821017156127ad576127ad612a6d565b60405290565b6040516060810167ffffffffffffffff811182821017156127ad576127ad612a6d565b60405160e0810167ffffffffffffffff811182821017156127ad576127ad612a6d565b604051601f8201601f1916810167ffffffffffffffff8111828210171561282257612822612a6d565b604052919050565b600067ffffffffffffffff82111561284457612844612a6d565b5060051b60200190565b600061ffff80831681851680830382111561286b5761286b612a57565b01949350505050565b6000821982111561288757612887612a57565b500190565b6000826128a757634e487b7160e01b81526012600452602481fd5b500490565b600181815b808511156128e75781600019048211156128cd576128cd612a57565b808516156128da57918102915b93841c93908002906128b1565b509250929050565b6000611d0f838360008261290557506001611d12565b8161291257506000611d12565b816001811461292857600281146129325761294e565b6001915050611d12565b60ff84111561294357612943612a57565b50506001821b611d12565b5060208310610133831016604e8410600b8410161715612971575081810a611d12565b61297b83836128ac565b806000190482111561298f5761298f612a57565b029392505050565b60008160001904831182151516156129b1576129b1612a57565b500290565b60006001600160801b03838116908316818110156129d6576129d6612a57565b039392505050565b600061ffff838116908316818110156129d6576129d6612a57565b600082821015612a0b57612a0b612a57565b500390565b60005b83811015612a2b578181015183820152602001612a13565b83811115611dbd5750506000910152565b6000600019821415612a5057612a50612a57565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160801b0381168114612a9857600080fd5b50565b61ffff81168114612a9857600080fdfea26469706673582212204f3f321f01b0032c9e9d26c99acffe8b47177930873426e6ca1d9ea6cc88170764736f6c63430008040033";

type SingleDirectionOptionV2ConstructorParams =
  | [
      linkLibraryAddresses: SingleDirectionOptionV2LibraryAddresses,
      signer?: Signer
    ]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SingleDirectionOptionV2ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => {
  return (
    typeof xs[0] === "string" ||
    (Array.isArray as (arg: any) => arg is readonly any[])(xs[0]) ||
    "_isInterface" in xs[0]
  );
};

export class SingleDirectionOptionV2__factory extends ContractFactory {
  constructor(...args: SingleDirectionOptionV2ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      const [linkLibraryAddresses, signer] = args;
      super(
        _abi,
        SingleDirectionOptionV2__factory.linkBytecode(linkLibraryAddresses),
        signer
      );
    }
  }

  static linkBytecode(
    linkLibraryAddresses: SingleDirectionOptionV2LibraryAddresses
  ): string {
    let linkedBytecode = _bytecode;

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$e36f5330ef2566ea8a183e1e27b10de643\\$__", "g"),
      linkLibraryAddresses[
        "contracts/libraries/OptionLifecycle.sol:OptionLifecycle"
      ]
        .replace(/^0x/, "")
        .toLowerCase()
    );

    return linkedBytecode;
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<SingleDirectionOptionV2> {
    return super.deploy(overrides || {}) as Promise<SingleDirectionOptionV2>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): SingleDirectionOptionV2 {
    return super.attach(address) as SingleDirectionOptionV2;
  }
  connect(signer: Signer): SingleDirectionOptionV2__factory {
    return super.connect(signer) as SingleDirectionOptionV2__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SingleDirectionOptionV2Interface {
    return new utils.Interface(_abi) as SingleDirectionOptionV2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SingleDirectionOptionV2 {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as SingleDirectionOptionV2;
  }
}

export interface SingleDirectionOptionV2LibraryAddresses {
  ["contracts/libraries/OptionLifecycle.sol:OptionLifecycle"]: string;
}
