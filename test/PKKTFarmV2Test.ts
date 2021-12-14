import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";
import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import { PKKTToken, PKKTFarmV2Test, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
 
 

const WEI = BigNumber.from(10).pow(18);

const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

describe("PKKT Farm", async function () {
    let pkktToken: PKKTToken;
    let pkktFarmV2Test: PKKTFarmV2Test;
    let deployer: SignerWithAddress; 
    let alice: SignerWithAddress; 
    let bob: SignerWithAddress; 
    let carol: SignerWithAddress;
    let minter: SignerWithAddress; 
    let lp: ERC20Mock;
    let lp2: ERC20Mock;
    before(async function () {
      [deployer, alice, bob, carol, minter] = await ethers.getSigners(); 
  

    });

    context("With ERC/LP token added to the field (V2)", function () {
        it("new function should be added to upgrade", async function () {

        pkktToken = await deployContract("PKKTToken", deployer as Signer, ["PKKTToken","PKKT", CAP.toString()]) as PKKTToken; 
        this.owner = deployer as Signer;  
        pkktFarmV2Test = await deployUpgradeableContract("PKKTFarmV2Test", deployer as Signer, [pkktToken.address, "100", 13602000]) as PKKTFarmV2Test;
        const poolLength = await pkktFarmV2Test.poolLength();
        assert.equal(await poolLength.toString(), "0")
        const testUpgrade = await pkktFarmV2Test.testUpgrade();
        assert.equal(testUpgrade.toString(), "1");
        });
      });  
  });
