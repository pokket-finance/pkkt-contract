const { ethers } = require("hardhat");
const { expect } = require("chai");
const { advanceBlockTo } = require("./utilities/time.js");
describe("PKKT-Farm ", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
    this.minter = this.signers[4];

    this.PkktFarm = await ethers.getContractFactory("PKKTFarm");
    this.PKKTToken = await ethers.getContractFactory("PKKTToken");
    this.ERC20Mock = await ethers.getContractFactory("ERC20Mock", this.minter);
  });
  beforeEach(async function () {
    this.pkkt = await this.PKKTToken.deploy("PokketToken","PKKT","100000000000");
    await this.pkkt.deployed();
  });

  it("should set correct state variables", async function () {
    this.farm = await this.PkktFarm.deploy(this.pkkt.address, "1000", "0");
    await this.farm.deployed();

    await this.pkkt.transferOwnership(this.farm.address);

    const pkkt = await this.farm.pkkt();
    const owner = await this.pkkt.owner();

    expect(pkkt).to.equal(this.pkkt.address);
    expect(owner).to.equal(this.farm.address);
  });
  context("With ERC/LP token added to the field", function () {
    beforeEach(async function () {
      this.lp = await this.ERC20Mock.deploy("LPToken", "LP", "10000000000");

      await this.lp.transfer(this.alice.address, "1000");

      await this.lp.transfer(this.bob.address, "1000");

      await this.lp.transfer(this.carol.address, "1000");

      this.lp2 = await this.ERC20Mock.deploy("LPToken2", "LP2", "10000000000");

      await this.lp2.transfer(this.alice.address, "1000");

      await this.lp2.transfer(this.bob.address, "1000");

      await this.lp2.transfer(this.carol.address, "1000");
    });

    it("should allow emergency withdraw", async function () {
      // 100 per block farming rate starting at block 100
      this.farm = await this.PkktFarm.deploy(this.pkkt.address, "100", "100");
      await this.farm.deployed();

      await this.farm.add("100", this.lp.address, true);

      await this.lp.connect(this.bob).approve(this.farm.address, "1000");

      await this.farm.connect(this.bob).deposit(0, "100");

      expect(await this.lp.balanceOf(this.bob.address)).to.equal("900");

      await this.farm.connect(this.bob).emergencyWithdraw(0);

      expect(await this.lp.balanceOf(this.bob.address)).to.equal("1000");
    });
    it("should not distribute pkkts if no one deposit", async function () {
      // 100 per block farming rate starting at block 200
      this.farm = await this.PkktFarm.deploy(this.pkkt.address, "100", "200");
      await this.farm.deployed();
      await this.pkkt.addMinter(this.farm.address, "100000");
      await this.farm.add("100", this.lp.address, true);
      await this.lp.connect(this.bob).approve(this.farm.address, "1000");
      await advanceBlockTo("199");
      expect(await this.pkkt.totalSupply()).to.equal("0");
      await advanceBlockTo("204");
      expect(await this.pkkt.totalSupply()).to.equal("0");
      await advanceBlockTo("209");
      await this.farm.connect(this.bob).deposit(0, "10"); // block 210
      expect(await this.pkkt.totalSupply()).to.equal("0");
      expect(await this.pkkt.balanceOf(this.bob.address)).to.equal("0");

      expect(await this.lp.balanceOf(this.bob.address)).to.equal("990");
      await advanceBlockTo("219");
      await this.farm.connect(this.bob).withdraw(0, "10", true); // block 220
      expect(await this.pkkt.totalSupply()).to.equal("1000");
      expect(await this.pkkt.balanceOf(this.bob.address)).to.equal("1000");
      expect(await this.lp.balanceOf(this.bob.address)).to.equal("1000");
    });
    it("should distribute pkkts properly for each staker", async function () {
      // 100 per block farming rate starting at block 300
      this.farm = await this.PkktFarm.deploy(this.pkkt.address, "100", "300");
      await this.farm.deployed();
      await this.pkkt.addMinter(this.farm.address, "100000");
      await this.farm.add("100", this.lp.address, true);
      await this.lp.connect(this.alice).approve(this.farm.address, "1000", {
        from: this.alice.address,
      });
      await this.lp.connect(this.bob).approve(this.farm.address, "1000", {
        from: this.bob.address,
      });
      await this.lp.connect(this.carol).approve(this.farm.address, "1000", {
        from: this.carol.address,
      });
      // Alice deposits 10 LPs at block 310
      await advanceBlockTo("309");
      await this.farm
        .connect(this.alice)
        .deposit(0, "10", { from: this.alice.address });
      // Bob deposits 20 LPs at block 314
      await advanceBlockTo("313");
      await this.farm
        .connect(this.bob)
        .deposit(0, "20", { from: this.bob.address });
      expect(await this.farm.pendingPKKT(0, this.alice.address)).to.equal(
        "400"
      );
      // Carol deposits 30 LPs at block 318
      await advanceBlockTo("317");
      await this.farm
        .connect(this.carol)
        .deposit(0, "30", { from: this.carol.address });
      // Alice deposits 10 more LPs at block 320. At this point:
      //   Alice should have: 4*1000 + 4*1/3*1000 + 2*1/6*1000 = 5666
      await advanceBlockTo("319");
      await this.farm
        .connect(this.alice)
        .deposit(0, "10", { from: this.alice.address });
      expect(await this.pkkt.balanceOf(this.alice.address)).to.equal("0");
      expect(await this.pkkt.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.pkkt.balanceOf(this.carol.address)).to.equal("0");
      // Bob withdraws 5 LPs at block 330. At this point:
      //   Bob should have: 4*2/3*100 + 2*2/6*100 + 10*2/7*100 = 619
      await advanceBlockTo("329");
      await this.farm
        .connect(this.bob)
        .withdraw(0, "5", { from: this.bob.address });
      expect(await this.pkkt.balanceOf(this.alice.address)).to.equal("0");
      expect(await this.pkkt.balanceOf(this.bob.address)).to.equal("619");
      expect(await this.pkkt.balanceOf(this.carol.address)).to.equal("0");
      // Alice withdraws 20 LPs at block 340.
      // Bob withdraws 15 LPs at block 350.
      // Carol withdraws 30 LPs at block 360.
      await advanceBlockTo("339");
      await this.farm
        .connect(this.alice)
        .withdraw(0, "20", true, { from: this.alice.address });
      await advanceBlockTo("349");
      await this.farm
        .connect(this.bob)
        .withdraw(0, "15", true, { from: this.bob.address });
      await advanceBlockTo("359");
      await this.farm
        .connect(this.carol)
        .withdraw(0, "30", true, { from: this.carol.address });
      // Alice should have: 566 + 10*2/7*100 + 10*2/6.5*100 = 1159
      expect(await this.pkkt.balanceOf(this.alice.address)).to.equal("1159");
      // Bob should have: 619 + 10*1.5/6.5 * 100 + 10*1.5/4.5*100 = 1183
      expect(await this.pkkt.balanceOf(this.bob.address)).to.equal("1183");
      // Carol should have: 2*3/6*100 + 10*3/7*100 + 10*3/6.5*100 + 10*3/4.5*100 + 10*100 = 2657
      expect(await this.pkkt.balanceOf(this.carol.address)).to.equal("2657");
      // All of them should have 1000 LPs back.
      expect(await this.lp.balanceOf(this.alice.address)).to.equal("1000");
      expect(await this.lp.balanceOf(this.bob.address)).to.equal("1000");
      expect(await this.lp.balanceOf(this.carol.address)).to.equal("1000");
    });

    it("should give proper pkkts allocation to each pool", async function () {
      // 100 per block farming rate starting at block 400
      this.farm = await this.PkktFarm.deploy(this.pkkt.address, "100", "400");

      await this.pkkt.addMinter(this.farm.address, "100000");
      await this.lp
        .connect(this.alice)
        .approve(this.farm.address, "1000", { from: this.alice.address });
      await this.lp2
        .connect(this.bob)
        .approve(this.farm.address, "1000", { from: this.bob.address });
      // Add first LP to the pool with allocation 1
      await this.farm.add("10", this.lp.address, true);
      // Alice deposits 10 LPs at block 410
      await advanceBlockTo("409");
      await this.farm
        .connect(this.alice)
        .deposit(0, "10", { from: this.alice.address });
      // Add LP2 to the pool with allocation 2 at block 420
      await advanceBlockTo("419");
      await this.farm.add("20", this.lp2.address, true);
      // Alice should have 10*100 pending reward
      expect(await this.farm.pendingPKKT(0, this.alice.address)).to.equal(
        "1000"
      );
      // Bob deposits 10 LP2s at block 425
      await advanceBlockTo("424");
      await this.farm
        .connect(this.bob)
        .deposit(1, "5", { from: this.bob.address });
      // Alice should have 1000 + 5*1/3*100 = 1166 pending reward
      expect(await this.farm.pendingPKKT(0, this.alice.address)).to.equal(
        "1166"
      );
      await advanceBlockTo("430");
      // At block 430. Bob should get 5*2/3*100 = 333. Alice should get ~166 more.
      expect(await this.farm.pendingPKKT(0, this.alice.address)).to.equal(
        "1333"
      );
      expect(await this.farm.pendingPKKT(1, this.bob.address)).to.equal("333");
      await this.farm.connect(this.bob).harvest(1);
      expect(await this.farm.pendingPKKT(1, this.bob.address)).to.equal("0");
    });
    it("should give give ppkt token from all pool if harvest all", async function () {
      // 100 per block farming rate starting at block 100 with bonus until block 1000
      this.farm = await this.PkktFarm.deploy(this.pkkt.address, "100", "100");
      await this.pkkt.addMinter(this.farm.address, "100000");
      await this.lp
        .connect(this.alice)
        .approve(this.farm.address, "1000", { from: this.alice.address });
      await this.lp2
        .connect(this.alice)
        .approve(this.farm.address, "1000", { from: this.alice.address });
      //add pool 0 with alloc = 100
      await this.farm.add("100", this.lp.address, true);
      //add pool 1 with alloc = 200
      await this.farm.add("200", this.lp2.address, true);
      // Alice deposits 10 LPs in pool 0 at block 200
      await advanceBlockTo("199");
      await this.farm.connect(this.alice).deposit(0, "10");
      // Alice deposit 20 LPs in pool 1 at block 210
      await advanceBlockTo("209");
      await this.farm.connect(this.alice).deposit(1, "20");
      //At block 220, Alice harvest all rewards
      await advanceBlockTo("219");
      await this.farm.connect(this.alice).harvestAll([0, 1]);
      //At this moment, Alice should have:
      //pool 0: 20 block 20 * 10 * 1/3
      //pool 1: 10 block 10 * 10 * 2/3
      //ppkt token of alice after havertAll is 132
      const aliBal = await this.pkkt.balanceOf(this.alice.address);
      expect(aliBal).to.equal("132");
    });
  });
});

