import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import { PKKTToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
 
import { WEI } from "../constants/constants";

const CAP = BigNumber.from(1000).mul(WEI);

describe.skip("PKKT Token", async function () {
    let pkktToken: PKKTToken;
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    before(async function () {
      [deployer, alice, bob, carol] = await ethers.getSigners(); 
  
      pkktToken = await deployContract("PKKTToken", deployer as Signer, ["PKKTToken","PKKT", CAP.toString()]) as PKKTToken; 
      this.owner = deployer as Signer;
    });
   
    it("Should have the correct name and symbol and decimals and owner", async function () {
      const name = await pkktToken.name();
      const symbol = await pkktToken.symbol();
      const decimals = await pkktToken.decimals();
      const owner = await pkktToken.owner(); 
      
      assert.equal(name, "PKKTToken");
      assert.equal(symbol, "PKKT"); 
      assert.equal(decimals, 18);  
      assert.equal(deployer.address, owner);   
    });
    it("Should only owner transfer ownership", async function () { 
      await expect(pkktToken.connect(alice as Signer).transferOwnership(deployer.address)).to.be.revertedWith("caller is not the owner");
      await expect(pkktToken.connect(deployer as Signer).transferOwnership(alice.address)).to.not.be.reverted;
      await expect(pkktToken.connect(alice as Signer).transferOwnership(deployer.address)).to.not.be.reverted;
    });

    it("Should only owner and minters allow to mint token with allowance of minting", async function () {
          
        await expect(pkktToken.connect(this.owner).increaseMintingAllowance(deployer.address, "100")).to.not.be.reverted;
        await expect(pkktToken.connect(alice as Signer).mint(alice.address, "100")).to.be.revertedWith("must have minter role to mint"); 
        await expect(pkktToken.connect(this.owner).mint(alice.address, "90")).to.not.be.reverted;
        await expect(pkktToken.connect(this.owner).mint(alice.address, "11")).to.be.revertedWith("mint amount exceeds allowance");  
        await expect(pkktToken.connect(this.owner).mint(alice.address, "10")).to.not.be.reverted;

        await pkktToken.connect(this.owner).transferOwnership(alice.address);   
        this.owner = alice as Signer;

        await expect(pkktToken.connect(deployer as Signer).addMinter(alice.address, "10")).to.be.revertedWith("caller is not the owner");
        await expect(pkktToken.connect(this.owner).addMinter(alice.address, "10")).to.not.be.reverted; 
        await expect(pkktToken.connect(this.owner).mint(bob.address, "10")).to.not.be.reverted;
        await expect(pkktToken.connect(this.owner).mint(alice.address, "10")).to.be.revertedWith("mint amount exceeds allowance");   
        await expect(pkktToken.connect(this.owner).increaseMintingAllowance(alice.address, "10")).to.not.be.reverted;  
        await expect(pkktToken.connect(this.owner).mint(bob.address, "10")).to.not.be.reverted;
          
        const totalSupply = await pkktToken.totalSupply();
        const aliceBal = await pkktToken.balanceOf(alice.address);
        const bobBal = await pkktToken.balanceOf(bob.address);
        const carolBal = await pkktToken.balanceOf(carol.address); 
        assert.equal(aliceBal.toString(), BigNumber.from(100).toString());  
        assert.equal(bobBal.toString(), BigNumber.from(20).toString());  
        assert.equal(carolBal.toString(), BigNumber.from(0).toString());  
        assert.equal(totalSupply.toString(), BigNumber.from(120).toString());    
      });

      it("should let owner allow to burn token", async function () {
        
        const aliceBalOld = await pkktToken.balanceOf(alice.address);
        await pkktToken.connect(this.owner).increaseMintingAllowance(deployer.address, "1000");
        await pkktToken.connect(deployer as Signer).mint(alice.address, "1000");
        
        await expect(pkktToken.connect(deployer as Signer).burn("10")).to.be.revertedWith("Ownable: caller is not the owner");  
        await expect(pkktToken.connect(this.owner).burn("10")).to.not.be.reverted; 
        const aliceBalNew = await pkktToken.balanceOf(alice.address);
         
        const diff = aliceBalNew.sub(aliceBalOld);

        assert.equal(diff.toString(), BigNumber.from(990).toString());  
      });

      it("Should burn token from if have aprove", async function () {
        const bobBalOld = await pkktToken.balanceOf(bob.address);
        await pkktToken.connect(this.owner).increaseMintingAllowance(this.owner.address, "1000");
        await pkktToken.connect(this.owner).mint(bob.address, "100");
        await pkktToken.connect(bob as Signer).approve(this.owner.address, "100");
        await pkktToken.connect(this.owner).burnFrom(bob.address, "10");
        const bobBalNew = await pkktToken.balanceOf(bob.address);
        const diff = bobBalNew.sub(bobBalOld);
        assert.equal(diff.toString(), BigNumber.from(90).toString());  
      });

       it("Should not let mint token if exceeds cap", async function () {
        await pkktToken.connect(this.owner).increaseMintingAllowance(
          alice.address,
          CAP
        );
        var diff = CAP.sub(await pkktToken.totalSupply());
        await expect(pkktToken.connect(alice as Signer).mint(alice.address, diff.add(1))).to.be.revertedWith("mint amount exceeds cap");  
        await expect(pkktToken.connect(alice as Signer).mint(alice.address, diff)).to.not.be.reverted;  
        await pkktToken.connect(alice as Signer).approve(this.owner.address, diff);
        await pkktToken.connect(this.owner).burnFrom(alice.address, diff);
      }); 

              
      it("should supply token transfers properly", async function () {
        
        const totalSupplyOld = await pkktToken.totalSupply();
        const aliceBalOld = await pkktToken.balanceOf(alice.address);
        const bobBalOld = await pkktToken.balanceOf(bob.address);
        const carolBalOld = await pkktToken.balanceOf(carol.address);

        await pkktToken.connect(this.owner).mint(alice.address, "100");
        await pkktToken.connect(this.owner).mint(bob.address, "1000");
        await pkktToken.connect(alice as Signer).transfer(carol.address, "10");
        await pkktToken.connect(bob as Signer).transfer(carol.address, "100", {
          from: bob.address,
        });
        const totalSupply = await pkktToken.totalSupply();
        const aliceBal = await pkktToken.balanceOf(alice.address);
        const bobBal = await pkktToken.balanceOf(bob.address);
        const carolBal = await pkktToken.balanceOf(carol.address);
        assert.equal((totalSupply.sub(totalSupplyOld)).toString(),  "1100");  
        assert.equal((aliceBal.sub(aliceBalOld)).toString(),  "90");  
        assert.equal((bobBal.sub(bobBalOld)).toString(),  "900");   
        assert.equal((carolBal.sub(carolBalOld)).toString(),  "110");   
      });

       it("should fail if you try to do bad transfers", async function () { 
        const aliceBal = await pkktToken.balanceOf(alice.address);
        await expect(
           pkktToken.connect(alice as Signer).transfer(carol.address, aliceBal.add(1))
        ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
         
      }); 
  });

  
