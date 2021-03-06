/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  utils,
  BytesLike,
  Contract,
  ContractFactory,
  PayableOverrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  UpgradeabilityProxy,
  UpgradeabilityProxyInterface,
} from "../UpgradeabilityProxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_logic",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x60806040526040516103b53803806103b583398101604081905261002291610199565b61004d60017f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbd61027e565b6000805160206103958339815191521461007757634e487b7160e01b600052600160045260246000fd5b610080826100f8565b8051156100f1576000826001600160a01b0316826040516100a19190610262565b600060405180830381855af49150503d80600081146100dc576040519150601f19603f3d011682016040523d82523d6000602084013e6100e1565b606091505b50509050806100ef57600080fd5b505b50506102e7565b61010b8161019360201b6100411760201c565b6101815760405162461bcd60e51b815260206004820152603b60248201527f43616e6e6f742073657420612070726f787920696d706c656d656e746174696f60448201527f6e20746f2061206e6f6e2d636f6e747261637420616464726573730000000000606482015260840160405180910390fd5b60008051602061039583398151915255565b3b151590565b600080604083850312156101ab578182fd5b82516001600160a01b03811681146101c1578283fd5b60208401519092506001600160401b03808211156101dd578283fd5b818501915085601f8301126101f0578283fd5b815181811115610202576102026102d1565b604051601f8201601f19908116603f0116810190838211818310171561022a5761022a6102d1565b81604052828152886020848701011115610242578586fd5b6102538360208301602088016102a1565b80955050505050509250929050565b600082516102748184602087016102a1565b9190910192915050565b60008282101561029c57634e487b7160e01b81526011600452602481fd5b500390565b60005b838110156102bc5781810151838201526020016102a4565b838111156102cb576000848401525b50505050565b634e487b7160e01b600052604160045260246000fd5b60a0806102f56000396000f3fe608060405236600a57005b60106012565b005b603f603b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b6047565b565b3b151590565b3660008037600080366000845af43d6000803e8080156065573d6000f35b3d6000fdfea2646970667358221220c5f9109a57c1a830554ba75ae1e8f82cab56d8e8fd54aa017aed8b2d923a9b3564736f6c63430008040033360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export class UpgradeabilityProxy__factory extends ContractFactory {
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
    _logic: string,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<UpgradeabilityProxy> {
    return super.deploy(
      _logic,
      _data,
      overrides || {}
    ) as Promise<UpgradeabilityProxy>;
  }
  getDeployTransaction(
    _logic: string,
    _data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_logic, _data, overrides || {});
  }
  attach(address: string): UpgradeabilityProxy {
    return super.attach(address) as UpgradeabilityProxy;
  }
  connect(signer: Signer): UpgradeabilityProxy__factory {
    return super.connect(signer) as UpgradeabilityProxy__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): UpgradeabilityProxyInterface {
    return new utils.Interface(_abi) as UpgradeabilityProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): UpgradeabilityProxy {
    return new Contract(address, _abi, signerOrProvider) as UpgradeabilityProxy;
  }
}
