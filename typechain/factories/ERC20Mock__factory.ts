/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  utils,
  BigNumberish,
  Contract,
  ContractFactory,
  Overrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ERC20Mock, ERC20MockInterface } from "../ERC20Mock";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "supply",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "decimals_",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
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
    name: "decimals",
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
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162000c9f38038062000c9f8339810160408190526200003491620002cc565b8351849084906200004d90600390602085019062000173565b5080516200006390600490602084019062000173565b50506005805460ff191660ff8416179055506200008133836200008b565b50505050620003cd565b6001600160a01b038216620000e65760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b8060026000828254620000fa919062000355565b90915550506001600160a01b038216600090815260208190526040812080548392906200012990849062000355565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b82805462000181906200037a565b90600052602060002090601f016020900481019282620001a55760008555620001f0565b82601f10620001c057805160ff1916838001178555620001f0565b82800160010185558215620001f0579182015b82811115620001f0578251825591602001919060010190620001d3565b50620001fe92915062000202565b5090565b5b80821115620001fe576000815560010162000203565b600082601f8301126200022a578081fd5b81516001600160401b0380821115620002475762000247620003b7565b604051601f8301601f19908116603f01168101908282118183101715620002725762000272620003b7565b816040528381526020925086838588010111156200028e578485fd5b8491505b83821015620002b1578582018301518183018401529082019062000292565b83821115620002c257848385830101525b9695505050505050565b60008060008060808587031215620002e2578384fd5b84516001600160401b0380821115620002f9578586fd5b620003078883890162000219565b955060208701519150808211156200031d578485fd5b506200032c8782880162000219565b93505060408501519150606085015160ff811681146200034a578182fd5b939692955090935050565b600082198211156200037557634e487b7160e01b81526011600452602481fd5b500190565b600181811c908216806200038f57607f821691505b60208210811415620003b157634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b6108c280620003dd6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461012957806370a082311461013c57806395d89b4114610165578063a457c2d71461016d578063a9059cbb14610180578063dd62ed3e1461019357600080fd5b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100ef57806323b872dd14610101578063313ce56714610114575b600080fd5b6100b66101cc565b6040516100c391906107da565b60405180910390f35b6100df6100da3660046107b1565b61025e565b60405190151581526020016100c3565b6002545b6040519081526020016100c3565b6100df61010f366004610776565b610274565b60055460405160ff90911681526020016100c3565b6100df6101373660046107b1565b610323565b6100f361014a366004610723565b6001600160a01b031660009081526020819052604090205490565b6100b661035f565b6100df61017b3660046107b1565b61036e565b6100df61018e3660046107b1565b610407565b6100f36101a1366004610744565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6060600380546101db90610851565b80601f016020809104026020016040519081016040528092919081815260200182805461020790610851565b80156102545780601f1061022957610100808354040283529160200191610254565b820191906000526020600020905b81548152906001019060200180831161023757829003601f168201915b5050505050905090565b600061026b338484610414565b50600192915050565b6000610281848484610538565b6001600160a01b03841660009081526001602090815260408083203384529091529020548281101561030b5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b6103188533858403610414565b506001949350505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161026b91859061035a90869061082d565b610414565b6060600480546101db90610851565b3360009081526001602090815260408083206001600160a01b0386168452909152812054828110156103f05760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b6064820152608401610302565b6103fd3385858403610414565b5060019392505050565b600061026b338484610538565b6001600160a01b0383166104765760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610302565b6001600160a01b0382166104d75760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610302565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b03831661059c5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610302565b6001600160a01b0382166105fe5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610302565b6001600160a01b038316600090815260208190526040902054818110156106765760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610302565b6001600160a01b038085166000908152602081905260408082208585039055918516815290812080548492906106ad90849061082d565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516106f991815260200190565b60405180910390a350505050565b80356001600160a01b038116811461071e57600080fd5b919050565b600060208284031215610734578081fd5b61073d82610707565b9392505050565b60008060408385031215610756578081fd5b61075f83610707565b915061076d60208401610707565b90509250929050565b60008060006060848603121561078a578081fd5b61079384610707565b92506107a160208501610707565b9150604084013590509250925092565b600080604083850312156107c3578182fd5b6107cc83610707565b946020939093013593505050565b6000602080835283518082850152825b81811015610806578581018301518582016040015282016107ea565b818111156108175783604083870101525b50601f01601f1916929092016040019392505050565b6000821982111561084c57634e487b7160e01b81526011600452602481fd5b500190565b600181811c9082168061086557607f821691505b6020821081141561088657634e487b7160e01b600052602260045260246000fd5b5091905056fea2646970667358221220462d5fd1270faf5d034493bddb6d623184f8d7847ad37fff9caba5f3f259fa4264736f6c63430008040033";

export class ERC20Mock__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    name: string,
    symbol: string,
    supply: BigNumberish,
    decimals_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC20Mock> {
    return super.deploy(
      name,
      symbol,
      supply,
      decimals_,
      overrides || {}
    ) as Promise<ERC20Mock>;
  }
  getDeployTransaction(
    name: string,
    symbol: string,
    supply: BigNumberish,
    decimals_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      name,
      symbol,
      supply,
      decimals_,
      overrides || {}
    );
  }
  attach(address: string): ERC20Mock {
    return super.attach(address) as ERC20Mock;
  }
  connect(signer: Signer): ERC20Mock__factory {
    return super.connect(signer) as ERC20Mock__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC20MockInterface {
    return new utils.Interface(_abi) as ERC20MockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC20Mock {
    return new Contract(address, _abi, signerOrProvider) as ERC20Mock;
  }
}