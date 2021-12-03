import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterOption, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
 
 

const WEI = BigNumber.from(10).pow(18);

const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

const USDTDecimals = 6; 
const ETHDecimals = 18;
const WBTCDecimals = 8;
const USDTMultiplier = BigNumber.from(10).pow(USDTDecimals);  
const ETHMultiplier = BigNumber.from(10).pow(ETHDecimals);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTCDecimals);  
const NULL_ADDRESS ="0x0000000000000000000000000000000000000000";
const ETHPicePrecision = 4;
const WBTCPicePrecision = 4;
const RationMultipler = 10000;

describe("PKKT Hodl Booster", async function () {
    let ethHodlBooster: PKKTHodlBoosterOption;
    let wbtcHodlBooster: PKKTHodlBoosterOption;
    let deployer: SignerWithAddress; 
    let alice: SignerWithAddress; 
    let bob: SignerWithAddress; 
    let carol: SignerWithAddress;
    let trader: SignerWithAddress; 
    let usdt: ERC20Mock;
    let wbtc: ERC20Mock; 
    before(async function () {
      [deployer, alice, bob, carol, trader] = await ethers.getSigners(); 
        
    });

    context("User operations", function () {
        beforeEach(async function () {
        
          this.owner = deployer as Signer;  
          usdt = await  deployContract("ERC20Mock", deployer as Signer, ["USDTToken", "USDT", BigNumber.from(10000).mul(USDTMultiplier), USDTDecimals]) as ERC20Mock;
          wbtc = await  deployContract("ERC20Mock", deployer as Signer, ["Wrapped BTC", "WBTC", BigNumber.from(100).mul(WBTCMultiplier), WBTCDecimals]) as ERC20Mock;
           
          ethHodlBooster = await deployContract("PKKTHodlBoosterOption", deployer as Signer, 
          ["ETH-USDT-HodlBooster", "ETHUSDTHodlBooster", NULL_ADDRESS, usdt.address, ETHDecimals, USDTDecimals]) as PKKTHodlBoosterOption; 
                     
          wbtcHodlBooster = await deployContract("PKKTHodlBoosterOption", deployer as Signer, 
          ["WBTC-USDT-HodlBooster", "WBTCUSDTHodlBooster", wbtc.address, usdt.address, WBTCDecimals, USDTDecimals]) as PKKTHodlBoosterOption; 

          await usdt.transfer(alice.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(bob.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(carol.address,  BigNumber.from(100).mul(USDTMultiplier));

          await wbtc.transfer(alice.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address,  BigNumber.from(10).mul(WBTCMultiplier)); 
        });
        
        afterEach(async function () {
 
        });
       
        it("should allow deposit when started", async function () {
           
          await expect(ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");  
          await wbtc.connect(alice as Signer).approve(wbtcHodlBooster.address, BigNumber.from(10).mul(WBTCMultiplier));   
          await expect(wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  
          await ethHodlBooster.closePrevious(4000 * (10**ETHPicePrecision)); //4000usdt
          await ethHodlBooster.rollToNext( {
            quota: BigNumber.from(10).mul(ETHMultiplier),
            pricePrecision: ETHPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
          });
          await wbtcHodlBooster.closePrevious(60000 * (10**WBTCPicePrecision)); //60000usdt
          await wbtcHodlBooster.rollToNext( {
            quota: BigNumber.from(2).mul(WBTCMultiplier),
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
          });

          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));

          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});
          await expect(ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
          await expect(wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
          await expect(wbtcHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  

          var pendingEth = await ethHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingEth.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          var ongoingEth = await ethHodlBooster.connect(alice as Signer).getOngoingAsset(); 
          assert.equal(ongoingEth.toString(), "0"); 
          
          var pendingBTC = await wbtcHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var ongoingBTC = await wbtcHodlBooster.connect(alice as Signer).getOngoingAsset(); 
          assert.equal(ongoingBTC.toString(), "0"); 


        });


      });  
   
  });

  
