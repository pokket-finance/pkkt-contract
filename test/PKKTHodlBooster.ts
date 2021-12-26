import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, BigNumberish, Signer } from "ethers";

import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import {advanceBlockTo} from "./utilities/timer"; 
import {OptionPair} from "./utilities/optionPair";
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
 
describe.only("PKKT Hodl Booster", async function () {
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
    let optionPairs: Map<string, OptionPair>
    
    before(async function () {
      [deployer, settler, alice, bob, carol, trader] = await ethers.getSigners(); 
        
    });

    context("operations", function () {
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

          optionPairs = new Map<string, OptionPair>();
          var pair = {
            callOption: ethHodlBoosterCall,
            putOption: ethHodlBoosterPut,
            callOptionAssetName: "ETH",
            putOptionAssetName: "USDT",
            callOptionAssetDecimals: ETH_DECIMALS,
            putOptionAssetDecimals: USDT_DECIMALS,
            strikePriceDecimals: 4
          };
          optionPairs.set(pair.callOption.address.concat(pair.putOption.address), pair);

          await vault.addOptionPair({
            callOption: wbtcHodlBoosterCall.address,
            putOption: wbtcHodlBoosterPut.address,
            callOptionDeposit: wbtc.address,
            putOptionDeposit: usdt.address
          }); 

           pair = {
            callOption: wbtcHodlBoosterCall,
            putOption: wbtcHodlBoosterPut,
            callOptionAssetName: "WBTC",
            putOptionAssetName: "USDT",
            callOptionAssetDecimals: WBTC_DECIMALS,
            putOptionAssetDecimals: USDT_DECIMALS,
            strikePriceDecimals: 4
          };
          
          optionPairs.set(pair.callOption.address.concat(pair.putOption.address), pair);

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
          
          /* open round 1*/
          await vault.connect(settler as Signer).initiateSettlement(); 

          //call option: 
          //alice: 5 eth
          //alice: 2 btc
          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});
          await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));
          //call option: 
          //bob: 4000 usd-eth
          //bob: 50000 usd-btc
          await ethHodlBoosterPut.connect(bob as Signer).deposit(BigNumber.from(4000).mul(USDTMultiplier));
          await wbtcHodlBoosterPut.connect(bob as Signer).deposit(BigNumber.from(50000).mul(USDTMultiplier));

          
          /* open round 2*/
          await vault.connect(settler as Signer).initiateSettlement();
          //more user deposit
          //call option:
          //bob: 1 eth
          await ethHodlBoosterCall.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)});
          //put option:
          //alice: 100000 usd-btc
          await wbtcHodlBoosterPut.connect(alice as Signer).deposit(BigNumber.from(100000).mul(USDTMultiplier));

          //no matured round yet
          await vault.connect(settler as Signer).settle([]);  
          await renderCashFlow();

          

         const ethPrice = 4000 * (10**ETHPricePrecision);
         const btcPrice = 50000 * (10**WBTCPicePrecision);
          //set the strikeprice and premium of user deposits collected in round 1
          await vault.connect(settler as Signer).commitCurrent([
          {
            strikePrice:ethPrice*1.05,
            pricePrecision:ETHPricePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: ethHodlBoosterCall.address
          },  
          {
            strikePrice:ethPrice*0.95,
            pricePrecision:ETHPricePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: ethHodlBoosterPut.address
          },
          {
            strikePrice:btcPrice*1.05,
            pricePrecision:WBTCPicePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: wbtcHodlBoosterCall.address
          }, 
          {
            strikePrice:btcPrice * 0.95,
            pricePrecision:WBTCPicePrecision,
            premiumRate: 0.025 * RatioMultipler,
            option: wbtcHodlBoosterPut.address
          },
          ]);
 
          /* open round 3*/
          await vault.connect(settler as Signer).initiateSettlement();

          await renderExecutionPlans();

          await vault.connect(settler as Signer).settle([{
            callOption: ethHodlBoosterCall.address,
            putOption: ethHodlBoosterPut.address,
            execute: OptionExecution.NoExecution
          }, 
          {
            callOption: wbtcHodlBoosterCall.address,
            putOption: wbtcHodlBoosterPut.address,
            execute: OptionExecution.NoExecution
          }])

          
          await renderCashFlow();

          await vault.connect(settler as Signer).commitCurrent([
            {
              strikePrice:ethPrice*1.04,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.025 * RatioMultipler,
              option: ethHodlBoosterCall.address
            },  
            {
              strikePrice:ethPrice*0.96,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.025 * RatioMultipler,
              option: ethHodlBoosterPut.address
            },
            {
              strikePrice:btcPrice*1.04,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.025 * RatioMultipler,
              option: wbtcHodlBoosterCall.address
            }, 
            {
              strikePrice:btcPrice * 0.96,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.025 * RatioMultipler,
              option: wbtcHodlBoosterPut.address
            },
            ]);

        });

        it("physical balance perspective", async function () {
        });
      }); 
        

      async function renderExecutionPlans() { 
        console.log("================ Decision for exercise ================");
        await renderExecutionPlan(0, true);
        await renderExecutionPlan(1, false);
        await renderExecutionPlan(2, false);
        console.log("");
        await renderExecutionPlan(3, true);
        await renderExecutionPlan(4, false);
        await renderExecutionPlan(5, false);
      }
  
      async function renderCashFlow(){
        console.log("================ Actual movement of money ================");
        console.log("Token|Epoch deposit|actual withdraw request|residue(+)/deficit(-)|movable(+)/required(-)");
        await renderCashFlowForAsset("ETH", NULL_ADDRESS, ETHMultiplier);
        await renderCashFlowForAsset("WBTC", wbtc.address, WBTCMultiplier);
        await renderCashFlowForAsset("USDT", usdt.address, USDTMultiplier);
      }

      async function renderCashFlowForAsset(assetName: string, assetAddress: string, multipler:BigNumberish){
        var assetCashFlow = await vault.connect(settler as Signer).settlementCashflowResult(assetAddress); 
        //todo: how to handle decimal
        var assetBalance = (assetCashFlow.leftOverAmount.add(assetCashFlow.newDepositAmount).
        sub(assetCashFlow.newReleasedAmount)).div(multipler);
  
        console.log(`${assetName}\t|${assetCashFlow.newDepositAmount.div(multipler)}\t|${assetCashFlow.newReleasedAmount.div(multipler)}\t|${assetCashFlow.leftOverAmount.div(multipler)}\t|${assetBalance}`);
       
      }
      async function renderExecutionPlan(index: BigNumberish, renderCategory: boolean){

        var accounting = await vault.connect(settler as Signer).executionAccountingResult(index);
        var key = accounting.callOptionResult.option.concat(accounting.putOptionResult.option);
        var pair = optionPairs.get(key);
        if (!pair){
          return;
        }
        ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.putOptionAssetDecimals)
        //todo: how to handle decimal
        var newDepositAssetAmount = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount, pair.callOptionAssetDecimals);
        var newCounterPartyAssetAmount = ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.putOptionAssetDecimals);
        var maturedCallOptionState = await pair.callOption.optionStates(accounting.callOptionResult.round.sub(BigNumber.from(1)));
        var maturedPutOptionState = await pair.putOption.optionStates(accounting.putOptionResult.round.sub(BigNumber.from(1)));
        var callStrikePrice = ethers.utils.formatUnits(maturedCallOptionState.strikePrice, pair.strikePriceDecimals);
        var putStrikePrice = ethers.utils.formatUnits(maturedPutOptionState.strikePrice, pair.strikePriceDecimals);
        if (renderCategory){
          console.log(`${pair.callOptionAssetName}<>${pair.putOptionAssetName}`);
          console.log(`${pair.callOptionAssetName} Deposit|${pair.putOptionAssetName} Deposit|curr price/call str/put str`);
          console.log(`${newDepositAssetAmount}\t|${newCounterPartyAssetAmount}\t|na/${callStrikePrice}/${putStrikePrice}`);
          console.log(`Decision|${pair.callOptionAssetName}-T-1 carried|${pair.putOptionAssetName}-T-1 carried|${pair.callOptionAssetName} user withdrawal|${pair.putOptionAssetName} user withdrawal`);
        }
       
       var callAssetAutoRoll = ethers.utils.formatUnits((accounting.callOptionResult.autoRollAmount.add(accounting.callOptionResult.autoRollPremium)
        .add(accounting.putOptionResult.autoRollCounterPartyAmount).add(accounting.putOptionResult.autoRollCounterPartyPremium))
        , pair.callOptionAssetDecimals);
        var putAssetAutoRull = ethers.utils.formatUnits((accounting.callOptionResult.autoRollCounterPartyAmount.add(accounting.callOptionResult.autoRollCounterPartyPremium)
        .add(accounting.putOptionResult.autoRollAmount).add(accounting.putOptionResult.autoRollPremium))
        , pair.putOptionAssetDecimals);
        
        var callAssetReleased =  ethers.utils.formatUnits((accounting.callOptionResult.releasedAmount.add(accounting.callOptionResult.releasedPremium)
        .add(accounting.putOptionResult.releasedCounterPartyAmount).add(accounting.putOptionResult.releasedCounterPartyPremium))
        , pair.callOptionAssetDecimals);
  
        
        var putAssetReleased = ethers.utils.formatUnits((accounting.callOptionResult.releasedCounterPartyAmount.add(accounting.callOptionResult.releasedCounterPartyPremium)
        .add(accounting.putOptionResult.releasedAmount).add(accounting.putOptionResult.releasedPremium))
        , pair.putOptionAssetDecimals);
        var decision = "";
        if (accounting.execute == OptionExecution.NoExecution){
          decision = "No Exercise";
        }
        else if (accounting.execute == OptionExecution.ExecuteCall){
          decision = "Exercise Call";
        }
        else{
  
          decision = "Exercise Put";
        }
        console.log(`${decision}\t|${callAssetAutoRoll}\t|${putAssetAutoRull}\t|${callAssetReleased}\t|${putAssetReleased}`);
         
      }
      
  });

  
