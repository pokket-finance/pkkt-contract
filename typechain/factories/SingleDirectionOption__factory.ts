/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  SingleDirectionOption,
  SingleDirectionOptionInterface,
} from "../SingleDirectionOption";

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
    inputs: [],
    name: "isWhitelisted",
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
  "0x608060405234801561001057600080fd5b50613098806100206000396000f3fe60806040526004361061011f5760003560e01c80637f649783116100a0578063ca0502a411610064578063ca0502a4146103ae578063d5da2bab146103ce578063f4d4c9d71461046a578063f63168591461048a578063fc9b03331461049d57600080fd5b80637f649783146102e357806396721fbf14610303578063a7c6a10014610323578063ac4b8a6414610356578063ad70c3c71461038e57600080fd5b806326161ec6116100e757806326161ec6146101c45780633f48991414610253578063548db17414610273578063611b4095146102935780637332655b146102c357600080fd5b806306a45d3f1461012457806315dc9bd81461015a5780631b3580491461017c578063222f6b8314610191578063256d43d7146101b1575b600080fd5b34801561013057600080fd5b5061014461013f366004612b1d565b6104bf565b6040516101519190612ce2565b60405180910390f35b34801561016657600080fd5b5061017a6101753660046125ca565b6105a1565b005b34801561018857600080fd5b5061017a61070e565b34801561019d57600080fd5b5061017a6101ac366004612b37565b610860565b61017a6101bf366004612b1d565b610912565b3480156101d057600080fd5b506101e46101df366004612b1d565b610ac0565b6040516101519190600060e0820190506001600160801b038084511683528060208501511660208401528060408501511660408401528060608501511660608401528060808501511660808401528060a08501511660a08401525061ffff60c08401511660c083015292915050565b34801561025f57600080fd5b5061017a61026e366004612b37565b610c76565b34801561027f57600080fd5b5061017a61028e36600461252a565b610de2565b34801561029f57600080fd5b503360009081526006602052604090205460ff166040519015158152602001610151565b3480156102cf57600080fd5b5061017a6102de366004612b37565b610e82565b3480156102ef57600080fd5b5061017a6102fe36600461252a565b610eff565b34801561030f57600080fd5b5061017a61031e36600461280e565b610f9f565b34801561032f57600080fd5b5060015461034490600160a01b900460ff1681565b60405160ff9091168152602001610151565b34801561036257600080fd5b50600154610376906001600160a01b031681565b6040516001600160a01b039091168152602001610151565b34801561039a57600080fd5b5061017a6103a9366004612681565b6111f9565b3480156103ba57600080fd5b5061017a6103c9366004612738565b61170f565b3480156103da57600080fd5b5061042f6103e9366004612b1d565b6002602052600090815260409020805460019091015460ff8083169261010081048216926001600160a01b036201000090920482169291811691600160a01b9091041685565b6040805160ff96871681529590941660208601526001600160a01b03928316938501939093521660608301521515608082015260a001610151565b34801561047657600080fd5b5061017a610485366004612b37565b611911565b61017a6104983660046128d8565b611ad2565b3480156104a957600080fd5b506104b2611e6c565b6040516101519190612bc6565b6104c76123bd565b600154829060ff600160a01b9091048116908216106105015760405162461bcd60e51b81526004016104f890612c71565b60405180910390fd5b60ff83166000908152600460208190526040918290209151630aaf5c2360e21b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__90632abd708c906024016101e06040518083038186803b15801561056157600080fd5b505af4158015610575573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105999190612a3b565b949350505050565b6001546001600160a01b031633146105cb5760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a5760008282815181106105f957634e487b7160e01b600052603260045260246000fd5b602090810291909101810151805160ff166000908152600490925260408220600581015460028201548254939550919392610662926001600160801b03600160801b840481169361065c9390821692610656929182169116612058565b90612058565b9061206d565b905082602001516001600160801b03168111156106b55760405162461bcd60e51b815260206004820152601160248201527013585e0810d85c081d1bdbc81cdb585b1b607a1b60448201526064016104f8565b50602090910151600190910180546001600160801b0390921666010000000000000275ffffffffffffffffffffffffffffffff000000000000199092169190911790558061070281612fe1565b9150506105ce565b5050565b3360009081526006602052604090205460ff1661073d5760405162461bcd60e51b81526004016104f890612c9a565b6000541561075d5760405162461bcd60e51b81526004016104f890612c51565b60016000908155338152600560205260408120905b600154600160a81b900460ff168110156108585760ff81166000908152600360209081526040808320546001600160a01b031680845291859052909120548015610843576001600160a01b0382166000818152602086905260408082209190915551631a4ca37b60e21b815233600482015260248101839052604481019190915273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9060640160006040518083038186803b15801561082a57600080fd5b505af415801561083e573d6000803e3d6000fd5b505050505b5050808061085090612fe1565b915050610772565b505060008055565b600154829060ff600160a01b9091048116908216106108915760405162461bcd60e51b81526004016104f890612c71565b60ff8316600090815260046020819052604091829020915163f6d4a19560e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9263f6d4a195926108dd923391889101612d5d565b60006040518083038186803b1580156108f557600080fd5b505af4158015610909573d6000803e3d6000fd5b50505050505050565b600154819060ff600160a01b9091048116908216106109435760405162461bcd60e51b81526004016104f890612c71565b600054156109635760405162461bcd60e51b81526004016104f890612c51565b60016000553461099e5760405162461bcd60e51b81526020600482015260066024820152652176616c756560d01b60448201526064016104f8565b60ff82166000908152600260205260409020546201000090046001600160a01b031680156109f75760405162461bcd60e51b81526004016104f8906020808252600490820152630428aa8960e31b604082015260600190565b60ff83166000908152600460205260409020600181015463ffffffff16610a4b5760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b60448201526064016104f8565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c90610a8690849033903490600401612d5d565b60006040518083038186803b158015610a9e57600080fd5b505af4158015610ab2573d6000803e3d6000fd5b505060008055505050505050565b6040805160e081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c0810191909152600154829060ff600160a01b909104811690821610610b2a5760405162461bcd60e51b81526004016104f890612c71565b60ff83166000908152600460208190526040808320905163f38f29dd60e01b8152918201819052919073__$e36f5330ef2566ea8a183e1e27b10de643$__9063f38f29dd90602401604080518083038186803b158015610b8957600080fd5b505af4158015610b9d573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610bc19190612ae7565b33600090815260098501602052604090819020905163a8a328e760e01b8152600481018690526024810182905261ffff83166044820152919350915073__$e36f5330ef2566ea8a183e1e27b10de643$__9063a8a328e79060640160e06040518083038186803b158015610c3457600080fd5b505af4158015610c48573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610c6c9190612985565b9695505050505050565b600154829060ff600160a01b909104811690821610610ca75760405162461bcd60e51b81526004016104f890612c71565b60005415610cc75760405162461bcd60e51b81526004016104f890612c51565b6001600090815560ff84168152600460208190526040918290209151631d48b99160e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__92637522e64492610d17923391889101612d5d565b60006040518083038186803b158015610d2f57600080fd5b505af4158015610d43573d6000803e3d6000fd5b5050505060ff831660009081526002602052604090819020549051631a4ca37b60e21b815233600482015260248101849052620100009091046001600160a01b0316604482015273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9060640160006040518083038186803b158015610dc157600080fd5b505af4158015610dd5573d6000803e3d6000fd5b5050600080555050505050565b6001546001600160a01b03163314610e0c5760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a57600060066000848481518110610e3e57634e487b7160e01b600052603260045260246000fd5b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610e7a81612fe1565b915050610e0f565b600154829060ff600160a01b909104811690821610610eb35760405162461bcd60e51b81526004016104f890612c71565b60ff831660009081526004602081905260409182902091516347e5296160e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__926347e52961926108dd923391889101612d5d565b6001546001600160a01b03163314610f295760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a57600160066000848481518110610f5b57634e487b7160e01b600052603260045260246000fd5b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610f9781612fe1565b915050610f2c565b6001546001600160a01b03163314610fc95760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a576000828281518110610ff757634e487b7160e01b600052603260045260246000fd5b602002602001015190506000816020015161ffff16116110445760405162461bcd60e51b8152602060048201526008602482015267217072656d69756d60c01b60448201526064016104f8565b80516001600160801b03166110855760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b60448201526064016104f8565b60408181015160ff16600090815260046020819052908290209151631d319eb160e31b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b1580156110e757600080fd5b505af41580156110fb573d6000803e3d6000fd5b50505050600181810154640100000000900461ffff16116111515760405162461bcd60e51b815260206004820152601060248201526f139bc81cd95b1b1a5b99c81c9bdd5b9960821b60448201526064016104f8565b600481015460028201906001600160a01b0316156111a05760405162461bcd60e51b815260206004820152600c60248201526b105b1c9958591e481cdbdb1960a21b60448201526064016104f8565b82516001909101805460209094015161ffff16600160801b0271ffffffffffffffffffffffffffffffffffff199094166001600160801b03909216919091179290921790915550806111f181612fe1565b915050610fcc565b6001546001600160a01b031633146112235760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a57600082828151811061125157634e487b7160e01b600052603260045260246000fd5b60200260200101519050600081600001516001600160801b0316116112a75760405162461bcd60e51b815260206004820152600c60248201526b08595e1c1a5c9e53195d995b60a21b60448201526064016104f8565b60208181015160ff1660009081526004918290526040908190209051631d319eb160e31b81529182018190529073__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b15801561130b57600080fd5b505af415801561131f573d6000803e3d6000fd5b505050506001810154600264010000000090910461ffff16116113775760405162461bcd60e51b815260206004820152601060248201526f139bc8195e1c1a5c9959081c9bdd5b9960821b60448201526064016104f8565b6005810180546001600160801b0316158061139d575060028101546001600160a01b0316155b156113aa575050506116fd565b60018101546001600160801b03166113ee5760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b60448201526064016104f8565b6020838101805160ff90811660009081526002909352604080842054925182168452832060010154620100009092046001600160a01b03169291600160a01b90041661147357845160018401546001600160801b039182169116116114545760006114ad565b8451600184015461146e91906001600160801b0316612f5b565b6114ad565b600183015485516001600160801b039182169116116114935760006114ad565b600183015485516114ad916001600160801b031690612f5b565b6002808501546001600160a01b031660009081526005602090815260408083208a83015160ff9081168552949092528220600101546001600160801b0394909416945092909161153991600160a01b9004166115165760018601546001600160801b0316611519565b87515b86546001600160801b039182169161153391879116612079565b90612085565b905061154481612091565b6001600160a01b038416600090815260208390526040902054611568908290612058565b6001600160a01b03851660009081526020849052604081206001600160801b0392831690556001870154875491926115b592859261065c929190911690600160801b900461ffff166120de565b86549091506000906115e0906001600160801b03166115336115d96008600a612e94565b8590612079565b90506115eb81612091565b8088600801600060028b60010160049054906101000a900461ffff166116119190612f83565b61ffff1681526020810191909152604001600090812080546001600160801b0319166001600160801b03938416179055885490916116619180821691611533918791600160801b90910416612079565b8954909150600090611684908390600160801b90046001600160801b0316612058565b905061168f81612091565b89546001600160801b03908116600160801b83831602178b5560028b01546000916116bf9116610656878661206d565b90506116ca81612091565b60029a909a0180546001600160801b0319166001600160801b03909b169a909a1790995550506000909555505050505050505b8061170781612fe1565b915050611226565b6001546001600160a01b031633146117395760405162461bcd60e51b81526004016104f890612cc0565b60005b815181101561070a57600082828151811061176757634e487b7160e01b600052603260045260246000fd5b602090810291909101810151805160ff16600090815260049092526040909120600181015491925090640100000000900461ffff16156117de5760405162461bcd60e51b815260206004820152601260248201527130b63932b0b23c9035b4b1b5b2b21037b33360711b60448201526064016104f8565b6000826040015160ff1660001415611804576117fd4262093a80612058565b905061182e565b826040015160ff1660011415611820576117fd42610e10612058565b61182b42603c612058565b90505b63ffffffff8111156118765760405162461bcd60e51b815260206004820152601160248201527013dd995c999b1bddc818dd5d13d999905d607a1b60448201526064016104f8565b60019091018054602084015160409094015165ffff000000001960ff909116600160b01b021676ff00000000000000000000000000000000ffff00000000196001600160801b0390951666010000000000000275ffffffffffffffffffffffffffffffff0000ffffffff1990921663ffffffff909416939093171792909216176401000000001790558061190981612fe1565b91505061173c565b600154829060ff600160a01b9091048116908216106119425760405162461bcd60e51b81526004016104f890612c71565b600054156119625760405162461bcd60e51b81526004016104f890612c51565b60016000558161199e5760405162461bcd60e51b815260206004820152600760248201526608585b5bdd5b9d60ca1b60448201526064016104f8565b60ff83166000908152600260205260409020546201000090046001600160a01b0316806119f35760405162461bcd60e51b815260206004820152600360248201526208aa8960eb1b60448201526064016104f8565b60ff84166000908152600460205260409020600181015463ffffffff16611a475760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b60448201526064016104f8565b611a5c6001600160a01b0383163330876120fa565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c90611a9790849033908990600401612d5d565b60006040518083038186803b158015611aaf57600080fd5b505af4158015611ac3573d6000803e3d6000fd5b50506000805550505050505050565b3360009081526006602052604090205460ff16611b015760405162461bcd60e51b81526004016104f890612c9a565b60005415611b215760405162461bcd60e51b81526004016104f890612c51565b60016000908155805b8251811015611de3576000838281518110611b5557634e487b7160e01b600052603260045260246000fd5b602002602001015190506000600460008360ff1660ff168152602001908152602001600020905073__$e36f5330ef2566ea8a183e1e27b10de643$__63e98cf588826040518263ffffffff1660e01b8152600401611bb591815260200190565b60006040518083038186803b158015611bcd57600080fd5b505af4158015611be1573d6000803e3d6000fd5b505050506002810180546001600160801b0316611c325760405162461bcd60e51b815260206004820152600f60248201526e139bdd1a1a5b99c81d1bc81cd95b1b608a1b60448201526064016104f8565b60028101546001600160a01b031615611c7c5760405162461bcd60e51b815260206004820152600c60248201526b105b1c9958591e481cdbdb1960a21b60448201526064016104f8565b6005820154600090611ca0906001600160801b03600160801b820481169116612f5b565b6001600160801b03161115611d4157600082600801600060028560010160049054906101000a900461ffff16611cd69190612f83565b61ffff1681526020810191909152604001600020546001600160801b031611611d415760405162461bcd60e51b815260206004820152601e60248201527f457870697279206c6576656c206e6f742073706563696669656420796574000060448201526064016104f8565b60018101548154600091611d69916001600160801b031690600160801b900461ffff1661215a565b60ff85166000908152600260205260409020549091506201000090046001600160a01b031680611da457611d9d8783612058565b9650611db9565b611db96001600160a01b0382163330856120fa565b505060020180546001600160a01b0319163317905550819050611ddb81612fe1565b915050611b2a565b5034811015611e255760405162461bcd60e51b815260206004820152600e60248201526d09cdee840cadcdeeaced040cae8d60931b60448201526064016104f8565b3481111561085857336108fc611e3b3484612f9e565b6040518115909202916000818181858888f19350505050158015611e63573d6000803e3d6000fd5b50505060008055565b3360009081526006602052604090205460609060ff16611e9e5760405162461bcd60e51b81526004016104f890612c9a565b33600090815260056020526040812090805b600154600160a81b900460ff16811015611f175760ff81166000908152600360209081526040808320546001600160a01b031680845291869052909120548015611f025783611efe81612fe1565b9450505b50508080611f0f90612fe1565b915050611eb0565b506000816001600160401b03811115611f4057634e487b7160e01b600052604160045260246000fd5b604051908082528060200260200182016040528015611f8557816020015b6040805180820190915260008082526020820152815260200190600190039081611f5e5790505b50905081611f97579250612055915050565b6000915060005b600154600160a81b900460ff1681101561204f5760ff81166000908152600360209081526040808320546001600160a01b03168084529187905290912054801561203a576040518060400160405280836001600160a01b031681526020018281525084868151811061202057634e487b7160e01b600052603260045260246000fd5b6020026020010181905250848061203690612fe1565b9550505b5050808061204790612fe1565b915050611f9e565b50925050505b90565b60006120648284612e19565b90505b92915050565b60006120648284612f9e565b60006120648284612f3c565b60006120648284612e31565b6001600160801b038111156120db5760405162461bcd60e51b815260206004820152601060248201526f09eeccae4ccd8deee40ead2dce86264760831b60448201526064016104f8565b50565b60006120646127106115336120f38583612e19565b8690612079565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b17905261215490859061216c565b50505050565b60006120646127106115338585612079565b60006121c1826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166122439092919063ffffffff16565b80519091501561223e57808060200190518101906121df9190612965565b61223e5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016104f8565b505050565b6060612252848460008561225c565b90505b9392505050565b6060824710156122bd5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016104f8565b843b61230b5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016104f8565b600080866001600160a01b031685876040516123279190612baa565b60006040518083038185875af1925050503d8060008114612364576040519150601f19603f3d011682016040523d82523d6000602084013e612369565b606091505b5091509150612379828286612384565b979650505050505050565b60608315612393575081612255565b8251156123a35782518084602001fd5b8160405162461bcd60e51b81526004016104f89190612c1e565b6040805160e08101825260008082526020820181905291810182905260608101829052608081019190915260a0810161241d6040805160a08101825260008082526020820181905291810182905260608101829052608081019190915290565b81526040805160a0810182526000808252602082810182905292820181905260608201819052608082015291015290565b600060a0828403121561245f578081fd5b60405160a081018181106001600160401b038211171561248157612481613012565b806040525080915082516124948161303d565b815260208301516124a48161303d565b602082015260408301516124b78161303d565b604082015260608301516124ca81613052565b606082015260808301516124dd81613028565b6080919091015292915050565b80516124f58161303d565b919050565b80516124f581613052565b805163ffffffff811681146124f557600080fd5b803560ff811681146124f557600080fd5b6000602080838503121561253c578182fd5b82356001600160401b03811115612551578283fd5b8301601f81018513612561578283fd5b803561257461256f82612df6565b612dc6565b80828252848201915084840188868560051b8701011115612593578687fd5b8694505b838510156125be5780356125aa81613028565b835260019490940193918501918501612597565b50979650505050505050565b600060208083850312156125dc578182fd5b82356001600160401b038111156125f1578283fd5b8301601f81018513612601578283fd5b803561260f61256f82612df6565b80828252848201915084840188868560061b870101111561262e578687fd5b8694505b838510156125be57604080828b03121561264a578788fd5b612652612d7c565b61265b83612519565b81528783013561266a8161303d565b818901528452600195909501949286019201612632565b60006020808385031215612693578182fd5b82356001600160401b038111156126a8578283fd5b8301601f810185136126b8578283fd5b80356126c661256f82612df6565b80828252848201915084840188868560061b87010111156126e5578687fd5b8694505b838510156125be57604080828b031215612701578788fd5b612709612d7c565b82356127148161303d565b8152612721838901612519565b8189015284526001959095019492860192016126e9565b6000602080838503121561274a578182fd5b82356001600160401b0381111561275f578283fd5b8301601f8101851361276f578283fd5b803561277d61256f82612df6565b818152838101908385016060808502860187018a101561279b578788fd5b8795505b848610156128005780828b0312156127b5578788fd5b6127bd612da4565b6127c683612519565b8152878301356127d58161303d565b8189015260406127e6848201612519565b90820152845260019590950194928601929081019061279f565b509098975050505050505050565b60006020808385031215612820578182fd5b82356001600160401b03811115612835578283fd5b8301601f81018513612845578283fd5b803561285361256f82612df6565b818152838101908385016060808502860187018a1015612871578788fd5b8795505b848610156128005780828b03121561288b578788fd5b612893612da4565b823561289e8161303d565b8152828801356128ad81613052565b8189015260406128be848201612519565b908201528452600195909501949286019290810190612875565b600060208083850312156128ea578182fd5b82356001600160401b038111156128ff578283fd5b8301601f8101851361290f578283fd5b803561291d61256f82612df6565b80828252848201915084840188868560051b870101111561293c578687fd5b8694505b838510156125be5761295181612519565b835260019490940193918501918501612940565b600060208284031215612976578081fd5b81518015158114612255578182fd5b600060e08284031215612996578081fd5b60405160e081018181106001600160401b03821117156129b8576129b8613012565b60405282516129c68161303d565b815260208301516129d68161303d565b602082015260408301516129e98161303d565b604082015260608301516129fc8161303d565b6060820152612a0d608084016124ea565b6080820152612a1e60a084016124ea565b60a0820152612a2f60c084016124fa565b60c08201529392505050565b60006101e08284031215612a4d578081fd5b60405160e081018181106001600160401b0382111715612a6f57612a6f613012565b6040528251612a7d8161303d565b81526020830151612a8d8161303d565b6020820152612a9e60408401612505565b60408201526060830151612ab181613052565b6060820152612ac2608084016124ea565b6080820152612ad48460a0850161244e565b60a0820152612a2f84610140850161244e565b60008060408385031215612af9578081fd5b612b0283612505565b91506020830151612b1281613052565b809150509250929050565b600060208284031215612b2e578081fd5b61206482612519565b60008060408385031215612b49578182fd5b612b5283612519565b946020939093013593505050565b80516001600160801b0390811683526020808301518216908401526040808301519091169083015260608082015161ffff16908301526080908101516001600160a01b0316910152565b60008251612bbc818460208701612fb5565b9190910192915050565b602080825282518282018190526000919060409081850190868401855b82811015612c1157815180516001600160a01b03168552860151868501529284019290850190600101612be3565b5091979650505050505050565b6020815260008251806020840152612c3d816040850160208701612fb5565b601f01601f19169190910160400192915050565b6020808252600690820152651b1bd8dad95960d21b604082015260600190565b6020808252600f908201526e125b9d985b1a59081d985d5b1d1259608a1b604082015260600190565b6020808252600c908201526b085dda1a5d195b1a5cdd195960a21b604082015260600190565b60208082526008908201526710b6b0b730b3b2b960c11b604082015260600190565b60006101e0820190506001600160801b0380845116835280602085015116602084015263ffffffff604085015116604084015261ffff60608501511660608401528060808501511660808401525060a0830151612d4260a0840182612b60565b5060c0830151612d56610140840182612b60565b5092915050565b9283526001600160a01b03919091166020830152604082015260600190565b604080519081016001600160401b0381118282101715612d9e57612d9e613012565b60405290565b604051606081016001600160401b0381118282101715612d9e57612d9e613012565b604051601f8201601f191681016001600160401b0381118282101715612dee57612dee613012565b604052919050565b60006001600160401b03821115612e0f57612e0f613012565b5060051b60200190565b60008219821115612e2c57612e2c612ffc565b500190565b600082612e4c57634e487b7160e01b81526012600452602481fd5b500490565b600181815b80851115612e8c578160001904821115612e7257612e72612ffc565b80851615612e7f57918102915b93841c9390800290612e56565b509250929050565b60006120648383600082612eaa57506001612067565b81612eb757506000612067565b8160018114612ecd5760028114612ed757612ef3565b6001915050612067565b60ff841115612ee857612ee8612ffc565b50506001821b612067565b5060208310610133831016604e8410600b8410161715612f16575081810a612067565b612f208383612e51565b8060001904821115612f3457612f34612ffc565b029392505050565b6000816000190483118215151615612f5657612f56612ffc565b500290565b60006001600160801b0383811690831681811015612f7b57612f7b612ffc565b039392505050565b600061ffff83811690831681811015612f7b57612f7b612ffc565b600082821015612fb057612fb0612ffc565b500390565b60005b83811015612fd0578181015183820152602001612fb8565b838111156121545750506000910152565b6000600019821415612ff557612ff5612ffc565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b03811681146120db57600080fd5b6001600160801b03811681146120db57600080fd5b61ffff811681146120db57600080fdfea2646970667358221220e80af11bc29304200c862cbd26c8352dc2d9228240b70d36ee1efea780f3e03064736f6c63430008040033";

type SingleDirectionOptionConstructorParams =
  | [
      linkLibraryAddresses: SingleDirectionOptionLibraryAddresses,
      signer?: Signer
    ]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SingleDirectionOptionConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => {
  return (
    typeof xs[0] === "string" ||
    (Array.isArray as (arg: any) => arg is readonly any[])(xs[0]) ||
    "_isInterface" in xs[0]
  );
};

export class SingleDirectionOption__factory extends ContractFactory {
  constructor(...args: SingleDirectionOptionConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      const [linkLibraryAddresses, signer] = args;
      super(
        _abi,
        SingleDirectionOption__factory.linkBytecode(linkLibraryAddresses),
        signer
      );
    }
  }

  static linkBytecode(
    linkLibraryAddresses: SingleDirectionOptionLibraryAddresses
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
  ): Promise<SingleDirectionOption> {
    return super.deploy(overrides || {}) as Promise<SingleDirectionOption>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): SingleDirectionOption {
    return super.attach(address) as SingleDirectionOption;
  }
  connect(signer: Signer): SingleDirectionOption__factory {
    return super.connect(signer) as SingleDirectionOption__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SingleDirectionOptionInterface {
    return new utils.Interface(_abi) as SingleDirectionOptionInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SingleDirectionOption {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as SingleDirectionOption;
  }
}

export interface SingleDirectionOptionLibraryAddresses {
  ["contracts/libraries/OptionLifecycle.sol:OptionLifecycle"]: string;
}
