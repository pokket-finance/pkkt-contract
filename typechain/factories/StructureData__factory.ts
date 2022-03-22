/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { StructureData, StructureDataInterface } from "../StructureData";

const _abi = [
  {
    inputs: [],
    name: "MATUREROUND",
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
    inputs: [],
    name: "OPTION_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRICE_PRECISION",
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
    inputs: [],
    name: "SETTLER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x61010a61003a600b82828239805160001a60731461002d57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe730000000000000000000000000000000000000000301460806040526004361060515760003560e01c806347276abf1460565780637445e85c14608f57806395082d251460b5578063f747e1771460cd575b600080fd5b607c7ffd0eee74c7609b4290ae42cfa22435eabf285017ea12017ed27c2e820eae6a7781565b6040519081526020015b60405180910390f35b607c7f6666bf5bfee463d10a7fc50448047f8a53b7762d7e28fbc5c643182785f3fd3f81565b60bc600481565b60405160ff90911681526020016086565b60bc60018156fea2646970667358221220f2bea0e384ea5183fa38974a4e7ae41c661123153aefc263031c277a3a22b0b164736f6c63430008040033";

export class StructureData__factory extends ContractFactory {
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
  ): Promise<StructureData> {
    return super.deploy(overrides || {}) as Promise<StructureData>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): StructureData {
    return super.attach(address) as StructureData;
  }
  connect(signer: Signer): StructureData__factory {
    return super.connect(signer) as StructureData__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): StructureDataInterface {
    return new utils.Interface(_abi) as StructureDataInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): StructureData {
    return new Contract(address, _abi, signerOrProvider) as StructureData;
  }
}