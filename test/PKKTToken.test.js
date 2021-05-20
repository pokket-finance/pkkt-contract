const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("PKKT Token", async function () {
  before(async function () {
    this.PKKTToken = await ethers.getContractFactory("PKKTToken");
    this.signer = await ethers.getSigners();
    this.alice = await this.signer[0];
    this.bob = await this.signer[1];
    this.carol = await this.signer[2];
  });

  beforeEach(async function () {
    this.pkktToken = await this.PKKTToken.deploy("10000000");
    await this.pkktToken.deployed();
    await this.pkktToken.increaseMintingAllowance(
      this.alice.address,
      "1000000"
    );
    await this.pkktToken
      .connect(this.alice)
      .mint(this.pkktToken.address, "10000");
  });

  it("Should have the correct name and symbol and decimals", async function () {
    const name = this.pkktToken.name();
    const symbol = this.pkktToken.symbol();
    const decimals = this.pkktToken.decimals();
    expect(name, "PKKT Token");
    expect(symbol, "PKKT");
    expect(decimals, 18);
  });

  it("Should only owner and minters allow to mint token with allowance of minting", async function () {
    await this.pkktToken.mint(this.alice.address, "10");
    await this.pkktToken.mint(this.bob.address, "100");
    await this.pkktToken
      .connect(this.alice)
      .addMinter(this.bob.address, "1000");
    await this.pkktToken.connect(this.bob).mint(this.bob.address, "10");
    const totalSupply = await this.pkktToken.totalSupply();
    const aliceBal = await this.pkktToken.balanceOf(this.alice.address);
    const bobBal = await this.pkktToken.balanceOf(this.bob.address);
    const carolBal = await this.pkktToken.balanceOf(this.carol.address);
    expect(aliceBal).to.equal("10");
    expect(bobBal).to.equal("110");
    expect(carolBal).to.equal("0");
    expect(totalSupply).to.equal("10120");
  });

  it("Should minters allow to mint token with allowance of minting", async function () {
    await this.pkktToken.mint(this.alice.address, "10");
    await this.pkktToken.mint(this.bob.address, "100");
    await this.pkktToken
      .connect(this.alice)
      .addMinter(this.bob.address, "1000");
    await this.pkktToken.connect(this.bob).mint(this.bob.address, "10");
    await expect(
      this.pkktToken.connect(this.bob).mint(this.bob.address, "1010")
    ).to.be.revertedWith("mint amount exceeds allowance");
    await this.pkktToken
      .connect(this.alice)
      .increaseMintingAllowance(this.bob.address, "1000");
    await this.pkktToken.connect(this.bob).mint(this.bob.address, "1500");
    const bobAllowMint = await this.pkktToken.mintingAllowance(
      this.bob.address
    );
    expect(bobAllowMint).to.equal("490");
  });

  it("should let owner allow to burn token", async function () {
    await this.pkktToken.mint(this.alice.address, "1000");
    await this.pkktToken.connect(this.alice).burn("10");
    const aliceBal = await this.pkktToken.balanceOf(this.alice.address);
    expect(aliceBal).to.equal("990");
  });

  it("Should burn token from if have aprove", async function () {
    await this.pkktToken.mint(this.bob.address, "100");
    await this.pkktToken.connect(this.bob).approve(this.alice.address, "100");
    await this.pkktToken.connect(this.alice).burnFrom(this.bob.address, "10");
    const bobBal = await this.pkktToken.balanceOf(this.bob.address);
    expect(bobBal).to.equal("90");
  });

  it("Should not let mint token if exceeds cap", async function () {
    await this.pkktToken.increaseMintingAllowance(
      this.alice.address,
      "1000000000"
    );
    await this.pkktToken.connect(this.alice).mint(this.bob.address, "9000000");
    //cap is 10,000,000 token. alice minted 10,000 token for pkkt farm and 9,000,000 token herself so alice just can mint 990,000 token more
    await expect(
      this.pkktToken.connect(this.alice).mint(this.alice.address, "990001")
    ).to.be.revertedWith("mint amount exceeds cap");
    await this.pkktToken.connect(this.alice).mint(this.bob.address, "990000");
    const cap = await this.pkktToken.cap();
    expect(await this.pkktToken.totalSupply()).to.equal(cap);
  });

  it("should supply token transfers properly", async function () {
    await this.pkktToken.mint(this.alice.address, "100");
    await this.pkktToken.mint(this.bob.address, "1000");
    await this.pkktToken.transfer(this.carol.address, "10");
    await this.pkktToken.connect(this.bob).transfer(this.carol.address, "100", {
      from: this.bob.address,
    });
    const totalSupply = await this.pkktToken.totalSupply();
    const aliceBal = await this.pkktToken.balanceOf(this.alice.address);
    const bobBal = await this.pkktToken.balanceOf(this.bob.address);
    const carolBal = await this.pkktToken.balanceOf(this.carol.address);
    expect(totalSupply, "1100");
    expect(aliceBal, "90");
    expect(bobBal, "900");
    expect(carolBal, "110");
  });

  it("should fail if you try to do bad transfers", async function () {
    await this.pkktToken.mint(this.alice.address, "100");
    await expect(
      this.pkktToken.transfer(this.carol.address, "110")
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    await expect(
      this.pkktToken
        .connect(this.bob)
        .transfer(this.carol.address, "1", { from: this.bob.address })
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
});
