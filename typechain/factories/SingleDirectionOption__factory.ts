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
  "0x608060405234801561001057600080fd5b50612de0806100206000396000f3fe6080604052600436106100fe5760003560e01c80637f64978311610095578063ca0502a411610064578063ca0502a41461030a578063d5da2bab1461032a578063f4d4c9d7146103c6578063f6316859146103e6578063fc9b0333146103f957600080fd5b80637f6497831461027257806396721fbf14610292578063ac4b8a64146102b2578063ad70c3c7146102ea57600080fd5b806326161ec6116100d157806326161ec6146101835780633f48991414610212578063548db174146102325780637332655b1461025257600080fd5b806306a45d3f146101035780631b35804914610139578063222f6b8314610150578063256d43d714610170575b600080fd5b34801561010f57600080fd5b5061012361011e366004612865565b61041b565b6040516101309190612a2a565b60405180910390f35b34801561014557600080fd5b5061014e6104fd565b005b34801561015c57600080fd5b5061014e61016b36600461287f565b61064f565b61014e61017e366004612865565b610701565b34801561018f57600080fd5b506101a361019e366004612865565b6108af565b6040516101309190600060e0820190506001600160801b038084511683528060208501511660208401528060408501511660408401528060608501511660608401528060808501511660808401528060a08501511660a08401525061ffff60c08401511660c083015292915050565b34801561021e57600080fd5b5061014e61022d36600461287f565b610a65565b34801561023e57600080fd5b5061014e61024d366004612329565b610bd1565b34801561025e57600080fd5b5061014e61026d36600461287f565b610c75565b34801561027e57600080fd5b5061014e61028d366004612329565b610cf2565b34801561029e57600080fd5b5061014e6102ad366004612556565b610d92565b3480156102be57600080fd5b506001546102d2906001600160a01b031681565b6040516001600160a01b039091168152602001610130565b3480156102f657600080fd5b5061014e6103053660046123c9565b610fec565b34801561031657600080fd5b5061014e610325366004612480565b61150e565b34801561033657600080fd5b5061038b610345366004612865565b6002602052600090815260409020805460019091015460ff8083169261010081048216926001600160a01b036201000090920482169291811691600160a01b9091041685565b6040805160ff96871681529590941660208601526001600160a01b03928316938501939093521660608301521515608082015260a001610130565b3480156103d257600080fd5b5061014e6103e136600461287f565b611710565b61014e6103f4366004612620565b6118d1565b34801561040557600080fd5b5061040e611c6b565b604051610130919061290e565b6104236121bc565b600154829060ff600160a01b90910481169082161061045d5760405162461bcd60e51b8152600401610454906129b9565b60405180910390fd5b60ff83166000908152600460208190526040918290209151630aaf5c2360e21b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__90632abd708c906024016101e06040518083038186803b1580156104bd57600080fd5b505af41580156104d1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104f59190612783565b949350505050565b3360009081526006602052604090205460ff1661052c5760405162461bcd60e51b8152600401610454906129e2565b6000541561054c5760405162461bcd60e51b815260040161045490612999565b60016000908155338152600560205260408120905b600154600160a81b900460ff168110156106475760ff81166000908152600360209081526040808320546001600160a01b031680845291859052909120548015610632576001600160a01b0382166000818152602086905260408082209190915551631a4ca37b60e21b815233600482015260248101839052604481019190915273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9060640160006040518083038186803b15801561061957600080fd5b505af415801561062d573d6000803e3d6000fd5b505050505b5050808061063f90612d29565b915050610561565b505060008055565b600154829060ff600160a01b9091048116908216106106805760405162461bcd60e51b8152600401610454906129b9565b60ff8316600090815260046020819052604091829020915163f6d4a19560e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9263f6d4a195926106cc923391889101612aa5565b60006040518083038186803b1580156106e457600080fd5b505af41580156106f8573d6000803e3d6000fd5b50505050505050565b600154819060ff600160a01b9091048116908216106107325760405162461bcd60e51b8152600401610454906129b9565b600054156107525760405162461bcd60e51b815260040161045490612999565b60016000553461078d5760405162461bcd60e51b81526020600482015260066024820152652176616c756560d01b6044820152606401610454565b60ff82166000908152600260205260409020546201000090046001600160a01b031680156107e65760405162461bcd60e51b8152600401610454906020808252600490820152630428aa8960e31b604082015260600190565b60ff83166000908152600460205260409020600181015463ffffffff1661083a5760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b6044820152606401610454565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c9061087590849033903490600401612aa5565b60006040518083038186803b15801561088d57600080fd5b505af41580156108a1573d6000803e3d6000fd5b505060008055505050505050565b6040805160e081018252600080825260208201819052918101829052606081018290526080810182905260a0810182905260c0810191909152600154829060ff600160a01b9091048116908216106109195760405162461bcd60e51b8152600401610454906129b9565b60ff83166000908152600460208190526040808320905163f38f29dd60e01b8152918201819052919073__$e36f5330ef2566ea8a183e1e27b10de643$__9063f38f29dd90602401604080518083038186803b15801561097857600080fd5b505af415801561098c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109b0919061282f565b33600090815260098501602052604090819020905163a8a328e760e01b8152600481018690526024810182905261ffff83166044820152919350915073__$e36f5330ef2566ea8a183e1e27b10de643$__9063a8a328e79060640160e06040518083038186803b158015610a2357600080fd5b505af4158015610a37573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a5b91906126cd565b9695505050505050565b600154829060ff600160a01b909104811690821610610a965760405162461bcd60e51b8152600401610454906129b9565b60005415610ab65760405162461bcd60e51b815260040161045490612999565b6001600090815560ff84168152600460208190526040918290209151631d48b99160e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__92637522e64492610b06923391889101612aa5565b60006040518083038186803b158015610b1e57600080fd5b505af4158015610b32573d6000803e3d6000fd5b5050505060ff831660009081526002602052604090819020549051631a4ca37b60e21b815233600482015260248101849052620100009091046001600160a01b0316604482015273__$e36f5330ef2566ea8a183e1e27b10de643$__906369328dec9060640160006040518083038186803b158015610bb057600080fd5b505af4158015610bc4573d6000803e3d6000fd5b5050600080555050505050565b6001546001600160a01b03163314610bfb5760405162461bcd60e51b815260040161045490612a08565b60005b8151811015610c7157600060066000848481518110610c2d57634e487b7160e01b600052603260045260246000fd5b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610c6981612d29565b915050610bfe565b5050565b600154829060ff600160a01b909104811690821610610ca65760405162461bcd60e51b8152600401610454906129b9565b60ff831660009081526004602081905260409182902091516347e5296160e01b815273__$e36f5330ef2566ea8a183e1e27b10de643$__926347e52961926106cc923391889101612aa5565b6001546001600160a01b03163314610d1c5760405162461bcd60e51b815260040161045490612a08565b60005b8151811015610c7157600160066000848481518110610d4e57634e487b7160e01b600052603260045260246000fd5b6020908102919091018101516001600160a01b03168252810191909152604001600020805460ff191691151591909117905580610d8a81612d29565b915050610d1f565b6001546001600160a01b03163314610dbc5760405162461bcd60e51b815260040161045490612a08565b60005b8151811015610c71576000828281518110610dea57634e487b7160e01b600052603260045260246000fd5b602002602001015190506000816020015161ffff1611610e375760405162461bcd60e51b8152602060048201526008602482015267217072656d69756d60c01b6044820152606401610454565b80516001600160801b0316610e785760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b6044820152606401610454565b60408181015160ff16600090815260046020819052908290209151631d319eb160e31b815290810182905273__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b158015610eda57600080fd5b505af4158015610eee573d6000803e3d6000fd5b50505050600181810154640100000000900461ffff1611610f445760405162461bcd60e51b815260206004820152601060248201526f139bc81cd95b1b1a5b99c81c9bdd5b9960821b6044820152606401610454565b600481015460028201906001600160a01b031615610f935760405162461bcd60e51b815260206004820152600c60248201526b105b1c9958591e481cdbdb1960a21b6044820152606401610454565b82516001909101805460209094015161ffff16600160801b0271ffffffffffffffffffffffffffffffffffff199094166001600160801b0390921691909117929092179091555080610fe481612d29565b915050610dbf565b6001546001600160a01b031633146110165760405162461bcd60e51b815260040161045490612a08565b60005b8151811015610c7157600082828151811061104457634e487b7160e01b600052603260045260246000fd5b60200260200101519050600081600001516001600160801b03161161109a5760405162461bcd60e51b815260206004820152600c60248201526b08595e1c1a5c9e53195d995b60a21b6044820152606401610454565b60208181015160ff1660009081526004918290526040908190209051631d319eb160e31b81529182018190529073__$e36f5330ef2566ea8a183e1e27b10de643$__9063e98cf5889060240160006040518083038186803b1580156110fe57600080fd5b505af4158015611112573d6000803e3d6000fd5b505050506001810154600264010000000090910461ffff161161116a5760405162461bcd60e51b815260206004820152601060248201526f139bc8195e1c1a5c9959081c9bdd5b9960821b6044820152606401610454565b6005810180546001600160801b03161580611190575060028101546001600160a01b0316155b1561119d575050506114fc565b60018101546001600160801b03166111e15760405162461bcd60e51b815260206004820152600760248201526621737472696b6560c81b6044820152606401610454565b6020838101805160ff90811660009081526002909352604080842054925182168452832060010154620100009092046001600160a01b03169291600160a01b90041661126657845160018401546001600160801b039182169116116112475760006112a0565b8451600184015461126191906001600160801b0316612ca3565b6112a0565b600183015485516001600160801b039182169116116112865760006112a0565b600183015485516112a0916001600160801b031690612ca3565b6002808501546001600160a01b031660009081526005602090815260408083208a83015160ff9081168552949092528220600101546001600160801b0394909416945092909161132c91600160a01b9004166113095760018601546001600160801b031661130c565b87515b86546001600160801b039182169161132691879116611e57565b90611e6c565b905061133781611e78565b6001600160a01b03841660009081526020839052604090205461135b908290611ec5565b6001600160a01b03851660009081526020849052604081206001600160801b0392831690556001870154875491926113ae9285926113a8929190911690600160801b900461ffff16611ed1565b90611eed565b86549091506000906113d9906001600160801b03166113266113d26008600a612bdc565b8590611e57565b90506113e481611e78565b8088600801600060028b60010160049054906101000a900461ffff1661140a9190612ccb565b61ffff1681526020810191909152604001600090812080546001600160801b0319166001600160801b039384161790558854909161145a9180821691611326918791600160801b90910416611e57565b895490915060009061147d908390600160801b90046001600160801b0316611ec5565b905061148881611e78565b89546001600160801b03908116600160801b83831602178b5560028b01546000916114be91166114b88786611eed565b90611ec5565b90506114c981611e78565b60029a909a0180546001600160801b0319166001600160801b03909b169a909a1790995550506000909555505050505050505b8061150681612d29565b915050611019565b6001546001600160a01b031633146115385760405162461bcd60e51b815260040161045490612a08565b60005b8151811015610c7157600082828151811061156657634e487b7160e01b600052603260045260246000fd5b602090810291909101810151805160ff16600090815260049092526040909120600181015491925090640100000000900461ffff16156115dd5760405162461bcd60e51b815260206004820152601260248201527130b63932b0b23c9035b4b1b5b2b21037b33360711b6044820152606401610454565b6000826040015160ff1660001415611603576115fc4262093a80611ec5565b905061162d565b826040015160ff166001141561161f576115fc42610e10611ec5565b61162a42603c611ec5565b90505b63ffffffff8111156116755760405162461bcd60e51b815260206004820152601160248201527013dd995c999b1bddc818dd5d13d999905d607a1b6044820152606401610454565b60019091018054602084015160409094015165ffff000000001960ff909116600160b01b021676ff00000000000000000000000000000000ffff00000000196001600160801b0390951666010000000000000275ffffffffffffffffffffffffffffffff0000ffffffff1990921663ffffffff909416939093171792909216176401000000001790558061170881612d29565b91505061153b565b600154829060ff600160a01b9091048116908216106117415760405162461bcd60e51b8152600401610454906129b9565b600054156117615760405162461bcd60e51b815260040161045490612999565b60016000558161179d5760405162461bcd60e51b815260206004820152600760248201526608585b5bdd5b9d60ca1b6044820152606401610454565b60ff83166000908152600260205260409020546201000090046001600160a01b0316806117f25760405162461bcd60e51b815260206004820152600360248201526208aa8960eb1b6044820152606401610454565b60ff84166000908152600460205260409020600181015463ffffffff166118465760405162461bcd60e51b8152602060048201526008602482015267085cdd185c9d195960c21b6044820152606401610454565b61185b6001600160a01b038316333087611ef9565b604051633f7c9c6360e21b815273__$e36f5330ef2566ea8a183e1e27b10de643$__9063fdf2718c9061189690849033908990600401612aa5565b60006040518083038186803b1580156118ae57600080fd5b505af41580156118c2573d6000803e3d6000fd5b50506000805550505050505050565b3360009081526006602052604090205460ff166119005760405162461bcd60e51b8152600401610454906129e2565b600054156119205760405162461bcd60e51b815260040161045490612999565b60016000908155805b8251811015611be257600083828151811061195457634e487b7160e01b600052603260045260246000fd5b602002602001015190506000600460008360ff1660ff168152602001908152602001600020905073__$e36f5330ef2566ea8a183e1e27b10de643$__63e98cf588826040518263ffffffff1660e01b81526004016119b491815260200190565b60006040518083038186803b1580156119cc57600080fd5b505af41580156119e0573d6000803e3d6000fd5b505050506002810180546001600160801b0316611a315760405162461bcd60e51b815260206004820152600f60248201526e139bdd1a1a5b99c81d1bc81cd95b1b608a1b6044820152606401610454565b60028101546001600160a01b031615611a7b5760405162461bcd60e51b815260206004820152600c60248201526b105b1c9958591e481cdbdb1960a21b6044820152606401610454565b6005820154600090611a9f906001600160801b03600160801b820481169116612ca3565b6001600160801b03161115611b4057600082600801600060028560010160049054906101000a900461ffff16611ad59190612ccb565b61ffff1681526020810191909152604001600020546001600160801b031611611b405760405162461bcd60e51b815260206004820152601e60248201527f457870697279206c6576656c206e6f74207370656369666965642079657400006044820152606401610454565b60018101548154600091611b68916001600160801b031690600160801b900461ffff16611f59565b60ff85166000908152600260205260409020549091506201000090046001600160a01b031680611ba357611b9c8783611ec5565b9650611bb8565b611bb86001600160a01b038216333085611ef9565b505060020180546001600160a01b0319163317905550819050611bda81612d29565b915050611929565b5034811015611c245760405162461bcd60e51b815260206004820152600e60248201526d09cdee840cadcdeeaced040cae8d60931b6044820152606401610454565b3481111561064757336108fc611c3a3484612ce6565b6040518115909202916000818181858888f19350505050158015611c62573d6000803e3d6000fd5b50505060008055565b3360009081526006602052604090205460609060ff16611c9d5760405162461bcd60e51b8152600401610454906129e2565b33600090815260056020526040812090805b600154600160a81b900460ff16811015611d165760ff81166000908152600360209081526040808320546001600160a01b031680845291869052909120548015611d015783611cfd81612d29565b9450505b50508080611d0e90612d29565b915050611caf565b506000816001600160401b03811115611d3f57634e487b7160e01b600052604160045260246000fd5b604051908082528060200260200182016040528015611d8457816020015b6040805180820190915260008082526020820152815260200190600190039081611d5d5790505b50905081611d96579250611e54915050565b6000915060005b600154600160a81b900460ff16811015611e4e5760ff81166000908152600360209081526040808320546001600160a01b031680845291879052909120548015611e39576040518060400160405280836001600160a01b0316815260200182815250848681518110611e1f57634e487b7160e01b600052603260045260246000fd5b60200260200101819052508480611e3590612d29565b9550505b50508080611e4690612d29565b915050611d9d565b50925050505b90565b6000611e638284612c84565b90505b92915050565b6000611e638284612b79565b6001600160801b03811115611ec25760405162461bcd60e51b815260206004820152601060248201526f09eeccae4ccd8deee40ead2dce86264760831b6044820152606401610454565b50565b6000611e638284612b61565b6000611e63612710611326611ee68583612b61565b8690611e57565b6000611e638284612ce6565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b179052611f53908590611f6b565b50505050565b6000611e636127106113268585611e57565b6000611fc0826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166120429092919063ffffffff16565b80519091501561203d5780806020019051810190611fde91906126ad565b61203d5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401610454565b505050565b6060612051848460008561205b565b90505b9392505050565b6060824710156120bc5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401610454565b843b61210a5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401610454565b600080866001600160a01b0316858760405161212691906128f2565b60006040518083038185875af1925050503d8060008114612163576040519150601f19603f3d011682016040523d82523d6000602084013e612168565b606091505b5091509150612178828286612183565b979650505050505050565b60608315612192575081612054565b8251156121a25782518084602001fd5b8160405162461bcd60e51b81526004016104549190612966565b6040805160e08101825260008082526020820181905291810182905260608101829052608081019190915260a0810161221c6040805160a08101825260008082526020820181905291810182905260608101829052608081019190915290565b81526040805160a0810182526000808252602082810182905292820181905260608201819052608082015291015290565b600060a0828403121561225e578081fd5b60405160a081018181106001600160401b038211171561228057612280612d5a565b8060405250809150825161229381612d85565b815260208301516122a381612d85565b602082015260408301516122b681612d85565b604082015260608301516122c981612d9a565b606082015260808301516122dc81612d70565b6080919091015292915050565b80516122f481612d85565b919050565b80516122f481612d9a565b805163ffffffff811681146122f457600080fd5b803560ff811681146122f457600080fd5b6000602080838503121561233b578182fd5b82356001600160401b03811115612350578283fd5b8301601f81018513612360578283fd5b803561237361236e82612b3e565b612b0e565b80828252848201915084840188868560051b8701011115612392578687fd5b8694505b838510156123bd5780356123a981612d70565b835260019490940193918501918501612396565b50979650505050505050565b600060208083850312156123db578182fd5b82356001600160401b038111156123f0578283fd5b8301601f81018513612400578283fd5b803561240e61236e82612b3e565b80828252848201915084840188868560061b870101111561242d578687fd5b8694505b838510156123bd57604080828b031215612449578788fd5b612451612ac4565b823561245c81612d85565b8152612469838901612318565b818901528452600195909501949286019201612431565b60006020808385031215612492578182fd5b82356001600160401b038111156124a7578283fd5b8301601f810185136124b7578283fd5b80356124c561236e82612b3e565b818152838101908385016060808502860187018a10156124e3578788fd5b8795505b848610156125485780828b0312156124fd578788fd5b612505612aec565b61250e83612318565b81528783013561251d81612d85565b81890152604061252e848201612318565b9082015284526001959095019492860192908101906124e7565b509098975050505050505050565b60006020808385031215612568578182fd5b82356001600160401b0381111561257d578283fd5b8301601f8101851361258d578283fd5b803561259b61236e82612b3e565b818152838101908385016060808502860187018a10156125b9578788fd5b8795505b848610156125485780828b0312156125d3578788fd5b6125db612aec565b82356125e681612d85565b8152828801356125f581612d9a565b818901526040612606848201612318565b9082015284526001959095019492860192908101906125bd565b60006020808385031215612632578182fd5b82356001600160401b03811115612647578283fd5b8301601f81018513612657578283fd5b803561266561236e82612b3e565b80828252848201915084840188868560051b8701011115612684578687fd5b8694505b838510156123bd5761269981612318565b835260019490940193918501918501612688565b6000602082840312156126be578081fd5b81518015158114612054578182fd5b600060e082840312156126de578081fd5b60405160e081018181106001600160401b038211171561270057612700612d5a565b604052825161270e81612d85565b8152602083015161271e81612d85565b6020820152604083015161273181612d85565b6040820152606083015161274481612d85565b6060820152612755608084016122e9565b608082015261276660a084016122e9565b60a082015261277760c084016122f9565b60c08201529392505050565b60006101e08284031215612795578081fd5b60405160e081018181106001600160401b03821117156127b7576127b7612d5a565b60405282516127c581612d85565b815260208301516127d581612d85565b60208201526127e660408401612304565b604082015260608301516127f981612d9a565b606082015261280a608084016122e9565b608082015261281c8460a0850161224d565b60a082015261277784610140850161224d565b60008060408385031215612841578081fd5b61284a83612304565b9150602083015161285a81612d9a565b809150509250929050565b600060208284031215612876578081fd5b611e6382612318565b60008060408385031215612891578182fd5b61289a83612318565b946020939093013593505050565b80516001600160801b0390811683526020808301518216908401526040808301519091169083015260608082015161ffff16908301526080908101516001600160a01b0316910152565b60008251612904818460208701612cfd565b9190910192915050565b602080825282518282018190526000919060409081850190868401855b8281101561295957815180516001600160a01b0316855286015186850152928401929085019060010161292b565b5091979650505050505050565b6020815260008251806020840152612985816040850160208701612cfd565b601f01601f19169190910160400192915050565b6020808252600690820152651b1bd8dad95960d21b604082015260600190565b6020808252600f908201526e125b9d985b1a59081d985d5b1d1259608a1b604082015260600190565b6020808252600c908201526b085dda1a5d195b1a5cdd195960a21b604082015260600190565b60208082526008908201526710b6b0b730b3b2b960c11b604082015260600190565b60006101e0820190506001600160801b0380845116835280602085015116602084015263ffffffff604085015116604084015261ffff60608501511660608401528060808501511660808401525060a0830151612a8a60a08401826128a8565b5060c0830151612a9e6101408401826128a8565b5092915050565b9283526001600160a01b03919091166020830152604082015260600190565b604080519081016001600160401b0381118282101715612ae657612ae6612d5a565b60405290565b604051606081016001600160401b0381118282101715612ae657612ae6612d5a565b604051601f8201601f191681016001600160401b0381118282101715612b3657612b36612d5a565b604052919050565b60006001600160401b03821115612b5757612b57612d5a565b5060051b60200190565b60008219821115612b7457612b74612d44565b500190565b600082612b9457634e487b7160e01b81526012600452602481fd5b500490565b600181815b80851115612bd4578160001904821115612bba57612bba612d44565b80851615612bc757918102915b93841c9390800290612b9e565b509250929050565b6000611e638383600082612bf257506001611e66565b81612bff57506000611e66565b8160018114612c155760028114612c1f57612c3b565b6001915050611e66565b60ff841115612c3057612c30612d44565b50506001821b611e66565b5060208310610133831016604e8410600b8410161715612c5e575081810a611e66565b612c688383612b99565b8060001904821115612c7c57612c7c612d44565b029392505050565b6000816000190483118215151615612c9e57612c9e612d44565b500290565b60006001600160801b0383811690831681811015612cc357612cc3612d44565b039392505050565b600061ffff83811690831681811015612cc357612cc3612d44565b600082821015612cf857612cf8612d44565b500390565b60005b83811015612d18578181015183820152602001612d00565b83811115611f535750506000910152565b6000600019821415612d3d57612d3d612d44565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b0381168114611ec257600080fd5b6001600160801b0381168114611ec257600080fd5b61ffff81168114611ec257600080fdfea2646970667358221220537b58e5725fa65a45bfdbd14c58809f77bf94ac638cc55fcd68e5fd8428d8df64736f6c63430008040033";

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
