import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption, ERC20Mock, OptionVault } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI ,USDT_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, SETTLEMENTPERIOD,Direction, WBTC_ADDRESS } from "../constants/constants";
import { AssertionError } from "assert/strict";
 
  
const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);
   
const USDTMultiplier = BigNumber.from(10).pow(USDT_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const ETHPricePrecision = 4;
const WBTCPicePrecision = 4; 
const RatioMultipler = 10000; //precision xx.xx%

describe("PKKT Hodl Booster", async function () {
    let ethHodlBoosterCall: PKKTHodlBoosterCallOption;
    let wbtcHodlBoosterCall: PKKTHodlBoosterCallOption;
    let ethHodlBoosterPut: PKKTHodlBoosterPutOption;
    let wbtcHodlBoosterPut: PKKTHodlBoosterPutOption;
    let deployer: SignerWithAddress; 
    let settler: SignerWithAddress;
    let alice: SignerWithAddress; 
    let bob: SignerWithAddress; 
    let carol: SignerWithAddress;
    let trader: SignerWithAddress; 
    let usdt: ERC20Mock;
    let wbtc: ERC20Mock; 
    let vault: OptionVault;
    before(async function () {
      [deployer, settler, alice, bob, carol, trader] = await ethers.getSigners(); 
        
    });

    context("User operations", function () {
        beforeEach(async function () {
        
          this.owner = deployer as Signer;  
          vault = await deployContract(
            "OptionVault",
            deployer as Signer,
            [settler.address]
          ) as OptionVault;
          usdt = await  deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "USDTToken",
              "USDT",
              BigNumber.from(10000000).mul(USDTMultiplier),
              USDT_DECIMALS
            ]
          ) as ERC20Mock;
          wbtc = await  deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "Wrapped BTC",
              "WBTC",
              BigNumber.from(100).mul(WBTCMultiplier),
              WBTC_DECIMALS
            ]
          ) as ERC20Mock;
           
          ethHodlBoosterCall = await deployUpgradeableContract(
            "PKKTHodlBoosterCallOption",
            deployer as Signer,
            [
              "ETH-USDT-HodlBooster-Call",
              "ETHUSDTHodlBoosterCall",
              NULL_ADDRESS,
              usdt.address,
              ETH_DECIMALS,
              USDT_DECIMALS,
              vault.address
            ]
          ) as PKKTHodlBoosterCallOption; 
          vault.addOption(ethHodlBoosterCall.address);
                     
          wbtcHodlBoosterCall = await deployUpgradeableContract(
            "PKKTHodlBoosterCallOption",
            deployer as Signer,
            [
              "WBTC-USDT-HodlBooster-Call",
              "WBTCUSDTHodlBoosterCall",
              wbtc.address,
              usdt.address,
              WBTC_DECIMALS,
              USDT_DECIMALS,
              vault.address
            ]
          ) as PKKTHodlBoosterCallOption; 
          vault.addOption(wbtcHodlBoosterCall.address);
          ethHodlBoosterPut = await deployUpgradeableContract(
            "PKKTHodlBoosterPutOption",
            deployer as Signer,
            [
              "ETH-USDT-HodlBooster-Put",
              "ETHUSDTHodlBoosterPut",
              NULL_ADDRESS,
              usdt.address,
              ETH_DECIMALS,
              USDT_DECIMALS,
              vault.address
            ]
          ) as PKKTHodlBoosterPutOption; 
          vault.addOption(ethHodlBoosterPut.address); 
                     
          wbtcHodlBoosterPut = await deployUpgradeableContract(
            "PKKTHodlBoosterPutOption",
            deployer as Signer,
            [
              "WBTC-USDT-HodlBooster-Put",
              "WBTCUSDTHodlBoosterPut",
              wbtc.address,
              usdt.address,
              WBTC_DECIMALS,
              USDT_DECIMALS,
              vault.address
            ]
          ) as PKKTHodlBoosterPutOption; 
          vault.addOption(wbtcHodlBoosterPut.address);

          //ping-pong setup
          ethHodlBoosterCall.setCounterPartyOption(ethHodlBoosterPut.address);
          ethHodlBoosterPut.setCounterPartyOption(ethHodlBoosterCall.address);
          wbtcHodlBoosterCall.setCounterPartyOption(wbtcHodlBoosterPut.address);
          wbtcHodlBoosterPut.setCounterPartyOption(wbtcHodlBoosterCall.address);

          ethHodlBoosterCall.transferOwnership(settler.address);
          wbtcHodlBoosterCall.transferOwnership(settler.address); 
          ethHodlBoosterPut.transferOwnership(settler.address);
          wbtcHodlBoosterPut.transferOwnership(settler.address);


          await usdt.transfer(alice.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(bob.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(carol.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(trader.address,  BigNumber.from(1000000).mul(USDTMultiplier));

          await wbtc.transfer(alice.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address,  BigNumber.from(10).mul(WBTCMultiplier));  
          await wbtc.connect(alice as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier));   
          await wbtc.connect(bob as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          await wbtc.connect(carol as Signer).approve(wbtcHodlBoosterCall.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          
          await usdt.connect(alice as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier));   
          await usdt.connect(bob as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier)); 
          await usdt.connect(carol as Signer).approve(ethHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier)); 
          await usdt.connect(alice as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier));   
          await usdt.connect(bob as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier)); 
          await usdt.connect(carol as Signer).approve(wbtcHodlBoosterPut.address, BigNumber.from(1000000).mul(USDTMultiplier)); 

        });
        
        afterEach(async function () {
 
        });
       
        it("should allow deposit and redeem when started", async function () {
           
          const ethQuota = BigNumber.from(10).mul(ETHMultiplier);
          const wbtcQuota = BigNumber.from(25).mul(WBTCMultiplier).div(10);
          await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  
          await ethHodlBoosterCall.connect(settler as Signer).rollToNext(ethQuota);
          await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(wbtcQuota);

          //5+4 eth
          //2+0.5 btc
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
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), "0");
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");

          round = await wbtcHodlBoosterCall.currentRound();
          optionState = await wbtcHodlBoosterCall.optionStates(round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
          assert.equal(optionState.round.toString(), "1");
          assert.equal(optionState.pricePrecision.toString(), "0");
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");   
          var ethBalance = await ethers.provider.getBalance(alice.address); 
          //redeem all eth
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
          
          await vault.connect(settler as Signer).prepareSettlement();
          const ethPrice = 4000 * (10**ETHPricePrecision);
          const btcPrice = 50000 * (10**WBTCPicePrecision);
          //have 0.5wbtc going on
          await ethHodlBoosterCall.connect(settler as Signer).commitCurrent(
            { 
              strikePrice:ethPrice,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.025 * RatioMultipler, //2.5% per week
            });
 
          await wbtcHodlBoosterCall.connect(settler as Signer).commitCurrent(
            { 
              strikePrice:btcPrice,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.025 * RatioMultipler, //2.5% per week
            });

          await vault.connect(settler as Signer).startSettlement(trader.address);
          await vault.connect(settler as Signer).finishSettlement();
          await ethHodlBoosterCall.connect(settler as Signer).rollToNext(ethQuota);
          await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(wbtcQuota);

          //new round , alice deposit 5eth
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          //bob deposit 1 btc
          await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
          //bob stop previous auto rolling
          await wbtcHodlBoosterCall.connect(alice as Signer).maxInitiateWithdraw();
          
          
          await vault.connect(settler as Signer).prepareSettlement();
          await ethHodlBoosterCall.connect(settler as Signer).closePrevious(false); 
          await ethHodlBoosterCall.connect(settler as Signer).commitCurrent(
            { 
              strikePrice:ethPrice,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.02 * RatioMultipler, //2% per week
            }); 
          await wbtcHodlBoosterCall.connect(settler as Signer).closePrevious(false);          
          await wbtcHodlBoosterCall.connect(settler as Signer).commitCurrent(
            { 
              strikePrice:btcPrice,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.02 * RatioMultipler, //2% per week
            });
 

            await vault.connect(settler as Signer).startSettlement(trader.address);
            await vault.connect(settler as Signer).finishSettlement();

            await ethHodlBoosterCall.connect(settler as Signer).rollToNext(ethQuota);
            await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(wbtcQuota);

            await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
            var available = await wbtcHodlBoosterCall.connect(alice as Signer).getAvailable();
            assert.equal(available.pendingDepositAssetAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            //0.5 * 1.025
            assert.equal(available.maturedDepositAssetAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            assert.equal(available.maturedCounterPartyAssetAmount.toString(), "0");
            btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            await wbtcHodlBoosterCall.connect(alice as Signer).withdraw(BigNumber.from(15125).mul(WBTCMultiplier).div(10000), wbtc.address);
            btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15125).mul(WBTCMultiplier).div(10000).toString());

            //bob want to stop the whole auto roll
            await wbtcHodlBoosterCall.connect(bob as Signer).initiateWithraw(BigNumber.from(1).mul(WBTCMultiplier));
            //later on he changes his mind to allow part of it 
            await wbtcHodlBoosterCall.connect(bob as Signer).cancelWithdraw(BigNumber.from(5).mul(WBTCMultiplier).div(10)); 
             //alice want to stop part of  the auto roll 
            await ethHodlBoosterCall.connect(alice as Signer).initiateWithraw(BigNumber.from(2).mul(ETHMultiplier));
          


            await vault.connect(settler as Signer).prepareSettlement();
            await ethHodlBoosterCall.connect(settler as Signer).closePrevious(true); 
            await ethHodlBoosterCall.connect(settler as Signer).commitCurrent(
              { 
                strikePrice:ethPrice,
                pricePrecision:ETHPricePrecision,
                premiumRate: 0.02 * RatioMultipler, //2% per week
              }); 
            await wbtcHodlBoosterCall.connect(settler as Signer).closePrevious(false);          
            await wbtcHodlBoosterCall.connect(settler as Signer).commitCurrent(
              { 
                strikePrice:btcPrice,
                pricePrecision:WBTCPicePrecision,
                premiumRate: 0.02 * RatioMultipler, //2% per week
              });
  
            
              await vault.connect(settler as Signer).startSettlement(trader.address);
              //await vault.connect(settler as Signer).finishSettlement();
  
              await ethHodlBoosterCall.connect(settler as Signer).rollToNext(ethQuota);
              await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(wbtcQuota);
              //alice got the 2*4000*1.02 executed usdc
              available = await ethHodlBoosterCall.connect(alice as Signer).getAvailable();
              assert.equal(available.maturedCounterPartyAssetAmount.toString(), "8160000000");
              assert.equal(available.maturedDepositAssetAmount.toString(), "0");  
              //bob got 0.5*1.02 none executed btc
              var available2 = await wbtcHodlBoosterCall.connect(bob as Signer).getAvailable();
              assert.equal(available2.maturedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available2.maturedDepositAssetAmount.toString(), "51000000");  
              
              var usdtInstruction = await vault.settlementInstruction(usdt.address);
              if (!usdtInstruction.fullfilled){
                  await usdt.connect(trader as Signer).transfer(usdtInstruction.targetAddress, usdtInstruction.amount);
              }
              var usdtBalance = await usdt.connect(alice as Signer).balanceOf(alice.address);
              await ethHodlBoosterCall.connect(alice as Signer).withdraw(available.maturedCounterPartyAssetAmount, usdt.address);
              var usdtBalance2 = await usdt.connect(alice as Signer).balanceOf(alice.address);
              assert.equal(usdtBalance2.sub(usdtBalance).toString(), available.maturedCounterPartyAssetAmount.toString());

              available = await ethHodlBoosterCall.connect(alice as Signer).getAvailable();
              assert.equal(available.maturedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available.maturedDepositAssetAmount.toString(), "0");  

        });

      }); 
   
  });

  
