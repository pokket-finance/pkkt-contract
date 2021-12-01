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
const USDTMultiplier = BigNumber.from(10).pow(USDTDecimals); 
const USDCMultiplier = BigNumber.from(10).pow(USDCDecimals);
const DAIMultiplier = BigNumber.from(10).pow(DAIDecimals);
 

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
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, 13601000]) as PKKTVault;
          pkktVault.initialize("100", trader.address);
          await pkktToken.addMinter(pkktVault.address, MAX);
          await pkktVault.addMany([
            { underlying: usdt.address, decimals: USDTDecimals},  
            { underlying: usdc.address, decimals: USDCDecimals},
            { underlying: dai.address, decimals: DAIDecimals}
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
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, 13601000]) as PKKTVault;
          pkktVault.initialize("100", trader.address);
          await pkktToken.addMinter(pkktVault.address, MAX);
          await pkktVault.addMany([
            { underlying: usdt.address, decimals: USDTDecimals},  
            { underlying: usdc.address, decimals: USDCDecimals},
            { underlying: dai.address, decimals: DAIDecimals}
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
          await pkktVault.connect(trader as Signer).initiateSettlement("100", trader.address);  
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


          var trader1 = await usdt.balanceOf(trader.address);
          var trader2 = await usdc.balanceOf(trader.address);
          var trader3 = await dai.balanceOf(trader.address);
          
          assert.equal(trader1.toString(), BigNumber.from(10).mul(USDTMultiplier).toString()); 
          assert.equal(trader2.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          assert.equal(trader3.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());  

          //mimicing moving forward
          await advanceBlockTo(1360109);
           
          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(0, BigNumber.from(11).mul(USDTMultiplier))).to.be.revertedWith("Exceeds available");   
          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(1, BigNumber.from(6).mul(USDCMultiplier))).to.be.revertedWith("Exceeds available");  
          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(2, BigNumber.from(3).mul(DAIMultiplier))).to.be.revertedWith("Exceeds available");  
          //should allow
          await pkktVault.connect(alice as Signer).initiateWithdraw(0, BigNumber.from(7).mul(USDTMultiplier)); 
          await pkktVault.connect(alice as Signer).initiateWithdraw(1, BigNumber.from(3).mul(USDCMultiplier)); 
          await pkktVault.connect(alice as Signer).initiateWithdraw(2, BigNumber.from(2).mul(DAIMultiplier)); 
          
          var usdtVault = await pkktVault.userInfo(0, alice.address);
          var usdcVault = await pkktVault.userInfo(1, alice.address);
          var daiVault = await pkktVault.userInfo(2, alice.address);

          assert.equal(usdtVault.requestingAmount.toString(), BigNumber.from(7).mul(USDTMultiplier).toString());
          assert.equal(usdcVault.requestingAmount.toString(), BigNumber.from(3).mul(USDCMultiplier).toString());
          assert.equal(daiVault.requestingAmount.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());

          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(0, BigNumber.from(4).mul(USDTMultiplier))).to.be.revertedWith("Exceeds available");   
          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(1, BigNumber.from(3).mul(USDCMultiplier))).to.be.revertedWith("Exceeds available");  
          await expect(pkktVault.connect(alice as Signer).initiateWithdraw(2, BigNumber.from(1).mul(DAIMultiplier))).to.be.revertedWith("Exceeds available");  

 
          await pkktVault.connect(alice as Signer).cancelWithdraw(0, BigNumber.from(1).mul(USDTMultiplier));
          await pkktVault.connect(alice as Signer).cancelWithdraw(1, BigNumber.from(1).mul(USDCMultiplier));
          await pkktVault.connect(alice as Signer).cancelWithdraw(2, BigNumber.from(1).mul(DAIMultiplier));

          usdtVault = await pkktVault.userInfo(0, alice.address);
          usdcVault = await pkktVault.userInfo(1, alice.address);
          daiVault = await pkktVault.userInfo(2, alice.address);

          assert.equal(usdtVault.requestingAmount.toString(), BigNumber.from(6).mul(USDTMultiplier).toString());
          assert.equal(usdcVault.requestingAmount.toString(), BigNumber.from(2).mul(USDCMultiplier).toString());
          assert.equal(daiVault.requestingAmount.toString(), BigNumber.from(1).mul(DAIMultiplier).toString());
  
          await pkktVault.connect(alice as Signer).deposit(0, BigNumber.from(1).mul(USDTMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(1, BigNumber.from(2).mul(USDCMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(2, BigNumber.from(3).mul(DAIMultiplier)); 

          usdtVault = await pkktVault.userInfo(0, alice.address);
          usdcVault = await pkktVault.userInfo(1, alice.address);
          daiVault = await pkktVault.userInfo(2, alice.address);
          assert.equal(usdtVault.pendingAmount.toString(), BigNumber.from(1).mul(USDTMultiplier).toString());
          assert.equal(usdcVault.pendingAmount.toString(), BigNumber.from(2).mul(USDCMultiplier).toString());
          assert.equal(daiVault.pendingAmount.toString(), BigNumber.from(3).mul(DAIMultiplier).toString());
          
          await pkktVault.connect(trader as Signer).initiateSettlement("100", trader.address);  

          settelled = await pkktVault.isSettelled();
          assert.isFalse(settelled);

          var usdtDiff = await pkktVault.settlementResult(0);
          var usdcDiff = await pkktVault.settlementResult(1);
          var daiDiff = await pkktVault.settlementResult(2);

          assert.equal(usdtDiff.toString(), BigNumber.from(-5).mul(USDTMultiplier).toString());
          assert.equal(usdcDiff.toString(), "0");
          assert.equal(daiDiff.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());

          trader1 = await usdt.balanceOf(trader.address);
          trader2 = await usdc.balanceOf(trader.address);
          trader3 = await dai.balanceOf(trader.address);
          
          assert.equal(trader1.toString(), BigNumber.from(10).mul(USDTMultiplier).toString()); 
          assert.equal(trader2.toString(), BigNumber.from(5).mul(USDCMultiplier).toString()); 
          assert.equal(trader3.toString(), BigNumber.from(4).mul(DAIMultiplier).toString());  


          await expect(pkktVault.connect(trader as Signer).finishSettlement()).to.be.revertedWith("Matured amount not fullfilled");   
          usdtVault = await pkktVault.userInfo(0, alice.address);
          usdcVault = await pkktVault.userInfo(1, alice.address);
          daiVault = await pkktVault.userInfo(2, alice.address);

          assert.equal(usdtVault.maturedAmount.toString(), BigNumber.from(6).mul(USDTMultiplier).toString());
          assert.equal(usdcVault.maturedAmount.toString(), BigNumber.from(2).mul(USDCMultiplier).toString());
          assert.equal(daiVault.maturedAmount.toString(), BigNumber.from(1).mul(DAIMultiplier).toString());
          assert.equal(usdtVault.requestingAmount.toString(), "0");
          assert.equal(usdcVault.requestingAmount.toString(), "0");
          assert.equal(daiVault.requestingAmount.toString(), "0");

          await usdt.connect(trader as Signer).transfer(pkktVault.address, BigNumber.from(5).mul(USDTMultiplier).toString()); 
          await pkktVault.connect(trader as Signer).finishSettlement(); 
          await expect(pkktVault.connect(trader as Signer).finishSettlement()).to.be.revertedWith("Settlement already finished");   

          var aliceUsdt = await usdt.balanceOf(alice.address);  
          await pkktVault.connect(alice as Signer).completeWithdraw(0, BigNumber.from(5).mul(USDTMultiplier));
          await pkktVault.connect(alice as Signer).redeposit(0, BigNumber.from(1).mul(USDTMultiplier)); 
          var aliceUsdtNew = await usdt.balanceOf(alice.address);  
          assert.equal(aliceUsdtNew.sub(aliceUsdt).toString(), BigNumber.from(5).mul(USDTMultiplier).toString()); 
          usdtVault = await pkktVault.userInfo(0, alice.address);
          assert.equal(usdtVault.pendingAmount.toString(), BigNumber.from(1).mul(USDTMultiplier).toString()); 
          assert.equal(usdtVault.ongoingAmount.toString(), BigNumber.from(5).mul(USDTMultiplier).toString());
          assert.equal(usdtVault.maturedAmount.toString(), "0");
          assert.equal(usdtVault.requestingAmount.toString(), "0");

          var aliceUsdc = await usdc.balanceOf(alice.address);  
          await pkktVault.connect(alice as Signer).maxCompleteWithdraw(1); 
          var aliceUsdcNew = await usdc.balanceOf(alice.address);  
          assert.equal(aliceUsdcNew.sub(aliceUsdc).toString(), BigNumber.from(2).mul(USDCMultiplier).toString());  
          usdcVault = await pkktVault.userInfo(1, alice.address);
          assert.equal(usdcVault.pendingAmount.toString(), "0"); 
          assert.equal(usdcVault.ongoingAmount.toString(),  BigNumber.from(5).mul(USDCMultiplier).toString());
          assert.equal(usdcVault.maturedAmount.toString(), "0");
          assert.equal(usdcVault.requestingAmount.toString(), "0");

          var aliceDai = await dai.balanceOf(alice.address);  
          await pkktVault.connect(alice as Signer).maxRedeposit(2); 
          var aliceDaiNew = await dai.balanceOf(alice.address);  
          assert.equal(aliceDaiNew.sub(aliceDai).toString(), "0");  
          usdcVault = await pkktVault.userInfo(2, alice.address);
          assert.equal(usdcVault.pendingAmount.toString(), BigNumber.from(1).mul(DAIMultiplier).toString()); 
          assert.equal(usdcVault.ongoingAmount.toString(),  BigNumber.from(4).mul(DAIMultiplier).toString());
          assert.equal(usdcVault.maturedAmount.toString(), "0");
          assert.equal(usdcVault.requestingAmount.toString(), "0");
        });

        it("should allow harvest pkkt reward", async function () {
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, 13601000]) as PKKTVault;
          pkktVault.initialize("100", trader.address);
          await pkktToken.addMinter(pkktVault.address, MAX);
          await pkktVault.addMany([
            { underlying: usdt.address, decimals: USDTDecimals},  
            { underlying: usdc.address, decimals: USDCDecimals},
            { underlying: dai.address, decimals: DAIDecimals}
          ], true); 

          await usdt.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDTMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(USDTMultiplier)); 
          await usdc.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDCMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(1, BigNumber.from(5).mul(USDCMultiplier)); 
          await dai.connect(alice as Signer).approve(pkktVault.address, BigNumber.from(100).mul(DAIMultiplier));  
          await pkktVault.connect(alice as Signer).deposit(2, BigNumber.from(2).mul(DAIMultiplier)); 

          await usdt.connect(bob as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDTMultiplier));  
          await pkktVault.connect(bob as Signer).deposit(0, BigNumber.from(20).mul(USDTMultiplier)); 
          await usdc.connect(bob as Signer).approve(pkktVault.address, BigNumber.from(100).mul(USDCMultiplier));  
          await pkktVault.connect(bob as Signer).deposit(1, BigNumber.from(10).mul(USDCMultiplier)); 
          await dai.connect(bob as Signer).approve(pkktVault.address, BigNumber.from(100).mul(DAIMultiplier));  
          await pkktVault.connect(bob as Signer).deposit(2, BigNumber.from(4).mul(DAIMultiplier)); 


          await advanceBlockTo(13601199);
          //settlement at 13601200, the reward will be calculated 
          await pkktVault.connect(trader as Signer).initiateSettlement("200", trader.address);

          await advanceBlockTo(13601299);
          //settlement at 13601300, the reward will be calculated 
          await pkktVault.connect(trader as Signer).initiateSettlement("100", trader.address);
 
         
          var alicePkkt = (await pkktVault.pendingPKKT(0, alice.address)).
          add(await pkktVault.pendingPKKT(1, alice.address)).
          add(await pkktVault.pendingPKKT(2, alice.address));

          //we lose some precision, 6666.666 should be better
          assert.equal(alicePkkt.toString(), "6665");
          
          var bobPkkt = (await pkktVault.pendingPKKT(0, bob.address)).
          add(await pkktVault.pendingPKKT(1, bob.address)).
          add(await pkktVault.pendingPKKT(2, bob.address));

          //we lose some precision, 13333.333 should be better
          assert.equal(bobPkkt.toString(), "13332");

          
          await pkktVault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(USDTMultiplier)); 
          await advanceBlockTo(13601399);
          //settlement at 13601300, the reward will be calculated 
          await pkktVault.connect(trader as Signer).initiateSettlement("100", trader.address);
          
          //todo: fix overflow issue

          //6665 + 20/61*100*100
          var aliceReward = await pkktVault.connect(alice as Signer).harvestAllPools();

          //13332 + 41/61*100*100
          var bobReward = await pkktVault.connect(bob as Signer).harvestAllPools();
          
          console.log( `${aliceReward.toString()} ${bobReward.toString()}`);
            
        });

        it("should allow granting and revoking of trader role", async () => {
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, 13601000]) as PKKTVault;
          pkktVault.initialize("100", trader.address);

          await expect(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;

          await expect(pkktVault.connect(alice as Signer).grantRole(ethers.utils.formatBytes32String("TRADER_ROLE"), alice.address)).to.be.reverted;
          assert.isNotTrue(
            await pkktVault.hasRole(ethers.utils.formatBytes32String("TRADER_ROLE"), alice.address),
            "Non-admin granted trader role"
          );
          await expect(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;

          await pkktVault.revokeRole(ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address);
          assert.isNotTrue(
            await pkktVault.hasRole(ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address),
            "Trader role was not revoked."
          );
          await expect(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;

          await pkktVault.grantRole(ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address);
          assert.isTrue(
            await pkktVault.hasRole(ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address),
            "Trader role was not granted"
          );
          await pkktVault.connect(trader as Signer).initiateSettlement("100", trader.address);
        });

        it("should only allow the trader and owner to set PKKT per block", async () => {
          pkktVault = await deployContract("PKKTVault", { signer:deployer as Signer, libraries:{Vault:vault.address} } , [pkktToken.address, 13601000]) as PKKTVault;
          pkktVault.initialize("100", trader.address);

          await expect(pkktVault.connect(alice as Signer).setPKKTPerBlock("200")).to.be.revertedWith("Only the owner or trader can set PKKT per block.");

          await pkktVault.setPKKTPerBlock("200");
          assert(await pkktVault.pkktPerBlock(), "200");

          await pkktVault.connect(trader as Signer).setPKKTPerBlock("100");
          assert(await pkktVault.pkktPerBlock, "100");
        });

      });  
   
  });

  
