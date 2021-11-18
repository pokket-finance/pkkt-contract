import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTToken, PKKTVault, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
 
 

const WEI = BigNumber.from(10).pow(18);

const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

const USDTDecimals = 6; 
const USDCDecimals = 6;
const DAIDecimals = 18;
const USDTMultiplier = BigNumber.from(USDTDecimals); 
const USDCMultiplier = BigNumber.from(USDCDecimals);
const DAIMultiplier = BigNumber.from(USDTDecimals);;

describe("PKKT Vault", async function () {
    let pkktToken: PKKTToken;
    let pkktVault: PKKTVault;
    let deployer: SignerWithAddress; 
    let alice: SignerWithAddress; 
    let bob: SignerWithAddress; 
    let carol: SignerWithAddress;
    let trader: SignerWithAddress; 
    let usdt: ERC20Mock;
    let usdc: ERC20Mock;
    let dai: ERC20Mock;
    let vault: Contract;
    before(async function () {
      [deployer, alice, bob, carol, trader] = await ethers.getSigners(); 
       
      vault = await deployContract("Vault", deployer as Signer) as Contract;  
    });

    context("With vault added to the field", function () {
        beforeEach(async function () {
        
          pkktToken = await deployContract("PKKTToken", deployer as Signer, ["PKKTToken","PKKT", CAP.toString()]) as PKKTToken; 
          this.owner = deployer as Signer;  
          usdt = await  deployContract("ERC20Mock", deployer as Signer, ["USDTToken", "USDT", BigNumber.from(10000).mul(USDTMultiplier), USDTDecimals]) as ERC20Mock;
          usdc = await  deployContract("ERC20Mock", deployer as Signer, ["USDCToken", "USDC", BigNumber.from(10000).mul(USDCMultiplier), USDCDecimals]) as ERC20Mock;
          dai = await  deployContract("ERC20Mock", deployer as Signer, ["DAIToken", "DAI", BigNumber.from(10000).mul(DAIMultiplier), DAIDecimals]) as ERC20Mock;
  
          await usdt.transfer(alice.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(bob.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(carol.address,  BigNumber.from(100).mul(USDTMultiplier));

          await usdc.transfer(alice.address,  BigNumber.from(100).mul(USDCMultiplier));
          await usdc.transfer(bob.address,  BigNumber.from(100).mul(USDCMultiplier));
          await usdc.transfer(carol.address,  BigNumber.from(100).mul(USDCMultiplier));
 

          await dai.transfer(alice.address,  BigNumber.from(100).mul(DAIMultiplier));
          await dai.transfer(bob.address,  BigNumber.from(100).mul(DAIMultiplier));
          await dai.transfer(carol.address,  BigNumber.from(100).mul(DAIMultiplier));
        });
        
        afterEach(async function () {
        
            const alicePkkt = await pkktToken.balanceOf(alice.address);   
            await pkktToken.connect(alice as Signer).approve(deployer.address, alicePkkt);
            await pkktToken.burnFrom(alice.address, alicePkkt); 
            const bobPkkt = await pkktToken.balanceOf(bob.address);   
            await pkktToken.connect(bob as Signer).approve(deployer.address, bobPkkt);
            await pkktToken.burnFrom(bob.address, bobPkkt); 
            const carolPkkt = await pkktToken.balanceOf(carol.address);   
            await pkktToken.connect(carol as Signer).approve(deployer.address, carolPkkt);
            await pkktToken.burnFrom(carol.address, carolPkkt);  
            assert.equal((await pkktToken.totalSupply()).toString(), "0");  
            assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "0"); 
            assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0"); 
            assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0"); 
            await pkktToken.removeMinter(pkktVault.address);  
        });
    
        it("should allow deposit and redeem", async function () {
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, "100", 13601000]) as PKKTVault;
          await pkktToken.addMinter(pkktVault.address, MAX);
          await pkktVault.addMany([
            { underlying: usdt.address, decimals: USDTMultiplier},  
            { underlying: usdc.address, decimals: USDCMultiplier},
            { underlying: dai.address, decimals: DAIMultiplier}
          ], true); 

          await usdt.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDTMultiplier)); 
          var aliceUSDT = await usdt.balanceOf(alice.address);   
          assert.equal(aliceUSDT.toString(), BigNumber.from(100).mul(USDTMultiplier).toString());
          await pkktVault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(USDTMultiplier)); 
          var aliceUSDT = await usdt.balanceOf(alice.address);   
          assert.equal(aliceUSDT.toString(), BigNumber.from(90).mul(USDTMultiplier).toString());
          var vaultInfo = await pkktVault.vaultInfo(0);
          assert.equal(vaultInfo.totalPending.toString(), BigNumber.from(10).mul(USDTMultiplier).toString());
          await pkktVault.connect(alice as Signer).redeem(0, BigNumber.from(5).mul(USDTMultiplier));
          var aliceUSDT = await usdt.balanceOf(alice.address);   
          assert.equal(aliceUSDT.toString(), BigNumber.from(95).mul(USDTMultiplier).toString());
          vaultInfo = await pkktVault.vaultInfo(0);
          assert.equal(vaultInfo.totalPending.toString(), BigNumber.from(5).mul(USDTMultiplier).toString());
          await pkktVault.connect(alice as Signer).maxRedeem(0);
          var aliceUSDT = await usdt.balanceOf(alice.address);   
          assert.equal(aliceUSDT.toString(), BigNumber.from(100).mul(USDTMultiplier).toString());
          vaultInfo = await pkktVault.vaultInfo(0);
          assert.equal(vaultInfo.totalPending.toString(), "0");  

        });

        it("should allow deposit and settle and withdraw", async function () {
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, "100", 13601000]) as PKKTVault;
          await pkktToken.addMinter(pkktVault.address, MAX);
          await pkktVault.addMany([
            { underlying: usdt.address, decimals: USDTMultiplier},  
            { underlying: usdc.address, decimals: USDCMultiplier},
            { underlying: dai.address, decimals: DAIMultiplier}
          ], true); 

          await usdt.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDTMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(USDTMultiplier)); 
          await usdc.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDCMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(1, BigNumber.from(5).mul(USDCMultiplier)); 
          await dai.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(DAIMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(2, BigNumber.from(2).mul(DAIMultiplier)); 
          
          var settelled = await pkktVault.isSettelled();
          assert.isTrue(settelled);
          var vaultInfo1 = await pkktVault.vaultInfo(0);
          var vaultInfo2 = await pkktVault.vaultInfo(1);
          var vaultInfo3 = await pkktVault.vaultInfo(2);

          assert.equal(vaultInfo1.totalPending.toString(), BigNumber.from(10).mul(USDTMultiplier).toString()); 
          assert.equal(vaultInfo2.totalPending.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          assert.equal(vaultInfo3.totalPending.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());
          assert.equal(vaultInfo1.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo2.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo3.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo1.totalOngoing.toString(), "0");  
          assert.equal(vaultInfo2.totalOngoing.toString(), "0"); 
          assert.equal(vaultInfo3.totalOngoing.toString(), "0");  
          assert.equal(vaultInfo1.totalRequesting.toString(), "0");  
          assert.equal(vaultInfo2.totalRequesting.toString(), "0"); 
          assert.equal(vaultInfo3.totalRequesting.toString(), "0");  
          await pkktVault.initiateSettlement("100", trader.address);  
          /*const diff1 = await pkktVault.settlementResult[0];
          assert.equal(diff1.toString(), BigNumber.from(10).mul(USDTMultiplier).toString());
          const diff2 = await pkktVault.settlementResult[0];
          assert.equal(diff2.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          const diff3 = await pkktVault.settlementResult[0];
          assert.equal(diff3.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());*/
          settelled = await pkktVault.isSettelled();
          assert.isTrue(settelled);
          vaultInfo1 = await pkktVault.vaultInfo(0);
          vaultInfo2 = await pkktVault.vaultInfo(1);
          vaultInfo3 = await pkktVault.vaultInfo(2);

          assert.equal(vaultInfo1.totalPending.toString(), "0"); 
          assert.equal(vaultInfo2.totalPending.toString(), "0"); 
          assert.equal(vaultInfo3.totalPending.toString(), "0"); 
          assert.equal(vaultInfo1.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo2.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo3.totalMatured.toString(), "0"); 
          assert.equal(vaultInfo1.totalOngoing.toString(), BigNumber.from(10).mul(USDTMultiplier).toString()); 
          assert.equal(vaultInfo2.totalOngoing.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          assert.equal(vaultInfo3.totalOngoing.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());
          assert.equal(vaultInfo1.totalRequesting.toString(), "0");  
          assert.equal(vaultInfo2.totalRequesting.toString(), "0"); 
          assert.equal(vaultInfo3.totalRequesting.toString(), "0");  


          var trader1 = usdt.balanceOf(trader.address);
          var trader2 = usdc.balanceOf(trader.address);
          var trader3 = dai.balanceOf(trader.address);
          
          assert.equal(trader1.toString(), BigNumber.from(10).mul(USDTMultiplier).toString()); 
          assert.equal(trader2.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          assert.equal(trader3.toString(), BigNumber.from(2).mul(DAIMultiplier).toString()); 


        });
      });  
   
  });

  
