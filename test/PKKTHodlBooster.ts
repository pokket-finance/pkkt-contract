import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterOption, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS } from "../constants/constants";
 
 

const WEI = BigNumber.from(10).pow(18);

const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

const USDTDecimals = 6; 
const ETHDecimals = 18;
const WBTCDecimals = 8;
const USDTMultiplier = BigNumber.from(10).pow(USDTDecimals);  
const ETHMultiplier = BigNumber.from(10).pow(ETHDecimals);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTCDecimals);   
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
          await wbtc.connect(alice as Signer).approve(wbtcHodlBooster.address, BigNumber.from(10).mul(WBTCMultiplier));   
          await wbtc.connect(bob as Signer).approve(wbtcHodlBooster.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          await wbtc.connect(carol as Signer).approve(wbtcHodlBooster.address, BigNumber.from(10).mul(WBTCMultiplier)); 

        });
        
        afterEach(async function () {
 
        });
       
        it("should allow deposit and redeem when started", async function () {
           
          await expect(ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
          await expect(wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  
          const ethPrice = 4000 * (10**ETHPicePrecision);
          await ethHodlBooster.closePrevious(ethPrice); //4000usdt
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
          };
          await ethHodlBooster.rollToNext(parameters1);
          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
          };
          await wbtcHodlBooster.closePrevious(btcPrice); //60000usdt
          await wbtcHodlBooster.rollToNext( parameters2);

          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));
 
          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});
          await expect(ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
          await expect(wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
          await expect(wbtcHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  
           
          await wbtcHodlBooster.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          var pendingEth = await ethHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingEth.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          var ongoingEth = await ethHodlBooster.connect(alice as Signer).getOngoingAsset(); 
          assert.equal(ongoingEth.toString(), "0"); 
          
          var pendingBTC = await wbtcHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var ongoingBTC = await wbtcHodlBooster.connect(alice as Signer).getOngoingAsset(); 
          assert.equal(ongoingBTC.toString(), "0"); 
          pendingBTC = await wbtcHodlBooster.connect(bob as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          ongoingBTC = await wbtcHodlBooster.connect(bob as Signer).getOngoingAsset(); 
          assert.equal(ongoingBTC.toString(), "0"); 

          var round = await ethHodlBooster.currentRound();
          var optionState = await ethHodlBooster.optionStates(round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.underlyingPrice.toString(), "0");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), parameters1.pricePrecision.toString());
          assert.equal(optionState.interestRate.toString(), parameters1.interestRate.toString());
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");

          round = await wbtcHodlBooster.currentRound();
          optionState = await wbtcHodlBooster.optionStates(round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.underlyingPrice.toString(), "0");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), parameters2.pricePrecision.toString());
          assert.equal(optionState.interestRate.toString(), parameters2.interestRate.toString());
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");   
          var ethBalance = await ethers.provider.getBalance(alice.address); 
          await ethHodlBooster.connect(alice as Signer).redeem(BigNumber.from(8).mul(ETHMultiplier));
          await ethHodlBooster.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier));

          await expect(ethHodlBooster.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.revertedWith("Exceeds available");  
          var ethBalance2 = await ethers.provider.getBalance(alice.address); 
          var diff = ethBalance2.div(ETHMultiplier).sub(ethBalance.div(ETHMultiplier));
          assert.equal(diff.toString(), BigNumber.from(9).toString());
          pendingEth = await ethHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingEth.toString(), "0");
          var optionState = await ethHodlBooster.optionStates(round); 
          assert.equal(optionState.totalAmount.toString(), "0");
          var btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
          await wbtcHodlBooster.connect(alice as Signer).redeem(BigNumber.from(15).mul(WBTCMultiplier).div(10));
          var btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address); 
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15).mul(WBTCMultiplier).div(10).toString());
          var btcBalance = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          await wbtcHodlBooster.connect(bob as Signer).redeem(BigNumber.from(5).mul(WBTCMultiplier).div(10));
          btcBalance2 = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          var pendingBtc = await wbtcHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBtc.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          optionState = await wbtcHodlBooster.optionStates(round); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
        });

        it("should allow settlement", async function () {
          const ethPrice = 4000 * (10**ETHPicePrecision);
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
          }; 
          await ethHodlBooster.rollToNext(parameters1);  

          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
          }; 
          await wbtcHodlBooster.rollToNext(parameters2); 
          
          //round 1:
          //10 eth
          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});  
          await ethHodlBooster.connect(bob as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)}); 

          //2.5 btc
          await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));  
          await wbtcHodlBooster.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          
          
          var settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled);

          await ethHodlBooster.closePrevious(ethPrice); //4000usdt  
          await ethHodlBooster.commitCurrent(trader.address); //strike price 4400usdt
          const parameters3 = {
            quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
            pricePrecision: ETHPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
          };
          await ethHodlBooster.rollToNext(parameters3);  
          
          await wbtcHodlBooster.closePrevious(btcPrice); //60000usdt  
          await wbtcHodlBooster.commitCurrent(trader.address); //strike price 66000usdt
          const parameters4 = {
            quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.01 * RationMultipler, //1% per week
          };
          await wbtcHodlBooster.rollToNext(parameters4);
          settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled);

          //round 2:
          //2 eth
          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)});  
          await ethHodlBooster.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)}); 
          
          //2 btc
          await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));  
          await wbtcHodlBooster.connect(bob as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
          
          await ethHodlBooster.closePrevious(ethPrice*1.01); //4040usdt  
          await ethHodlBooster.commitCurrent(trader.address); //strike price 4444usdt
          const parameters5 = {
            quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
            pricePrecision: ETHPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.01 * RationMultipler, //1% per week
          };
          await ethHodlBooster.rollToNext(parameters5);

          await wbtcHodlBooster.closePrevious(btcPrice*1.05); //63000usdt  
          await wbtcHodlBooster.commitCurrent(trader.address); //strike price 69300usdt
          const parameters6 = {
            quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.005 * RationMultipler, //0.5% per week
          };
          await wbtcHodlBooster.rollToNext(parameters6); 

          //we have something matured
          settled = await ethHodlBooster.allSettled();
          assert.isFalse(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isFalse(settled);
          var round = await ethHodlBooster.currentRound();
          assert.equal(round.toString(), "3");   
          var request = await ethHodlBooster.getRequest();
          assert.equal(request.length, 1);

          //10*1.025-2
          assert.equal(request[0].amount.toString(), BigNumber.from(825).mul(ETHMultiplier).div(100).toString());
          assert.equal(request[0].contractAddress, NULL_ADDRESS);

          round = await wbtcHodlBooster.currentRound();
          assert.equal(round.toString(), "3");   
          var request2 = await wbtcHodlBooster.getRequest();
          assert.equal(request2.length, 1);
          //2.5*1.02-2
          assert.equal(request2[0].amount.toString(), BigNumber.from(55).mul(WBTCMultiplier).div(100).toString());
          assert.equal(request2[0].contractAddress, wbtc.address);

          
          await expect(ethHodlBooster.finishSettlement()).to.be.revertedWith("Matured Asset not filled");  
          //send eth back
          await trader.sendTransaction({to:ethHodlBooster.address, value:request[0].amount});
          await ethHodlBooster.finishSettlement();
          
          await expect(wbtcHodlBooster.finishSettlement()).to.be.revertedWith("Matured Asset not filled");   
          //send wbtc back
          await wbtc.connect(trader as Signer).transfer(wbtcHodlBooster.address, request2[0].amount); 
          await wbtcHodlBooster.finishSettlement();

          settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled); 
 
          var ethBalance = await ethers.provider.getBalance(ethHodlBooster.address); 
          var btcBalance = await wbtc.balanceOf(wbtcHodlBooster.address); 
          assert.equal(ethBalance.toString(), BigNumber.from(1025).mul(ETHMultiplier).div(100).toString());
          assert.equal(btcBalance.toString(), BigNumber.from(255).mul(WBTCMultiplier).div(100).toString());
          
        });
      });  
   
  });

  
