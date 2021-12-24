import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, Signer } from "ethers";

import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import {advanceBlockTo} from "./utilities/timer"; 
import { PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption, ERC20Mock, OptionVault } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI ,USDT_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, SETTLEMENTPERIOD,OptionExecution, WBTC_ADDRESS } from "../constants/constants";
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
              vault.address,
              settler.address
            ]
          ) as PKKTHodlBoosterCallOption;  
                     
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
              vault.address,
              settler.address
            ]
          ) as PKKTHodlBoosterCallOption;  
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
              vault.address,
              settler.address
            ]
          ) as PKKTHodlBoosterPutOption;  
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
              vault.address,
              settler.address
            ]
          ) as PKKTHodlBoosterPutOption;  

          //ping-pong setup
          ethHodlBoosterCall.setCounterPartyOption(ethHodlBoosterPut.address);
          ethHodlBoosterPut.setCounterPartyOption(ethHodlBoosterCall.address);
          wbtcHodlBoosterCall.setCounterPartyOption(wbtcHodlBoosterPut.address);
          wbtcHodlBoosterPut.setCounterPartyOption(wbtcHodlBoosterCall.address);

          await vault.addOptionPair({
            callOption: ethHodlBoosterCall.address,
            putOption: ethHodlBoosterPut.address,
            callOptionDeposit: NULL_ADDRESS,
            putOptionDeposit: usdt.address
          });

          await vault.addOptionPair({
            callOption: wbtcHodlBoosterCall.address,
            putOption: wbtcHodlBoosterPut.address,
            callOptionDeposit: wbtc.address,
            putOptionDeposit: usdt.address
          }); 


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
       
        it("user perspective", async function () {
            
          await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  

          /* open round 1*/
          await vault.connect(settler as Signer).initiateSettlement(); 

          //5+4 eth
          //2+0.5 btc
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));
 
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(4).mul(ETHMultiplier)});
          //await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
          //await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
          await expect(wbtcHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  
           
          await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(5).mul(WBTCMultiplier).div(10));

          var ethOptionBalance = await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance(); 
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString()); 
          assert.equal(ethOptionBalance.ongoingDepositAssetAmount.toString(), "0"); 
          
          var btcOptionBalance = await wbtcHodlBoosterCall.connect(alice as Signer).getAccountBalance();
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString()); 
          assert.equal(btcOptionBalance.ongoingDepositAssetAmount.toString(), "0"); 

          btcOptionBalance = await wbtcHodlBoosterCall.connect(bob as Signer).getAccountBalance();
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString()); 
          assert.equal(btcOptionBalance.ongoingDepositAssetAmount.toString(), "0");  

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
          ethOptionBalance = await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance(); 
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), "0");
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
          btcOptionBalance = await wbtcHodlBoosterCall.connect(alice as Signer).getAccountBalance();
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          optionState = await wbtcHodlBoosterCall.optionStates(round); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          


          /* open round 2*/
          await vault.connect(settler as Signer).initiateSettlement();
          //new round , alice deposit 5eth
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          //bob deposit 1 btc
          await wbtcHodlBoosterCall.connect(bob as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
          //bob stop previous auto rolling
          await wbtcHodlBoosterCall.connect(alice as Signer).maxInitiateWithdraw();


          const ethPrice = 4000 * (10**ETHPricePrecision);
          const btcPrice = 50000 * (10**WBTCPicePrecision);
 
          await vault.connect(settler as Signer).settle([]);

          await vault.connect(settler as Signer).commitCurrent([
          {
            strikePrice:ethPrice,
            pricePrecision:ETHPricePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: ethHodlBoosterCall.address
          }, 
          //fake
          {
            strikePrice:ethPrice,
            pricePrecision:ETHPricePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: ethHodlBoosterPut.address
          },
          {
            strikePrice:btcPrice,
            pricePrecision:WBTCPicePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: wbtcHodlBoosterCall.address
          },
          //fake
          {
            strikePrice:btcPrice,
            pricePrecision:WBTCPicePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: wbtcHodlBoosterPut.address
          },
          ]);
          
          //have 0.5wbtc going on
          var wbtcResult = await vault.connect(settler as Signer).settlementCashflowResult(wbtc.address);
          assert.equal(wbtcResult.newReleasedAmount.toString(), "0");
          assert.equal(wbtcResult.newDepositAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          assert.equal(wbtcResult.leftOverAmount.toString(), "0");
          var ethResult = await vault.connect(settler as Signer).settlementCashflowResult(NULL_ADDRESS);
          assert.equal(ethResult.leftOverAmount.toString(), "0");
          assert.equal(ethResult.newDepositAmount.toString(), "0");
          assert.equal(ethResult.newReleasedAmount.toString(), "0");
          var usdtResult = await vault.connect(settler as Signer).settlementCashflowResult(usdt.address);
          assert.equal(usdtResult.leftOverAmount.toString(), "0");

          
          /* open round 3*/
          await vault.connect(settler as Signer).initiateSettlement(); 
          await vault.connect(settler as Signer).settle([{
            callOption: ethHodlBoosterCall.address,
            putOption: ethHodlBoosterPut.address,
            execute: OptionExecution.NoExecution
          }, 
          {
            callOption: wbtcHodlBoosterCall.address,
            putOption: wbtcHodlBoosterPut.address,
            execute: OptionExecution.NoExecution
          }]);
          await vault.connect(settler as Signer).commitCurrent([
            {
              strikePrice:ethPrice,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: ethHodlBoosterCall.address
            }, 
            //fake
            {
              strikePrice:ethPrice,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: ethHodlBoosterPut.address
            },
            {
              strikePrice:btcPrice,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: wbtcHodlBoosterCall.address
            },
            //fake
            {
              strikePrice:btcPrice,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: wbtcHodlBoosterPut.address
            },
            ]); 
            //0.5 not moved last time + 1 newly deposit - 0.5 released - 2.5%*0.5 released premium
            wbtcResult = await vault.connect(settler as Signer).settlementCashflowResult(wbtc.address);
            assert.equal(wbtcResult.leftOverAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            assert.equal(wbtcResult.newDepositAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            assert.equal(wbtcResult.newReleasedAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            btcBalance = await wbtc.connect(trader as Signer).balanceOf(trader.address);
            await vault.connect(settler as Signer).withdrawAsset(trader.address, wbtc.address);
            btcBalance2 = await wbtc.connect(trader as Signer).balanceOf(trader.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(9875).mul(WBTCMultiplier).div(10000).toString());

            await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
            var available = await wbtcHodlBoosterCall.connect(alice as Signer).getAccountBalance();
            assert.equal(available.pendingDepositAssetAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            //0.5 * 1.025
            assert.equal(available.releasedDepositAssetAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
            btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            await wbtcHodlBoosterCall.connect(alice as Signer).withdraw(BigNumber.from(15125).mul(WBTCMultiplier).div(10000), wbtc.address);
            btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15125).mul(WBTCMultiplier).div(10000).toString());

            //bob want to stop the whole auto roll
            await wbtcHodlBoosterCall.connect(bob as Signer).initiateWithraw(BigNumber.from(1).mul(WBTCMultiplier));
            //later on he changes his mind to allow part of it 
            await wbtcHodlBoosterCall.connect(bob as Signer).cancelWithdraw(BigNumber.from(5).mul(WBTCMultiplier).div(10)); 
             //alice want to stop part of  the auto roll (3 auto roll + 2 release)
            await ethHodlBoosterCall.connect(alice as Signer).initiateWithraw(BigNumber.from(2).mul(ETHMultiplier));
          


            /* open round 4*/
            await vault.connect(settler as Signer).initiateSettlement(); 
            await vault.connect(settler as Signer).settle([{
              callOption: ethHodlBoosterCall.address,
              putOption: ethHodlBoosterPut.address,
              execute: OptionExecution.ExecuteCall
            }, 
            {
              callOption: wbtcHodlBoosterCall.address,
              putOption: wbtcHodlBoosterPut.address,
              execute: OptionExecution.NoExecution
            }]);
            await vault.connect(settler as Signer).commitCurrent([
              {
                strikePrice:ethPrice,
                pricePrecision:ETHPricePrecision,
                premiumRate: 0.02 * RatioMultipler,
                option: ethHodlBoosterCall.address
              }, 
              //fake
              {
                strikePrice:ethPrice,
                pricePrecision:ETHPricePrecision,
                premiumRate: 0.02 * RatioMultipler,
                option: ethHodlBoosterPut.address
              },
              {
                strikePrice:btcPrice,
                pricePrecision:WBTCPicePrecision,
                premiumRate: 0.02 * RatioMultipler,
                option: wbtcHodlBoosterCall.address
              },
              //fake
              {
                strikePrice:btcPrice,
                pricePrecision:WBTCPicePrecision,
                premiumRate: 0.02 * RatioMultipler,
                option: wbtcHodlBoosterPut.address
              },
              ]); 
   
   
              //alice got the 2*4000*1.02 executed usdc
              available = await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance();
              var s = await ethHodlBoosterCall.connect(alice as Signer).getOptionSnapShot();
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), "8160000000");
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");  
              //bob got 0.5*1.02 none executed btc
              var available2 = await wbtcHodlBoosterCall.connect(bob as Signer).getAccountBalance();
              assert.equal(available2.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available2.releasedDepositAssetAmount.toString(), "51000000");  
              
              var usdtInstruction = await vault.settlementCashflowResult(usdt.address);
              var diff = usdtInstruction.leftOverAmount.add(usdtInstruction.newDepositAmount).sub(usdtInstruction.newReleasedAmount);
              console.log("usdtInstruction:", diff.toString());
              if (diff.lt(0)){
                  await usdt.connect(trader as Signer).transfer(vault.address, -diff);
              }
              var usdtBalance = await usdt.connect(alice as Signer).balanceOf(alice.address);
              await ethHodlBoosterCall.connect(alice as Signer).withdraw(available.releasedCounterPartyAssetAmount, usdt.address);
              var usdtBalance2 = await usdt.connect(alice as Signer).balanceOf(alice.address);
              assert.equal(usdtBalance2.sub(usdtBalance).toString(), available.releasedCounterPartyAssetAmount.toString());

              available = await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance();
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");  

        });

        it("trader perspective", async function () {
        });

        it("physical balance perspective", async function () {
        });
      }); 
   
  });

  
