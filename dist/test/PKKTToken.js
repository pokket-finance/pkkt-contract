"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const deploy_1 = require("./utilities/deploy");
const constants_1 = require("../constants/constants");
const CAP = ethers_1.BigNumber.from(1000).mul(constants_1.WEI);
describe.skip("PKKT Token", async function () {
    let pkktToken;
    let deployer;
    let alice;
    let bob;
    let carol;
    before(async function () {
        [deployer, alice, bob, carol] = await hardhat_1.ethers.getSigners();
        pkktToken = await (0, deploy_1.deployContract)("PKKTToken", deployer, ["PKKTToken", "PKKT", CAP.toString()]);
        this.owner = deployer;
    });
    it("Should have the correct name and symbol and decimals and owner", async function () {
        const name = await pkktToken.name();
        const symbol = await pkktToken.symbol();
        const decimals = await pkktToken.decimals();
        const owner = await pkktToken.owner();
        chai_1.assert.equal(name, "PKKTToken");
        chai_1.assert.equal(symbol, "PKKT");
        chai_1.assert.equal(decimals, 18);
        chai_1.assert.equal(deployer.address, owner);
    });
    it("Should only owner transfer ownership", async function () {
        await (0, chai_1.expect)(pkktToken.connect(alice).transferOwnership(deployer.address)).to.be.revertedWith("caller is not the owner");
        await (0, chai_1.expect)(pkktToken.connect(deployer).transferOwnership(alice.address)).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(alice).transferOwnership(deployer.address)).to.not.be.reverted;
    });
    it("Should only owner and minters allow to mint token with allowance of minting", async function () {
        await (0, chai_1.expect)(pkktToken.connect(this.owner).increaseMintingAllowance(deployer.address, "100")).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(alice).mint(alice.address, "100")).to.be.revertedWith("must have minter role to mint");
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(alice.address, "90")).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(alice.address, "11")).to.be.revertedWith("mint amount exceeds allowance");
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(alice.address, "10")).to.not.be.reverted;
        await pkktToken.connect(this.owner).transferOwnership(alice.address);
        this.owner = alice;
        await (0, chai_1.expect)(pkktToken.connect(deployer).addMinter(alice.address, "10")).to.be.revertedWith("caller is not the owner");
        await (0, chai_1.expect)(pkktToken.connect(this.owner).addMinter(alice.address, "10")).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(bob.address, "10")).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(alice.address, "10")).to.be.revertedWith("mint amount exceeds allowance");
        await (0, chai_1.expect)(pkktToken.connect(this.owner).increaseMintingAllowance(alice.address, "10")).to.not.be.reverted;
        await (0, chai_1.expect)(pkktToken.connect(this.owner).mint(bob.address, "10")).to.not.be.reverted;
        const totalSupply = await pkktToken.totalSupply();
        const aliceBal = await pkktToken.balanceOf(alice.address);
        const bobBal = await pkktToken.balanceOf(bob.address);
        const carolBal = await pkktToken.balanceOf(carol.address);
        chai_1.assert.equal(aliceBal.toString(), ethers_1.BigNumber.from(100).toString());
        chai_1.assert.equal(bobBal.toString(), ethers_1.BigNumber.from(20).toString());
        chai_1.assert.equal(carolBal.toString(), ethers_1.BigNumber.from(0).toString());
        chai_1.assert.equal(totalSupply.toString(), ethers_1.BigNumber.from(120).toString());
    });
    it("should let owner allow to burn token", async function () {
        const aliceBalOld = await pkktToken.balanceOf(alice.address);
        await pkktToken.connect(this.owner).increaseMintingAllowance(deployer.address, "1000");
        await pkktToken.connect(deployer).mint(alice.address, "1000");
        await (0, chai_1.expect)(pkktToken.connect(deployer).burn("10")).to.be.revertedWith("Ownable: caller is not the owner");
        await (0, chai_1.expect)(pkktToken.connect(this.owner).burn("10")).to.not.be.reverted;
        const aliceBalNew = await pkktToken.balanceOf(alice.address);
        const diff = aliceBalNew.sub(aliceBalOld);
        chai_1.assert.equal(diff.toString(), ethers_1.BigNumber.from(990).toString());
    });
    it("Should burn token from if have aprove", async function () {
        const bobBalOld = await pkktToken.balanceOf(bob.address);
        await pkktToken.connect(this.owner).increaseMintingAllowance(this.owner.address, "1000");
        await pkktToken.connect(this.owner).mint(bob.address, "100");
        await pkktToken.connect(bob).approve(this.owner.address, "100");
        await pkktToken.connect(this.owner).burnFrom(bob.address, "10");
        const bobBalNew = await pkktToken.balanceOf(bob.address);
        const diff = bobBalNew.sub(bobBalOld);
        chai_1.assert.equal(diff.toString(), ethers_1.BigNumber.from(90).toString());
    });
    it("Should not let mint token if exceeds cap", async function () {
        await pkktToken.connect(this.owner).increaseMintingAllowance(alice.address, CAP);
        var diff = CAP.sub(await pkktToken.totalSupply());
        await (0, chai_1.expect)(pkktToken.connect(alice).mint(alice.address, diff.add(1))).to.be.revertedWith("mint amount exceeds cap");
        await (0, chai_1.expect)(pkktToken.connect(alice).mint(alice.address, diff)).to.not.be.reverted;
        await pkktToken.connect(alice).approve(this.owner.address, diff);
        await pkktToken.connect(this.owner).burnFrom(alice.address, diff);
    });
    it("should supply token transfers properly", async function () {
        const totalSupplyOld = await pkktToken.totalSupply();
        const aliceBalOld = await pkktToken.balanceOf(alice.address);
        const bobBalOld = await pkktToken.balanceOf(bob.address);
        const carolBalOld = await pkktToken.balanceOf(carol.address);
        await pkktToken.connect(this.owner).mint(alice.address, "100");
        await pkktToken.connect(this.owner).mint(bob.address, "1000");
        await pkktToken.connect(alice).transfer(carol.address, "10");
        await pkktToken.connect(bob).transfer(carol.address, "100", {
            from: bob.address,
        });
        const totalSupply = await pkktToken.totalSupply();
        const aliceBal = await pkktToken.balanceOf(alice.address);
        const bobBal = await pkktToken.balanceOf(bob.address);
        const carolBal = await pkktToken.balanceOf(carol.address);
        chai_1.assert.equal((totalSupply.sub(totalSupplyOld)).toString(), "1100");
        chai_1.assert.equal((aliceBal.sub(aliceBalOld)).toString(), "90");
        chai_1.assert.equal((bobBal.sub(bobBalOld)).toString(), "900");
        chai_1.assert.equal((carolBal.sub(carolBalOld)).toString(), "110");
    });
    it("should fail if you try to do bad transfers", async function () {
        const aliceBal = await pkktToken.balanceOf(alice.address);
        await (0, chai_1.expect)(pkktToken.connect(alice).transfer(carol.address, aliceBal.add(1))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
});
