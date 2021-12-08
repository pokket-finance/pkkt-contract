import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption, ERC20Mock, OptionVault } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI ,USDT_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, SETTLEMENTPERIOD } from "../constants/constants";
 
  
const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);
   
const USDTMultiplier = BigNumber.from(10).pow(USDT_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const ETHPricePrecision = 4;
const WBTCPicePrecision = 4;
const RationMultipler = 10000;

describe("PKKT Hodl Booster", async function () {
    let ethHodlBoosterCall: PKKTHodlBoosterCallOption;
    let wbtcHodlBoosterCall: PKKTHodlBoosterCallOption;
    let ethHodlBoosterPut: PKKTHodlBoosterPutOption;
    let wbtcHodlBoosterPut: PKKTHodlBoosterPutOption;
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
          usdt = await  deployContract("ERC20Mock", deployer as Signer, ["USDTToken", "USDT", BigNumber.from(10000000).mul(USDTMultiplier), USDT_DECIMALS]) as ERC20Mock;
          wbtc = await  deployContract("ERC20Mock", deployer as Signer, ["Wrapped BTC", "WBTC", BigNumber.from(100).mul(WBTCMultiplier), WBTC_DECIMALS]) as ERC20Mock;
           
          ethHodlBoosterCall = await deployContract("PKKTHodlBoosterCallOption", deployer as Signer, 
          ["ETH-USDT-HodlBooster-Call", "ETHUSDTHodlBoosterCall", NULL_ADDRESS, usdt.address, ETH_DECIMALS, USDT_DECIMALS, vault.address]) as PKKTHodlBoosterCallOption; 
          vault.addOption(ethHodlBoosterCall.address);
                     
          wbtcHodlBoosterCall = await deployContract("PKKTHodlBoosterCallOption", deployer as Signer, 
          ["WBTC-USDT-HodlBooster-Call", "WBTCUSDTHodlBoosterCall", wbtc.address, usdt.address, WBTC_DECIMALS, USDT_DECIMALS, vault.address]) as PKKTHodlBoosterCallOption; 
          vault.addOption(wbtcHodlBoosterCall.address);

          ethHodlBoosterPut = await deployContract("PKKTHodlBoosterPutOption", deployer as Signer, 
          ["ETH-USDT-HodlBooster-Put", "ETHUSDTHodlBoosterPut", NULL_ADDRESS, usdt.address, ETH_DECIMALS, USDT_DECIMALS, vault.address]) as PKKTHodlBoosterPutOption; 
          vault.addOption(ethHodlBoosterPut.address);
                     
          wbtcHodlBoosterPut = await deployContract("PKKTHodlBoosterPutOption", deployer as Signer, 
          ["WBTC-USDT-HodlBooster-Put", "WBTCUSDTHodlBoosterPut", wbtc.address, usdt.address, WBTC_DECIMALS, USDT_DECIMALS, vault.address]) as PKKTHodlBoosterPutOption; 
          vault.addOption(ethHodlBoosterPut.address);


          await usdt.transfer(alice.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(bob.address,  BigNumber.from(100).mul(USDTMultiplier));
          await usdt.transfer(carol.address,  BigNumber.from(100).mul(USDTMultiplier));

          await wbtc.transfer(alice.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address,  BigNumber.from(10).mul(WBTCMultiplier));  
          await wbtc.connect(alice as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier));   
          await wbtc.connect(bob as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          await wbtc.connect(carol as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          
          await usdt.connect(alice as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier));   
          await usdt.connect(bob as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier)); 
          await usdt.connect(carol as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier)); 
          await usdt.connect(alice as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier));   
          await usdt.connect(bob as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier)); 
          await usdt.connect(carol as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(100000).mul(USDTMultiplier)); 

        });
        
        afterEach(async function () {
 
        });
       
        it("should allow deposit and redeem when started", async function () {
           
          await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  
          const ethPrice = 4000 * (10**ETHPricePrecision);
          await ethHodlBoosterCall.closePrevious(ethPrice); //4000usdt
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
            callOrPut: true
          };
          await ethHodlBoosterCall.rollToNext(parameters1);
          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
          };
          await wbtcHodlBoosterCall.closePrevious(btcPrice); //60000usdt
          await wbtcHodlBoosterCall.rollToNext( parameters2);

          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));
 
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});
          await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  
           
          await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          var pendingEth = await ethHodlBoosterCall.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingEth.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          var ongoingEth = await ethHodlBoosterCall.connect(alice as Signer).getOngoingAsset(0); 
          assert.equal(ongoingEth.toString(), "0"); 
          
          var pendingBTC = await wbtcHodlBoosterCall.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var ongoingBTC = await wbtcHodlBoosterCall.connect(alice as Signer).getOngoingAsset(0); 
          assert.equal(ongoingBTC.toString(), "0"); 
          pendingBTC = await wbtcHodlBoosterCall.connect(bob as Signer).getPendingAsset();
          assert.equal(pendingBTC.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          ongoingBTC = await wbtcHodlBoosterCall.connect(bob as Signer).getOngoingAsset(0); 
          assert.equal(ongoingBTC.toString(), "0"); 

          var round = await ethHodlBoosterCall.currentRound();
          var optionState = await ethHodlBoosterCall.optionStates(round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.underlyingPrice.toString(), "0");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), parameters1.pricePrecision.toString());
          assert.equal(optionState.interestRate.toString(), parameters1.interestRate.toString());
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");

          round = await wbtcHodlBoosterCall.currentRound();
          optionState = await wbtcHodlBoosterCall.optionStates(round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.underlyingPrice.toString(), "0");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), parameters2.pricePrecision.toString());
          assert.equal(optionState.interestRate.toString(), parameters2.interestRate.toString());
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");   
          var ethBalance = await ethers.provider.getBalance(alice.address); 
          await ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(8).mul(ETHMultiplier));
          await ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier));

          await expect(ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.revertedWith("Exceeds available");  
          var ethBalance2 = await ethers.provider.getBalance(alice.address); 
          var diff = ethBalance2.div(ETHMultiplier).sub(ethBalance.div(ETHMultiplier));
          assert.equal(diff.toString(), BigNumber.from(9).toString());
          pendingEth = await ethHodlBoosterCall.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingEth.toString(), "0");
          var optionState = await ethHodlBoosterCall.optionStates(round); 
          assert.equal(optionState.totalAmount.toString(), "0");
          var btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
          await wbtcHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(15).mul(WBTCMultiplier).div(10));
          var btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address); 
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15).mul(WBTCMultiplier).div(10).toString());
          var btcBalance = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          await wbtcHodlBoosterCall.connect(bob as Signer).redeem(BigNumber.from(5).mul(WBTCMultiplier).div(10));
          btcBalance2 = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          var pendingBtc = await wbtcHodlBoosterCall.connect(alice as Signer).getPendingAsset();
          assert.equal(pendingBtc.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          optionState = await wbtcHodlBoosterCall.optionStates(round); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
        });
        it("should allow call option settlement", async function () {
          const ethPrice = 4000 * (10**ETHPricePrecision);
          const parameters1 = {
            quota: BigNumber.from(10).mul(ETHMultiplier), //10eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.025 * RationMultipler, //2.5% per week
            callOrPut: true
          }; 
          await ethHodlBoosterCall.rollToNext(parameters1);  

          const btcPrice = 60000 * (10**WBTCPicePrecision);
          const parameters2 = {
            quota: BigNumber.from(25).mul(WBTCMultiplier).div(10), //2.5btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
          }; 
          await wbtcHodlBoosterCall.rollToNext(parameters2); 
          
          //eth round 1: 10 eth
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});  
          await ethHodlBoosterCall.connect(bob as Signer).depositETH({ value: BigNumber.from(6).mul(ETHMultiplier)}); 

          //wbtc round 1: 2.5 btc
          await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));  
          await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          
          
          var settled = await ethHodlBoosterCall.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBoosterCall.allSettled();
          assert.isTrue(settled);

          await ethHodlBoosterCall.closePrevious(ethPrice); //4000usdt  
           //eth round 1:strike price 4400usdt
          await ethHodlBoosterCall.commitCurrent(trader.address);  
          const parameters3 = {
            quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.02 * RationMultipler, //2% per week
            callOrPut: true
          };
          await ethHodlBoosterCall.rollToNext(parameters3);  
          
          await wbtcHodlBoosterCall.closePrevious(btcPrice); //60000usdt   
           //wbtc round 1:strike price 66000usdt
          await wbtcHodlBoosterCall.commitCurrent(trader.address);  
          const parameters4 = {
            quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
            pricePrecision: WBTCPicePrecision,
            strikePriceRatio: 0.1 * RationMultipler, //10% up
            interestRate: 0.01 * RationMultipler, //1% per week
            callOrPut: true
          };
          await wbtcHodlBoosterCall.rollToNext(parameters4);
          settled = await ethHodlBoosterCall.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBoosterCall.allSettled();
          assert.isTrue(settled);

          //from round 2 to SETTLEMENTPERIOD
          for(var i = 0; i < SETTLEMENTPERIOD; i++){
            //eth round 2+i: 2 eth
            await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)});  
            await ethHodlBoosterCall.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)}); 
            
            //wbtc round 2+i: 2 btc
            await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));  
            await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
            
            await ethHodlBoosterCall.closePrevious(ethPrice*1.01); //4040usdt  
            //eth round 2+i: strike price 4444usdt
            await ethHodlBoosterCall.commitCurrent(trader.address); //strike price 4444usdt
            const parameters5 = {
              quota: BigNumber.from(5).mul(ETHMultiplier), //5eth
              pricePrecision: ETHPricePrecision,
              strikePriceRatio: 0.1 * RationMultipler, //10% up
              interestRate: 0.01 * RationMultipler, //1% per week
              callOrPut: true
            };
            await ethHodlBoosterCall.rollToNext(parameters5);

            await wbtcHodlBoosterCall.closePrevious(btcPrice*1.05); //63000usdt  
            //wbtc round 2+i: strike price 69300usdt
            await wbtcHodlBoosterCall.commitCurrent(trader.address); 
            const parameters6 = {
              quota: BigNumber.from(2).mul(WBTCMultiplier), //2btc
              pricePrecision: WBTCPicePrecision,
              strikePriceRatio: 0.1 * RationMultipler, //10% up
              interestRate: 0.005 * RationMultipler, //0.5% per week
              callOrPut: true
            };
            await wbtcHodlBoosterCall.rollToNext(parameters6); 
          }

          //we have something matured
          settled = await ethHodlBoosterCall.allSettled();
          assert.isFalse(settled); 
          settled = await wbtcHodlBoosterCall.allSettled();
          assert.isFalse(settled);
          var round = await ethHodlBoosterCall.currentRound();
          assert.equal(round.toString(), (2+SETTLEMENTPERIOD).toString());   
          var request = await ethHodlBoosterCall.getRequest();
          assert.equal(request.length, 1);

          //10*1.025-2
          assert.equal(request[0].amount.toString(), BigNumber.from(825).mul(ETHMultiplier).div(100).toString());
          assert.equal(request[0].contractAddress, NULL_ADDRESS);

          round = await wbtcHodlBoosterCall.currentRound();
          assert.equal(round.toString(), (2+SETTLEMENTPERIOD).toString());   
          var request2 = await wbtcHodlBoosterCall.getRequest();
          assert.equal(request2.length, 1);
          //2.5*1.02-2
          assert.equal(request2[0].amount.toString(), BigNumber.from(55).mul(WBTCMultiplier).div(100).toString());
          assert.equal(request2[0].contractAddress, wbtc.address);

          
          await expect(ethHodlBoosterCall.finishSettlement()).to.be.revertedWith("Matured Amount not filled");  
          //send eth back
          await trader.sendTransaction({to:request[0].targetAddress, value:request[0].amount});
          await ethHodlBoosterCall.finishSettlement();
          
          await expect(wbtcHodlBoosterCall.finishSettlement()).to.be.revertedWith("Matured Amount not filled");   
          //send wbtc back
          await wbtc.connect(trader as Signer).transfer(request2[0].targetAddress, request2[0].amount); 
          await wbtcHodlBoosterCall.finishSettlement();

          settled = await ethHodlBoosterCall.allSettled();
          assert.isTrue(settled); 
          settled = await wbtcHodlBoosterCall.allSettled();
          assert.isTrue(settled); 
 
          var ethBalance = await ethers.provider.getBalance(await ethHodlBoosterCall.vaultAddress()); 
          var btcBalance = await wbtc.balanceOf(await wbtcHodlBoosterCall.vaultAddress()); 
          assert.equal(ethBalance.toString(), BigNumber.from(1025).mul(ETHMultiplier).div(100).toString());
          assert.equal(btcBalance.toString(), BigNumber.from(255).mul(WBTCMultiplier).div(100).toString());

          //4*1.025 
          var aliceMaturedEth = await ethHodlBoosterCall.maturedDepositAssetAmount(alice.address);
          var aliceMaturedUST = await ethHodlBoosterCall.maturedCounterPartyAssetAmount(alice.address); 
          assert.equal(aliceMaturedEth.toString(), BigNumber.from(41).mul(ETHMultiplier).div(10).toString()); 
          assert.equal(aliceMaturedUST.toString(), "0");
          
          var ethBalance = await ethers.provider.getBalance(alice.address);   
          var tx = await ethHodlBoosterCall.connect(alice as Signer).withraw(BigNumber.from(4).mul(ETHMultiplier)); 
          var gasUsed = (await tx.wait()).gasUsed.mul(GWEI); 
          tx = await ethHodlBoosterCall.connect(alice as Signer).withraw(BigNumber.from(1).mul(ETHMultiplier).div(10)); 
          var gasUsed2 = (await tx.wait()).gasUsed.mul(GWEI);  
          var gasUsed = gasUsed.add(gasUsed2);
          var ethBalance2 = await ethers.provider.getBalance(alice.address);  
          var diff = ethBalance2.sub(ethBalance).add(gasUsed).sub(BigNumber.from(41).mul(ETHMultiplier).div(10)).abs(); 
          //diff is less than 1gwei (due to the precision lose of gasUsed returned as gwei)
          assert.isTrue(diff.lte(GWEI));
          await expect(ethHodlBoosterCall.connect(alice as Signer).withraw(1)).to.be.revertedWith("Exceed available");  
          await expect(ethHodlBoosterCall.connect(alice as Signer).withraw(1)).to.be.revertedWith("Exceed available");     

          //6*1.025  
          ethBalance = await ethers.provider.getBalance(bob.address); 
          var bobMaturedEth = await ethHodlBoosterCall.maturedDepositAssetAmount(bob.address);
          var bobeMaturedUST = await ethHodlBoosterCall.maturedCounterPartyAssetAmount(bob.address); 
          assert.equal(bobMaturedEth.toString(), BigNumber.from(615).mul(ETHMultiplier).div(100).toString()); 
          assert.equal(bobeMaturedUST.toString(), "0");
          
          tx = await ethHodlBoosterCall.connect(bob as Signer).withraw(BigNumber.from(615).mul(ETHMultiplier).div(100)); 
          var gasUsed3 = (await tx.wait()).gasUsed.mul(GWEI);  
          ethBalance2 = await ethers.provider.getBalance(bob.address);  
          diff = ethBalance2.sub(ethBalance).add(gasUsed3).sub(BigNumber.from(615).mul(ETHMultiplier).div(100)).abs(); 
          //diff is less than 1gwei (due to the precision lose of gasUsed returned as gwei)
          assert.isTrue(diff.lte(GWEI)); 
          await expect(ethHodlBoosterCall.connect(bob as Signer).withraw(1)).to.be.revertedWith("Exceed available");   
          //await expect(ethHodlBoosterCall.connect(bob as Signer).withraw(1, true)).to.be.revertedWith("Exceed available");  

          //for btc, we just redeposit
          //0.5*1.02 = 0.51
          await wbtcHodlBoosterCall.connect(bob as Signer).redeposit(BigNumber.from(51).mul(WBTCMultiplier).div(100)); 
          await expect(wbtcHodlBoosterCall.connect(bob as Signer).redeposit(1)).to.be.revertedWith("Exceed available");  
          
          //2 * 1.02
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).redeposit(BigNumber.from(204).mul(WBTCMultiplier).div(100))).to.be.revertedWith("Not enough quota");   
          //deposit 1
          await wbtcHodlBoosterCall.connect(alice as Signer).redeposit(BigNumber.from(1).mul(WBTCMultiplier)); 

          var traderBtcBalance = await wbtc.balanceOf(trader.address);
          await wbtcHodlBoosterCall.closePrevious(btcPrice*1.2); //72000usdt  
          
          //don't support withdraw during settlement
          await expect(wbtcHodlBoosterCall.connect(bob as Signer).withraw(BigNumber.from(204).mul(WBTCMultiplier).div(100))).to.be.revertedWith("Being settled");   

          await wbtcHodlBoosterCall.commitCurrent(trader.address); //strike price 79200usdt
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
          await wbtcHodlBoosterCall.rollToNext(parameters7); 

          round = await wbtcHodlBoosterCall.currentRound();
          assert.equal(round.toString(), (3+SETTLEMENTPERIOD).toString());   


          //await expect(wbtcHodlBoosterCall.connect(bob as Signer).withraw(BigNumber.from(1).mul(USDTMultiplier), true)).to.be.revertedWith("Matured Stable Coin not filled");   
          var request3 = await wbtcHodlBoosterCall.getRequest();
          assert.equal(request3.length, 1);
          //2*1.01*69300 
          assert.equal(request3[0].amount.toString(), BigNumber.from(139986).mul(USDTMultiplier).toString());
          assert.equal(request3[0].contractAddress, usdt.address);
          settled = await wbtcHodlBoosterCall.allSettled();
          assert.isFalse(settled); 

          usdt.transfer(trader.address, BigNumber.from(139986).mul(USDTMultiplier));
          //send usdt back
          await usdt.connect(trader as Signer).transfer(request3[0].targetAddress, request3[0].amount); 
          await wbtcHodlBoosterCall.finishSettlement();
          /*var usdtBalance = await usdt.balanceOf(bob.address);
          await wbtcHodlBoosterCall.connect(bob as Signer).withraw(BigNumber.from(69993).mul(USDTMultiplier), true);
          var usdtBalance2 = await usdt.balanceOf(bob.address);
          assert.equal(usdtBalance2.sub(usdtBalance).toString(), request3[0].amount.div(2).toString());*/

          await expect(wbtcHodlBoosterCall.connect(alice as Signer).withraw(BigNumber.from(204).mul(WBTCMultiplier).div(100))).to.be.revertedWith("Exceed available");   
          await wbtcHodlBoosterCall.connect(alice as Signer).withraw(BigNumber.from(104).mul(WBTCMultiplier).div(100));
          //await wbtcHodlBoosterCall.connect(alice as Signer).withraw(BigNumber.from(69993).mul(USDTMultiplier), true);
          
        }); 
      });  
   
  });

  
