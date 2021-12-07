import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTToken, PKKTFarm, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
 
import { WEI } from "../constants/constants";
  

const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

describe("PKKT Farm", async function () {
    let pkktToken: PKKTToken;
    let pkktFarm: PKKTFarm;
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

    context("With ERC/LP token added to the field", function () {
        beforeEach(async function () {
        
          pkktToken = await deployContract("PKKTToken", deployer as Signer, ["PKKTToken","PKKT", CAP.toString()]) as PKKTToken; 
          this.owner = deployer as Signer;  

          lp = await deployContract("ERC20Mock", deployer as Signer, ["LPToken", "LP", "10000000000", 18]) as ERC20Mock;
          await lp.transfer(alice.address, "1000");
          await lp.transfer(bob.address, "1000");
          await lp.transfer(carol.address, "1000");
          lp2 = await deployContract("ERC20Mock", deployer as Signer, ["LPToken2", "LP2", "10000000000", 18]) as ERC20Mock;
          await lp2.transfer(alice.address, "1000");
          await lp2.transfer(bob.address, "1000");
          await lp2.transfer(carol.address, "1000");
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
            await pkktToken.removeMinter(pkktFarm.address);  
        });
    
        it("should allow emergency withdraw", async function () {
          pkktFarm = await deployContract("PKKTFarm", deployer as Signer) as PKKTFarm;
          pkktFarm.initialize(pkktToken.address, "100", 13600100);
          await pkktToken.addMinter(pkktFarm.address, MAX);
          await pkktFarm.add({ lpToken: lp.address, allocPoint: BigNumber.from(100) }, true); 
          await lp.connect(bob as Signer).approve(pkktFarm.address, "1000"); 
          await pkktFarm.connect(bob as Signer).deposit(0, "100");
          var bobBalance = await lp.balanceOf(bob.address);
          assert.equal(bobBalance.toString(), "900"); 
          await pkktFarm.connect(bob as Signer).emergencyWithdraw(0);
          bobBalance = await lp.balanceOf(bob.address);
          assert.equal(bobBalance.toString(), "1000");  
        });
        
        it("should not distribute pkkts if no one deposit", async function () {
            pkktFarm = await deployContract("PKKTFarm", deployer as Signer) as PKKTFarm;
            pkktFarm.initialize(pkktToken.address, "100", 13600100);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await pkktFarm.add({ lpToken: lp.address, allocPoint: BigNumber.from(100) }, true);  
            await lp.connect(bob as Signer).approve(pkktFarm.address, "1000"); 
            await advanceBlockTo(13600099);
            assert.equal((await pkktToken.totalSupply()).toString(), "0");  
            await advanceBlockTo(13600104);
            assert.equal((await pkktToken.totalSupply()).toString(), "0");  
            await advanceBlockTo(13600109);
            //deposit at block 13600110
            await pkktFarm.connect(bob as Signer).deposit(0, "10"); 
            assert.equal((await pkktToken.totalSupply()).toString(), "0");  
            
            assert.equal((await pkktToken.totalSupply()).toString(), "0");  

            assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");   
            assert.equal((await lp.balanceOf(bob.address)).toString(), "990");    
            await advanceBlockTo(13600118);  
            
            //withdraw at block 13600110
            await pkktFarm.connect(bob as Signer).withdraw(0, "10", true);  
            assert.equal((await pkktToken.totalSupply()).toString(), "900");  
            const bobPkkt = await pkktToken.balanceOf(bob.address);
            assert.equal(bobPkkt.toString(), "900");   
            assert.equal((await lp.balanceOf(bob.address)).toString(), "1000");    
          }); 

          it("should distribute pkkts properly for each staker", async function () { 
            pkktFarm = await deployContract("PKKTFarm", deployer as Signer) as PKKTFarm;
            pkktFarm.initialize(pkktToken.address, "100", 13600200);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await pkktFarm.add({ lpToken: lp.address, allocPoint: BigNumber.from(100) }, true);  

            await lp.connect(alice as Signer).approve(pkktFarm.address, "1000");
            await lp.connect(bob as Signer).approve(pkktFarm.address, "1000");
            await lp.connect(carol as Signer).approve(pkktFarm.address, "1000");

            // Alice deposits 10 LPs at block 210
            await advanceBlockTo(13600209);
            await pkktFarm.connect(alice as Signer).deposit(0, "10");
            // Bob deposits 20 LPs at block 214
            await advanceBlockTo(13600213);
            await pkktFarm.connect(bob as Signer).deposit(0, "20");
            //4block*100 all for alice
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "400");

            // Carol deposits 30 LPs at block 218
            await advanceBlockTo(13600217);
            await pkktFarm.connect(carol as Signer).deposit(0, "30");
            //Alice should have: 4*100 + 4*1/3*100 
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "533");

            // Alice deposits 10 more LPs at block 220. At this point:
            //  Alice should have: 4*100 + 4*1/3*100 + 2*1/6*100 = 566
            await advanceBlockTo(13600219);
            await pkktFarm.connect(alice as Signer).deposit(0, "10");
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "566");
            await pkktFarm.connect(alice as Signer).harvest(0); 
            //  Alice should have: 4*100 + 4*1/3*100 + 2*1/6*100  + 2/7*100 = 594  
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "0"); 
            assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "594");  
            assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");
            assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0"); 
         
            // Bob withdraws 5 LPs at block 230. At this point:
            //   Bob should have: 4*2/3*100 + 2*2/6*100 + 10*2/7*100 = 619
            await advanceBlockTo(13600229);
            await pkktFarm.connect(bob as Signer).withdraw(0, "5", true);  
            assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "619");
            assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0");  

             
            // Alice withdraws 20 LPs at block 240.
            // Bob withdraws 15 LPs at block 250.
            // Carol withdraws 30 LPs at block 260.
            await advanceBlockTo(13600239);
            await pkktFarm.connect(alice as Signer).withdraw(0, "20", true);
            await advanceBlockTo(13600249);
            await pkktFarm.connect(bob as Signer).withdraw(0, "15", true); 
            await advanceBlockTo(13600259);
            await pkktFarm.connect(carol as Signer).withdraw(0, "30", true); 

            // Alice should have: 594 + 9 *2/7*100 + 10*2/6.5*100 = 1159 
            assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "1159");  
            // Bob should have: 619 + 10*1.5/6.5 * 100 + 10*1.5/4.5*100 = 1183 
            assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "1183");   
            // Carol should have: 2*3/6*100 + 10*3/7*100 + 10*3/6.5*100 + 10*3/4.5*100 + 10*100 = 2657 
            assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "2657");    
            // All of them should have 1000 LPs back.
            assert.equal((await lp.balanceOf(alice.address)).toString(), "1000"); 
            assert.equal((await lp.balanceOf(bob.address)).toString(), "1000");
            assert.equal((await lp.balanceOf(carol.address)).toString(), "1000");   

          });  
        it("should give proper pkkts allocation to each pool", async function () {
            pkktFarm = await deployContract("PKKTFarm", deployer as Signer) as PKKTFarm;
            pkktFarm.initialize(pkktToken.address, "100", 13600300);
            await pkktToken.addMinter(pkktFarm.address, MAX); 
            await lp.connect(alice as Signer).approve(pkktFarm.address, "1000");
            await lp2.connect(bob as Signer).approve(pkktFarm.address, "1000"); 
            // Add first LP to the pool with allocation 1 
            await pkktFarm.add({ lpToken: lp.address, allocPoint: BigNumber.from(10) }, true);  
            // Alice deposits 10 LPs at block 310
            await advanceBlockTo(13600309);
            await pkktFarm.connect(alice as Signer).deposit(0, "10");
            // Add LP2 to the pool with allocation 2 at block 320
            await advanceBlockTo(13600319);
            await pkktFarm.add({ lpToken: lp2.address, allocPoint: BigNumber.from(20) }, true);  
            // Alice should have 10*100 pending reward 
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1000"); 

            // Bob deposits 10 LP2s at block 325
            await advanceBlockTo(13600324);
            await pkktFarm.connect(bob as Signer).deposit(1, "5");
            // Alice should have 1000 + 5*1/3*100 = 1166 pending reward 
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1166"); 

            await advanceBlockTo(13600330);
            // At block 430. Bob should get 5*2/3*100 = 333. Alice should get ~166 more. 
            assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1333"); 
            assert.equal((await pkktFarm.pendingPKKT(1, bob.address)).toString(), "333"); 
            await pkktFarm.connect(bob as Signer).harvest(1);
            assert.equal((await pkktFarm.pendingPKKT(1, bob.address)).toString(), "0"); 
        }); 

        it("should give ppkt token from all pool if harvest all", async function () {
            // 100 per block farming rate starting at block 100 with bonus until block 1000
            pkktFarm = await deployContract("PKKTFarm", deployer as Signer) as PKKTFarm;
            pkktFarm.initialize(pkktToken.address, "100", 13600400);
            await pkktToken.addMinter(pkktFarm.address, MAX); 
            await lp.connect(alice as Signer).approve(pkktFarm.address, "1000");
            await lp2.connect(alice as Signer).approve(pkktFarm.address, "1000");
            //add pool 0 with alloc = 100, add pool 1 with alloc = 200
            await pkktFarm.addMany([{ lpToken: lp.address, allocPoint: "100"}, { lpToken: lp2.address, allocPoint: "200"}],true);
            //add pool 1 with alloc = 200 
            // Alice deposits 10 LPs in pool 0 at block 500
            await advanceBlockTo(13600499);
            await pkktFarm.connect(alice as Signer).deposit(0, "10");
            // Alice deposit 20 LPs in pool 1 at block 510
            await advanceBlockTo(13600509);
            await pkktFarm.connect(alice as Signer).deposit(1, "20");
            //At block 520, Alice harvest all rewards
            await advanceBlockTo(13600519); 
            await pkktFarm.connect(alice as Signer).harvestAll([0, 1]); 
            //At this moment, Alice should have:
            //pool 0: 20 block 20 * 100 * 1/3
            //pool 1: 10 block 10 * 100 * 2/3
            //ppkt token of alice after havertAll is 1332
            const alicePkkt = await pkktToken.balanceOf(alice.address); 
            assert.equal(alicePkkt.toString(), "1332");

            
            //At block 530, admin reset pool heights
            await advanceBlockTo(13600529); 
            await pkktFarm.setMany([{pid: 0, allocPoint: "200"}, {pid: 1, allocPoint: "100"}], true);

            
            await lp.connect(bob as Signer).approve(pkktFarm.address, "1000");
            //Alice deposits 10 LPs in pool 0 at block 540
            await advanceBlockTo(13600539); 
            await pkktFarm.connect(bob as Signer).deposit(0, "10");


            await advanceBlockTo(13600550); 
            //At this moment, Alice should have:
            //pool 0:  (10 * 1 * 1/3 + 10 * 1 * 2/3 + 10 * 0.5 * 2/3)*100
            //pool 1:  10 * 1 * 2/3  * 100 + 20 * 1 * 1/3 * 100
            const alicePkktBal1 = await pkktFarm.pendingPKKT(0, alice.address); 
            assert.equal(alicePkktBal1.toString(), "1333");
            const alicePkktBal2 = await pkktFarm.pendingPKKT(1, alice.address);
            assert.equal(alicePkktBal2.toString(), "1333");
  
        }); 
        
      });  
   
  });
