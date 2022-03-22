/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "OwnableUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OwnableUpgradeable__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "HodlBoosterOption",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.HodlBoosterOption__factory>;
    getContractFactory(
      name: "HodlBoosterOptionStatic",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.HodlBoosterOptionStatic__factory>;
    getContractFactory(
      name: "HodlBoosterOptionUpgradeable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.HodlBoosterOptionUpgradeable__factory>;
    getContractFactory(
      name: "IPKKTStructureOption",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IPKKTStructureOption__factory>;
    getContractFactory(
      name: "ISettlementAggregator",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ISettlementAggregator__factory>;
    getContractFactory(
      name: "OptionLifecycle",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OptionLifecycle__factory>;
    getContractFactory(
      name: "StructureData",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.StructureData__factory>;
    getContractFactory(
      name: "Utils",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Utils__factory>;
    getContractFactory(
      name: "ERC20Mock",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20Mock__factory>;
    getContractFactory(
      name: "OptionVaultBase",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OptionVaultBase__factory>;
    getContractFactory(
      name: "OptionVaultStorage",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OptionVaultStorage__factory>;
    getContractFactory(
      name: "OptionVaultStorageV1",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.OptionVaultStorageV1__factory>;
    getContractFactory(
      name: "AdminUpgradeabilityProxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.AdminUpgradeabilityProxy__factory>;
    getContractFactory(
      name: "Proxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Proxy__factory>;
    getContractFactory(
      name: "UpgradeabilityProxy",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UpgradeabilityProxy__factory>;

    getContractAt(
      name: "OwnableUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OwnableUpgradeable>;
    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "HodlBoosterOption",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.HodlBoosterOption>;
    getContractAt(
      name: "HodlBoosterOptionStatic",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.HodlBoosterOptionStatic>;
    getContractAt(
      name: "HodlBoosterOptionUpgradeable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.HodlBoosterOptionUpgradeable>;
    getContractAt(
      name: "IPKKTStructureOption",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IPKKTStructureOption>;
    getContractAt(
      name: "ISettlementAggregator",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ISettlementAggregator>;
    getContractAt(
      name: "OptionLifecycle",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OptionLifecycle>;
    getContractAt(
      name: "StructureData",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.StructureData>;
    getContractAt(
      name: "Utils",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Utils>;
    getContractAt(
      name: "ERC20Mock",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20Mock>;
    getContractAt(
      name: "OptionVaultBase",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OptionVaultBase>;
    getContractAt(
      name: "OptionVaultStorage",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OptionVaultStorage>;
    getContractAt(
      name: "OptionVaultStorageV1",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.OptionVaultStorageV1>;
    getContractAt(
      name: "AdminUpgradeabilityProxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.AdminUpgradeabilityProxy>;
    getContractAt(
      name: "Proxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Proxy>;
    getContractAt(
      name: "UpgradeabilityProxy",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UpgradeabilityProxy>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
