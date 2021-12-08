import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterOption, ERC20Mock, OptionVault } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI } from "../constants/constants";
 
  
const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);

const USDTDecimals = 6; 
const ETHDecimals = 18;
const WBTCDecimals = 8;
const USDTMultiplier = BigNumber.from(10).pow(USDTDecimals);  
const ETHMultiplier = BigNumber.from(10).pow(ETHDecimals);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTCDecimals);   
const ETHPricePrecision = 4;
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
    let vault: OptionVault;
    before(async function () {
      [deployer, alice, bob, carol, trader] = await ethers.getSigners(); 
        
    });

    context("User operations", function () {
        beforeEach(async function () {
        
          this.owner = deployer as Signer;  
          vault = await deployContract("OptionVault", deployer as Signer) as OptionVault;
          usdt = await  deployContract("ERC20Mock", deployer as Signer, ["USDTToken", "USDT", BigNumber.from(10000000).mul(USDTMultiplier), USDTDecimals]) as ERC20Mock;
          wbtc = await  deployContract("ERC20Mock", deployer as Signer, ["Wrapped BTC", "WBTC", BigNumber.from(100).mul(WBTCMultiplier), WBTCDecimals]) as ERC20Mock;
           
          ethHodlBooster = await deployContract("PKKTHodlBoosterOption", deployer as Signer, 
          ["ETH-USDT-HodlBooster", "ETHUSDTHodlBooster", NULL_ADDRESS, usdt.address, ETHDecimals, USDTDecimals, vault.address]) as PKKTHodlBoosterOption; 
          vault.addOption(ethHodlBooster.address);
                     
          wbtcHodlBooster = await deployContract("PKKTHodlBoosterOption", deployer as Signer, 
          ["WBTC-USDT-HodlBooster", "WBTCUSDTHodlBooster", wbtc.address, usdt.address, WBTCDecimals, USDTDecimals, vault.address]) as PKKTHodlBoosterOption; 
          vault.addOption(wbtcHodlBooster.address);

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
          const ethPrice = 4000 * (10**ETHPricePrecision);
          await ethHodlBooster.closePrevious(ethPrice); //4000usdt
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
            callOrPut: true
          };
          await ethHodlBooster.rollToNext(parameters1);
          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
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
          var ongoingEth = await ethHodlBooster.connect(alice as Signer).getOngoingAsset(0); 
          assert.equal(ongoingEth.toString(), "0"); 
          
          var pendingBTC = await wbtcHodlBooster.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var ongoingBTC = await wbtcHodlBooster.connect(alice as Signer).getOngoingAsset(0); 
          assert.equal(ongoingBTC.toString(), "0"); 
          pendingBTC = await wbtcHodlBooster.connect(bob as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          ongoingBTC = await wbtcHodlBooster.connect(bob as Signer).getOngoingAsset(0); 
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
          const ethPrice = 4000 * (10**ETHPricePrecision);
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
            callOrPut: true
          }; 
          await ethHodlBooster.rollToNext(parameters1);  

          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
          }; 
          await wbtcHodlBooster.rollToNext(parameters2); 
          
          //eth round 1: 10 eth
          await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});  
          await ethHodlBooster.connect(bob as Signer).depositETH({ value: BigNumber.from(6).mul(ETHMultiplier)}); 

          //wbtc round 1: 2.5 btc
          await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));  
          await wbtcHodlBooster.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          
          
          var settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled);

          await ethHodlBooster.closePrevious(ethPrice); //4000usdt  
           //eth round 1:strike price 4400usdt
          await ethHodlBooster.commitCurrent(trader.address);  
          const parameters3 = {
            quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
          };
          await ethHodlBooster.rollToNext(parameters3);  
          
          await wbtcHodlBooster.closePrevious(btcPrice); //60000usdt   
           //wbtc round 1:strike price 66000usdt
          await wbtcHodlBooster.commitCurrent(trader.address);  
          const parameters4 = {
            quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.01 * RationMultipler, //1% per week
            callOrPut: true
          };
          await wbtcHodlBooster.rollToNext(parameters4);
          settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled);

          //from round 2 to 9
          for(var i = 0; i < 7; i++){
            //eth round 2+i: 2 eth
            await ethHodlBooster.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)});  
            await ethHodlBooster.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)}); 
            
            //wbtc round 2+i: 2 btc
            await wbtcHodlBooster.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));  
            await wbtcHodlBooster.connect(bob as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
            
            await ethHodlBooster.closePrevious(ethPrice*1.01); //4040usdt  
            //eth round 2+i: strike price 4444usdt
            await ethHodlBooster.commitCurrent(trader.address); //strike price 4444usdt
            const parameters5 = {
              quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
              pricePrecision: ETHPricePrecision,
              strikePriceRatio: 0.1 * RationMultipler, //10% up
              interestRate: 0.01 * RationMultipler, //1% per week
              callOrPut: true
            };
            await ethHodlBooster.rollToNext(parameters5);

            await wbtcHodlBooster.closePrevious(btcPrice*1.05); //63000usdt  
            //wbtc round 2+i: strike price 69300usdt
            await wbtcHodlBooster.commitCurrent(trader.address); 
            const parameters6 = {
              quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
              pricePrecision: WBTCPicePrecision,
              strikePriceRatio: 0.1 * RationMultipler, //10% up
              interestRate: 0.005 * RationMultipler, //0.5% per week
              callOrPut: true
            };
            await wbtcHodlBooster.rollToNext(parameters6); 
          }

          //we have something matured
          settled = await ethHodlBooster.allSettled();
          assert.isFalse(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isFalse(settled);
          var round = await ethHodlBooster.currentRound();
          assert.equal(round.toString(), "9");   
          var request = await ethHodlBooster.getRequest();
          assert.equal(request.length, 1);

          //10*1.025-2
          assert.equal(request[0].amount.toString(), BigNumber.from(825).mul(ETHMultiplier).div(100).toString());
          assert.equal(request[0].contractAddress, NULL_ADDRESS);

          round = await wbtcHodlBooster.currentRound();
          assert.equal(round.toString(), "9");   
          var request2 = await wbtcHodlBooster.getRequest();
          assert.equal(request2.length, 1);
          //2.5*1.02-2
          assert.equal(request2[0].amount.toString(), BigNumber.from(55).mul(WBTCMultiplier).div(100).toString());
          assert.equal(request2[0].contractAddress, wbtc.address);

          
          await expect(ethHodlBooster.finishSettlement()).to.be.revertedWith("Matured Asset not filled");  
          //send eth back
          await trader.sendTransaction({to:request[0].targetAddress, value:request[0].amount});
          await ethHodlBooster.finishSettlement();
          
          await expect(wbtcHodlBooster.finishSettlement()).to.be.revertedWith("Matured Asset not filled");   
          //send wbtc back
          await wbtc.connect(trader as Signer).transfer(request2[0].targetAddress, request2[0].amount); 
          await wbtcHodlBooster.finishSettlement();

          settled = await ethHodlBooster.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBooster.allSettled();
          assert.isTrue(settled); 
 
          var ethBalance = await ethers.provider.getBalance(await ethHodlBooster.vaultAddress()); 
          var btcBalance = await wbtc.balanceOf(await wbtcHodlBooster.vaultAddress()); 
          assert.equal(ethBalance.toString(), BigNumber.from(1025).mul(ETHMultiplier).div(100).toString());
          assert.equal(btcBalance.toString(), BigNumber.from(255).mul(WBTCMultiplier).div(100).toString());

          //4*1.025 
          var aliceMaturedEth = await ethHodlBooster.maturedAsset(alice.address);
          var aliceMaturedUST = await ethHodlBooster.maturedStableCoin(alice.address); 
          assert.equal(aliceMaturedEth.toString(), BigNumber.from(41).mul(ETHMultiplier).div(10).toString()); 
          assert.equal(aliceMaturedUST.toString(), "0");
          
          var ethBalance = await ethers.provider.getBalance(alice.address);   
          var tx = await ethHodlBooster.connect(alice as Signer).withraw(BigNumber.from(4).mul(ETHMultiplier), false); 
          var gasUsed = (await tx.wait()).gasUsed.mul(GWEI); 
          tx = await ethHodlBooster.connect(alice as Signer).withraw(BigNumber.from(1).mul(ETHMultiplier).div(10), false); 
          var gasUsed2 = (await tx.wait()).gasUsed.mul(GWEI);  
          var gasUsed = gasUsed.add(gasUsed2);
          var ethBalance2 = await ethers.provider.getBalance(alice.address);  
          var diff = ethBalance2.sub(ethBalance).add(gasUsed).sub(BigNumber.from(41).mul(ETHMultiplier).div(10)).abs(); 
          //diff is less than 1gwei (due to the precision lose of gasUsed returned as gwei)
          assert.isTrue(diff.lte(GWEI));
          await expect(ethHodlBooster.connect(alice as Signer).withraw(1, false)).to.be.revertedWith("Exceed available");  
          await expect(ethHodlBooster.connect(alice as Signer).withraw(1, true)).to.be.revertedWith("Exceed available");     

          //6*1.025  
          ethBalance = await ethers.provider.getBalance(bob.address); 
          var bobMaturedEth = await ethHodlBooster.maturedAsset(bob.address);
          var bobeMaturedUST = await ethHodlBooster.maturedStableCoin(bob.address); 
          assert.equal(bobMaturedEth.toString(), BigNumber.from(615).mul(ETHMultiplier).div(100).toString()); 
          assert.equal(bobeMaturedUST.toString(), "0");
          
          tx = await ethHodlBooster.connect(bob as Signer).withraw(BigNumber.from(615).mul(ETHMultiplier).div(100), false); 
          var gasUsed3 = (await tx.wait()).gasUsed.mul(GWEI);  
          ethBalance2 = await ethers.provider.getBalance(bob.address);  
          diff = ethBalance2.sub(ethBalance).add(gasUsed3).sub(BigNumber.from(615).mul(ETHMultiplier).div(100)).abs(); 
          //diff is less than 1gwei (due to the precision lose of gasUsed returned as gwei)
          assert.isTrue(diff.lte(GWEI)); 
          await expect(ethHodlBooster.connect(bob as Signer).withraw(1, false)).to.be.revertedWith("Exceed available");   
          await expect(ethHodlBooster.connect(bob as Signer).withraw(1, true)).to.be.revertedWith("Exceed available");  

          //for btc, we just redeposit
          //0.5*1.02 = 0.51
          await wbtcHodlBooster.connect(bob as Signer).redeposit(BigNumber.from(51).mul(WBTCMultiplier).div(100)); 
          await expect(wbtcHodlBooster.connect(bob as Signer).redeposit(1)).to.be.revertedWith("Exceed available");  
          
          //2 * 1.02
          await expect(wbtcHodlBooster.connect(alice as Signer).redeposit(BigNumber.from(204).mul(WBTCMultiplier).div(100))).to.be.revertedWith("Not enough quota");   
          //deposit 1
          await wbtcHodlBooster.connect(alice as Signer).redeposit(BigNumber.from(1).mul(WBTCMultiplier)); 

          var traderBtcBalance = await wbtc.balanceOf(trader.address);
          await wbtcHodlBooster.closePrevious(btcPrice*1.2); //72000usdt  
          
          //don't support withdraw during settlement
          await expect(wbtcHodlBooster.connect(bob as Signer).withraw(BigNumber.from(204).mul(WBTCMultiplier).div(100), false)).to.be.revertedWith("Being settled");   

          await wbtcHodlBooster.commitCurrent(trader.address); //strike price 79200usdt
          var traderBtcBalance2 = await wbtc.balanceOf(trader.address);
          //1.51btc was sent to trader
          assert.equal(traderBtcBalance2.sub(traderBtcBalance).toString(), BigNumber.from(151).mul(WBTCMultiplier).div(100).toString());

          const parameters7 = {
            quota: BigNumber.from(3).mul(WBTCMultiplier), //3btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.015 * RationMultipler, //1.5% per week
            callOrPut: true
          };
          await wbtcHodlBooster.rollToNext(parameters7); 

          round = await wbtcHodlBooster.currentRound();
          assert.equal(round.toString(), "10");   


          await expect(wbtcHodlBooster.connect(bob as Signer).withraw(BigNumber.from(1).mul(USDTMultiplier), true)).to.be.revertedWith("Matured Stable Coin not filled");   
          var request3 = await wbtcHodlBooster.getRequest();
          assert.equal(request3.length, 1);
          //2*1.01*69300 
          assert.equal(request3[0].amount.toString(), BigNumber.from(139986).mul(USDTMultiplier).toString());
          assert.equal(request3[0].contractAddress, usdt.address);
          settled = await wbtcHodlBooster.allSettled();
          assert.isFalse(settled); 

          usdt.transfer(trader.address, BigNumber.from(139986).mul(USDTMultiplier));
          //send usdt back
          await usdt.connect(trader as Signer).transfer(request3[0].targetAddress, request3[0].amount); 
          await wbtcHodlBooster.finishSettlement();
          var usdtBalance = await usdt.balanceOf(bob.address);
          await wbtcHodlBooster.connect(bob as Signer).withraw(BigNumber.from(69993).mul(USDTMultiplier), true);
          var usdtBalance2 = await usdt.balanceOf(bob.address);
          assert.equal(usdtBalance2.sub(usdtBalance).toString(), request3[0].amount.div(2).toString());

          await expect(wbtcHodlBooster.connect(alice as Signer).withraw(BigNumber.from(204).mul(WBTCMultiplier).div(100), false)).to.be.revertedWith("Exceed available");   
          await wbtcHodlBooster.connect(alice as Signer).withraw(BigNumber.from(104).mul(WBTCMultiplier).div(100), false);
          await wbtcHodlBooster.connect(alice as Signer).withraw(BigNumber.from(69993).mul(USDTMultiplier), true);
          
        }); 
      });  
   
  });

  
