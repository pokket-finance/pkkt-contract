/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Utils, UtilsInterface } from "../Utils";

const _abi = [
  {
    inputs: [],
    name: "RATIOMULTIPLIER",
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
];

const _bytecode =
  "0x6088610038600b82828239805160001a607314602b57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe730000000000000000000000000000000000000000301460806040526004361060335760003560e01c806376e7a478146038575b600080fd5b604061271081565b60405190815260200160405180910390f3fea264697066735822122070b55bc00505cd1d8e3cdcdef60bc19faa4e1bd7d55f47dd32ccb3dc0c19eaf464736f6c63430008040033";

export class Utils__factory extends ContractFactory {
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
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Utils> {
    return super.deploy(overrides || {}) as Promise<Utils>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Utils {
    return super.attach(address) as Utils;
  }
  connect(signer: Signer): Utils__factory {
    return super.connect(signer) as Utils__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): UtilsInterface {
    return new utils.Interface(_abi) as UtilsInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Utils {
    return new Contract(address, _abi, signerOrProvider) as Utils;
  }
}
