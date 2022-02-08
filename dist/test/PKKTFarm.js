"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const deploy_1 = require("./utilities/deploy");
const timer_1 = require("./utilities/timer");
const constants_1 = require("../constants/constants");
const CAP = ethers_1.BigNumber.from(1000).mul(constants_1.WEI);
const MAX = ethers_1.BigNumber.from(500).mul(constants_1.WEI);
describe.skip("PKKT Farm", async function () {
    let pkktToken;
    let pkktFarm;
    let deployer;
    let alice;
    let bob;
    let carol;
    let minter;
    let lp;
    let lp2;
    before(async function () {
        [deployer, alice, bob, carol, minter] = await hardhat_1.ethers.getSigners();
    });
    context("With ERC/LP token added to the field", function () {
        beforeEach(async function () {
            pkktToken = await (0, deploy_1.deployContract)("PKKTToken", deployer, ["PKKTToken", "PKKT", CAP.toString()]);
            this.owner = deployer;
            lp = await (0, deploy_1.deployContract)("ERC20Mock", deployer, ["LPToken", "LP", "10000000000", 18]);
            await lp.transfer(alice.address, "1000");
            await lp.transfer(bob.address, "1000");
            await lp.transfer(carol.address, "1000");
            lp2 = await (0, deploy_1.deployContract)("ERC20Mock", deployer, ["LPToken2", "LP2", "10000000000", 18]);
            await lp2.transfer(alice.address, "1000");
            await lp2.transfer(bob.address, "1000");
            await lp2.transfer(carol.address, "1000");
        });
        afterEach(async function () {
            const alicePkkt = await pkktToken.balanceOf(alice.address);
            await pkktToken.connect(alice).approve(deployer.address, alicePkkt);
            await pkktToken.burnFrom(alice.address, alicePkkt);
            const bobPkkt = await pkktToken.balanceOf(bob.address);
            await pkktToken.connect(bob).approve(deployer.address, bobPkkt);
            await pkktToken.burnFrom(bob.address, bobPkkt);
            const carolPkkt = await pkktToken.balanceOf(carol.address);
            await pkktToken.connect(carol).approve(deployer.address, carolPkkt);
            await pkktToken.burnFrom(carol.address, carolPkkt);
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0");
            await pkktToken.removeMinter(pkktFarm.address);
        });
        it("should allow emergency withdraw", async function () {
            pkktFarm = await (0, deploy_1.deployContract)("PKKTFarm", deployer);
            pkktFarm.initialize(pkktToken.address, "100", 13600100);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await pkktFarm.add({ lpToken: lp.address, allocPoint: ethers_1.BigNumber.from(100) }, true);
            await lp.connect(bob).approve(pkktFarm.address, "1000");
            await pkktFarm.connect(bob).deposit(0, "100");
            var bobBalance = await lp.balanceOf(bob.address);
            chai_1.assert.equal(bobBalance.toString(), "900");
            await pkktFarm.connect(bob).emergencyWithdraw(0);
            bobBalance = await lp.balanceOf(bob.address);
            chai_1.assert.equal(bobBalance.toString(), "1000");
        });
        it("should not distribute pkkts if no one deposit", async function () {
            pkktFarm = await (0, deploy_1.deployContract)("PKKTFarm", deployer);
            pkktFarm.initialize(pkktToken.address, "100", 13600100);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await pkktFarm.add({ lpToken: lp.address, allocPoint: ethers_1.BigNumber.from(100) }, true);
            await lp.connect(bob).approve(pkktFarm.address, "1000");
            await (0, timer_1.advanceBlockTo)(13600099);
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            await (0, timer_1.advanceBlockTo)(13600104);
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            await (0, timer_1.advanceBlockTo)(13600109);
            //deposit at block 13600110
            await pkktFarm.connect(bob).deposit(0, "10");
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");
            chai_1.assert.equal((await lp.balanceOf(bob.address)).toString(), "990");
            await (0, timer_1.advanceBlockTo)(13600118);
            //withdraw at block 13600110
            await pkktFarm.connect(bob).withdraw(0, "10", true);
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "900");
            const bobPkkt = await pkktToken.balanceOf(bob.address);
            chai_1.assert.equal(bobPkkt.toString(), "900");
            chai_1.assert.equal((await lp.balanceOf(bob.address)).toString(), "1000");
        });
        it("should distribute pkkts properly for each staker", async function () {
            pkktFarm = await (0, deploy_1.deployContract)("PKKTFarm", deployer);
            pkktFarm.initialize(pkktToken.address, "100", 13600200);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await pkktFarm.add({ lpToken: lp.address, allocPoint: ethers_1.BigNumber.from(100) }, true);
            await lp.connect(alice).approve(pkktFarm.address, "1000");
            await lp.connect(bob).approve(pkktFarm.address, "1000");
            await lp.connect(carol).approve(pkktFarm.address, "1000");
            // Alice deposits 10 LPs at block 210
            await (0, timer_1.advanceBlockTo)(13600209);
            await pkktFarm.connect(alice).deposit(0, "10");
            // Bob deposits 20 LPs at block 214
            await (0, timer_1.advanceBlockTo)(13600213);
            await pkktFarm.connect(bob).deposit(0, "20");
            //4block*100 all for alice
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "400");
            // Carol deposits 30 LPs at block 218
            await (0, timer_1.advanceBlockTo)(13600217);
            await pkktFarm.connect(carol).deposit(0, "30");
            //Alice should have: 4*100 + 4*1/3*100 
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "533");
            // Alice deposits 10 more LPs at block 220. At this point:
            //  Alice should have: 4*100 + 4*1/3*100 + 2*1/6*100 = 566
            await (0, timer_1.advanceBlockTo)(13600219);
            await pkktFarm.connect(alice).deposit(0, "10");
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "566");
            await pkktFarm.connect(alice).harvest(0);
            //  Alice should have: 4*100 + 4*1/3*100 + 2*1/6*100  + 2/7*100 = 594  
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "594");
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0");
            // Bob withdraws 5 LPs at block 230. At this point:
            //   Bob should have: 4*2/3*100 + 2*2/6*100 + 10*2/7*100 = 619
            await (0, timer_1.advanceBlockTo)(13600229);
            await pkktFarm.connect(bob).withdraw(0, "5", true);
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "619");
            chai_1.assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0");
            // Alice withdraws 20 LPs at block 240.
            // Bob withdraws 15 LPs at block 250.
            // Carol withdraws 30 LPs at block 260.
            await (0, timer_1.advanceBlockTo)(13600239);
            await pkktFarm.connect(alice).withdraw(0, "20", true);
            await (0, timer_1.advanceBlockTo)(13600249);
            await pkktFarm.connect(bob).withdraw(0, "15", true);
            await (0, timer_1.advanceBlockTo)(13600259);
            await pkktFarm.connect(carol).withdraw(0, "30", true);
            // Alice should have: 594 + 9 *2/7*100 + 10*2/6.5*100 = 1159 
            chai_1.assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "1159");
            // Bob should have: 619 + 10*1.5/6.5 * 100 + 10*1.5/4.5*100 = 1183 
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "1183");
            // Carol should have: 2*3/6*100 + 10*3/7*100 + 10*3/6.5*100 + 10*3/4.5*100 + 10*100 = 2657 
            chai_1.assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "2657");
            // All of them should have 1000 LPs back.
            chai_1.assert.equal((await lp.balanceOf(alice.address)).toString(), "1000");
            chai_1.assert.equal((await lp.balanceOf(bob.address)).toString(), "1000");
            chai_1.assert.equal((await lp.balanceOf(carol.address)).toString(), "1000");
        });
        it("should give proper pkkts allocation to each pool", async function () {
            pkktFarm = await (0, deploy_1.deployContract)("PKKTFarm", deployer);
            pkktFarm.initialize(pkktToken.address, "100", 13600300);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await lp.connect(alice).approve(pkktFarm.address, "1000");
            await lp2.connect(bob).approve(pkktFarm.address, "1000");
            // Add first LP to the pool with allocation 1 
            await pkktFarm.add({ lpToken: lp.address, allocPoint: ethers_1.BigNumber.from(10) }, true);
            // Alice deposits 10 LPs at block 310
            await (0, timer_1.advanceBlockTo)(13600309);
            await pkktFarm.connect(alice).deposit(0, "10");
            // Add LP2 to the pool with allocation 2 at block 320
            await (0, timer_1.advanceBlockTo)(13600319);
            await pkktFarm.add({ lpToken: lp2.address, allocPoint: ethers_1.BigNumber.from(20) }, true);
            // Alice should have 10*100 pending reward 
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1000");
            // Bob deposits 10 LP2s at block 325
            await (0, timer_1.advanceBlockTo)(13600324);
            await pkktFarm.connect(bob).deposit(1, "5");
            // Alice should have 1000 + 5*1/3*100 = 1166 pending reward 
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1166");
            await (0, timer_1.advanceBlockTo)(13600330);
            // At block 430. Bob should get 5*2/3*100 = 333. Alice should get ~166 more. 
            chai_1.assert.equal((await pkktFarm.pendingPKKT(0, alice.address)).toString(), "1333");
            chai_1.assert.equal((await pkktFarm.pendingPKKT(1, bob.address)).toString(), "333");
            await pkktFarm.connect(bob).harvest(1);
            chai_1.assert.equal((await pkktFarm.pendingPKKT(1, bob.address)).toString(), "0");
        });
        it("should give ppkt token from all pool if harvest all", async function () {
            // 100 per block farming rate starting at block 100 with bonus until block 1000
            pkktFarm = await (0, deploy_1.deployContract)("PKKTFarm", deployer);
            pkktFarm.initialize(pkktToken.address, "100", 13600400);
            await pkktToken.addMinter(pkktFarm.address, MAX);
            await lp.connect(alice).approve(pkktFarm.address, "1000");
            await lp2.connect(alice).approve(pkktFarm.address, "1000");
            //add pool 0 with alloc = 100, add pool 1 with alloc = 200
            await pkktFarm.addMany([{ lpToken: lp.address, allocPoint: "100" }, { lpToken: lp2.address, allocPoint: "200" }], true);
            //add pool 1 with alloc = 200 
            // Alice deposits 10 LPs in pool 0 at block 500
            await (0, timer_1.advanceBlockTo)(13600499);
            await pkktFarm.connect(alice).deposit(0, "10");
            // Alice deposit 20 LPs in pool 1 at block 510
            await (0, timer_1.advanceBlockTo)(13600509);
            await pkktFarm.connect(alice).deposit(1, "20");
            //At block 520, Alice harvest all rewards
            await (0, timer_1.advanceBlockTo)(13600519);
            await pkktFarm.connect(alice).harvestAll([0, 1]);
            //At this moment, Alice should have:
            //pool 0: 20 block 20 * 100 * 1/3
            //pool 1: 10 block 10 * 100 * 2/3
            //ppkt token of alice after havertAll is 1332
            const alicePkkt = await pkktToken.balanceOf(alice.address);
            chai_1.assert.equal(alicePkkt.toString(), "1332");
            //At block 530, admin reset pool heights
            await (0, timer_1.advanceBlockTo)(13600529);
            await pkktFarm.setMany([{ pid: 0, allocPoint: "200" }, { pid: 1, allocPoint: "100" }], true);
            await lp.connect(bob).approve(pkktFarm.address, "1000");
            //Alice deposits 10 LPs in pool 0 at block 540
            await (0, timer_1.advanceBlockTo)(13600539);
            await pkktFarm.connect(bob).deposit(0, "10");
            await (0, timer_1.advanceBlockTo)(13600550);
            //At this moment, Alice should have:
            //pool 0:  (10 * 1 * 1/3 + 10 * 1 * 2/3 + 10 * 0.5 * 2/3)*100
            //pool 1:  10 * 1 * 2/3  * 100 + 20 * 1 * 1/3 * 100
            const alicePkktBal1 = await pkktFarm.pendingPKKT(0, alice.address);
            chai_1.assert.equal(alicePkktBal1.toString(), "1333");
            const alicePkktBal2 = await pkktFarm.pendingPKKT(1, alice.address);
            chai_1.assert.equal(alicePkktBal2.toString(), "1333");
        });
    });
});
