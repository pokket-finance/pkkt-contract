import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, BigNumberish, Signer } from "ethers";
import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import {advanceBlockTo} from "./utilities/timer"; 
import {OptionPair} from "./utilities/optionPair";
import { PKKTHodlBoosterOption, ERC20Mock, OptionVault } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI ,USDT_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, SETTLEMENTPERIOD,OptionExecution, WBTC_ADDRESS } from "../constants/constants";
import { AssertionError } from "assert/strict";
import { Table  } from 'console-table-printer';
  
const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);
   
const USDTMultiplier = BigNumber.from(10).pow(USDT_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const ETHPricePrecision = 4;
const WBTCPicePrecision = 4; 
const RatioMultipler = 10000; //precision xx.xx% 
 
describe.only("PKKT Hodl Booster", async function () {
    let ethHodlBoosterCall: PKKTHodlBoosterOption;
    let wbtcHodlBoosterCall: PKKTHodlBoosterOption;
    let ethHodlBoosterPut: PKKTHodlBoosterOption;
    let wbtcHodlBoosterPut: PKKTHodlBoosterOption;
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
            "PKKTHodlBoosterOption",
            deployer as Signer,
            [
              "ETH-USDT-HodlBooster-Call",
              "ETHUSDTHodlBoosterCall",
              NULL_ADDRESS,
              usdt.address,
              ETH_DECIMALS,
              USDT_DECIMALS,
              vault.address,
              true,
              settler.address
            ]
          ) as PKKTHodlBoosterOption;  
                     
          wbtcHodlBoosterCall = await deployUpgradeableContract(
            "PKKTHodlBoosterOption",
            deployer as Signer,
            [
              "WBTC-USDT-HodlBooster-Call",
              "WBTCUSDTHodlBoosterCall",
              wbtc.address,
              usdt.address,
              WBTC_DECIMALS,
              USDT_DECIMALS,
              vault.address,
              true,
              settler.address
            ]
          ) as PKKTHodlBoosterOption;  
          ethHodlBoosterPut = await deployUpgradeableContract(
            "PKKTHodlBoosterOption",
            deployer as Signer,
            [
              "ETH-USDT-HodlBooster-Put",
              "ETHUSDTHodlBoosterPut",
              usdt.address,
              NULL_ADDRESS,
              USDT_DECIMALS,
              ETH_DECIMALS,
              vault.address,
              false,
              settler.address
            ]
          ) as PKKTHodlBoosterOption;  
          wbtcHodlBoosterPut = await deployUpgradeableContract(
            "PKKTHodlBoosterOption",
            deployer as Signer,
            [
              "WBTC-USDT-HodlBooster-Put",
              "WBTCUSDTHodlBoosterPut",
              usdt.address,
              wbtc.address,
              USDT_DECIMALS,
              WBTC_DECIMALS,
              vault.address,
              false,
              settler.address
            ]
          ) as PKKTHodlBoosterOption;  

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
          assert.equal(ethOptionBalance.lockedDepositAssetAmount.toString(), "0"); 
          
          var btcOptionBalance = await wbtcHodlBoosterCall.connect(alice as Signer).getAccountBalance();
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString()); 
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0"); 

          btcOptionBalance = await wbtcHodlBoosterCall.connect(bob as Signer).getAccountBalance();
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString()); 
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0");  

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
          var tx = await (await ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(8).mul(ETHMultiplier))).wait();
          var gasPrice = (await ethers.provider.getTransaction(tx.transactionHash)).gasPrice;
          var tx2 = await (await ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).wait();
          var gasPrice2 = (await ethers.provider.getTransaction(tx.transactionHash)).gasPrice;
        
          //await expect(ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.reverted;  
          var ethBalance2 = await ethers.provider.getBalance(alice.address);  
          var diff = (ethBalance2.add(tx.gasUsed.mul(gasPrice??0)).add(tx2.gasUsed.mul(gasPrice2??0)).sub(ethBalance)); 
          assert.isTrue(diff.sub(BigNumber.from(9).mul(ETHMultiplier)).abs().lte(GWEI));
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
          //bob stop auto rolling of round 1, will be able to complete withdraw after the settlement next round
          await wbtcHodlBoosterCall.connect(alice as Signer).maxInitiateWithdraw();


          const ethPrice = 4000 * (10**ETHPricePrecision);
          const btcPrice = 50000 * (10**WBTCPicePrecision);
 
          await vault.connect(settler as Signer).settle([]);

          await vault.connect(settler as Signer).setOptionParameters([
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
          await vault.connect(settler as Signer).setOptionParameters([
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
            await vault.connect(settler as Signer).setOptionParameters([
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
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(5).mul(ETHMultiplier)});

          await wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(WBTCMultiplier));
          await wbtcHodlBoosterCall.connect(carol as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier));
          
          await ethHodlBoosterPut.connect(bob as Signer).deposit(BigNumber.from(4000).mul(USDTMultiplier));
          await ethHodlBoosterPut.connect(carol as Signer).deposit(BigNumber.from(2000).mul(USDTMultiplier));
          
          await wbtcHodlBoosterPut.connect(bob as Signer).deposit(BigNumber.from(50000).mul(USDTMultiplier));

          await renderTVL();

          
          /* open round 2*/
          await vault.connect(settler as Signer).initiateSettlement();
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await ethHodlBoosterCall.connect(bob as Signer).depositETH({ value: BigNumber.from(1).mul(ETHMultiplier)});
          await wbtcHodlBoosterPut.connect(alice as Signer).deposit(BigNumber.from(100000).mul(USDTMultiplier));
          await wbtcHodlBoosterPut.connect(carol as Signer).deposit(BigNumber.from(50000).mul(USDTMultiplier));

          
          await renderTVL();

          //no matured round yet
          await vault.connect(settler as Signer).settle([]);  
          await renderCashFlow();

          
          await renderTVL();

         const ethPrice = 4000 * (10**ETHPricePrecision);
         const btcPrice = 50000 * (10**WBTCPicePrecision);
          //set the strikeprice and premium of user deposits collected in round 1
          await vault.connect(settler as Signer).setOptionParameters([
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
          console.log(`Open Round ${await vault.currentRound()}` );
          await ethHodlBoosterCall.connect(alice as Signer).maxInitiateWithdraw();
          await wbtcHodlBoosterPut.connect(bob as Signer).maxInitiateWithdraw();

          await renderTVL();
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

          
         var result = await renderCashFlow();

          var ethBalance = await ethers.provider.getBalance(trader.address); 
          await vault.connect(settler as Signer).withdrawAsset(trader.address, NULL_ADDRESS); 
          var ethBalance2 = await ethers.provider.getBalance(trader.address); 
          assert.equal(ethBalance2.sub(ethBalance).toString(), result[0].assetBalance.toString());
          var wbtcBalance = await wbtc.connect(trader as Signer).balanceOf(trader.address);
          await vault.connect(settler as Signer).withdrawAsset(trader.address, wbtc.address); 
          var wbtcBalance2 = await wbtc.connect(trader as Signer).balanceOf(trader.address);
          assert.equal(wbtcBalance2.sub(wbtcBalance).toString(), result[1].assetBalance.toString());
          var usdtBalance = await usdt.connect(trader as Signer).balanceOf(trader.address);
          await vault.connect(settler as Signer).withdrawAsset(trader.address, usdt.address); 
          var usdtBalance2 = await usdt.connect(trader as Signer).balanceOf(trader.address);
          assert.equal(usdtBalance2.sub(usdtBalance).toString(), result[2].assetBalance.toString());


          await vault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice*1.04,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: ethHodlBoosterCall.address
            },  
            {
              strikePrice:ethPrice*0.96,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: ethHodlBoosterPut.address
            },
            {
              strikePrice:btcPrice*1.04,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: wbtcHodlBoosterCall.address
            }, 
            {
              strikePrice:btcPrice * 0.96,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.02 * RatioMultipler,
              option: wbtcHodlBoosterPut.address
            },
            ]);

            await renderTVL();

            
          /* open round 4*/
          await vault.connect(settler as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          await renderTVL();
          await renderExecutionPlans();

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
          await vault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice*1.03,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.01 * RatioMultipler,
              option: ethHodlBoosterCall.address
            },  
            {
              strikePrice:ethPrice*0.97,
              pricePrecision:ETHPricePrecision,
              premiumRate: 0.01 * RatioMultipler,
              option: ethHodlBoosterPut.address
            },
            {
              strikePrice:btcPrice*1.03,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.01 * RatioMultipler,
              option: wbtcHodlBoosterCall.address
            }, 
            {
              strikePrice:btcPrice * 0.97,
              pricePrecision:WBTCPicePrecision,
              premiumRate: 0.01 * RatioMultipler,
              option: wbtcHodlBoosterPut.address
            },
            ]);

          await renderTVL();
          await renderExecutionPlans();

        });

        it("physical balance perspective", async function () {
        });
      }); 
        

       
      //can be useful for user perspective code
      async function renderTVL() {
        
        console.log("================ TVL ================");
        
        var p = new Table();
        var options = [ethHodlBoosterCall, ethHodlBoosterPut, wbtcHodlBoosterCall, wbtcHodlBoosterPut];
        
        for(var i = 0; i < options.length; i++)
        {
          var option = options[i]; 
          var name = await option.name();
          var assetDecimals = await  option.depositAssetAmountDecimals(); 
          var counterPartyDecimals = await option.counterPartyAssetAmountDecimals();
          var optionTVL = await option.getOptionSnapShot();
          
          var assetEnough = await vault.balanceEnough(await option.depositAsset());
          var counterPartyEnough = await vault.balanceEnough(await option.counterPartyAsset());

          var accountBalances = [{account: "alice", ...await option.connect(alice as Signer).getAccountBalance()},
          {account: "bob", ...await option.connect(bob as Signer).getAccountBalance()},
          {account: "carol", ...await option.connect(carol as Signer).getAccountBalance()}];
          var assetSuffix = optionTVL.totalReleasedDeposit.gt(0) ? (assetEnough ? "（available)" :"(missing)") : "";
          var counterPartySuffix = optionTVL.totalReleasedCounterParty.gt(0) ? (counterPartyEnough ? "（available)" :"(missing)") : "";
          p.addRow({Name:name, Locked:ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals), 
            Pending: ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals), 
            Released: `${ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals)}${assetSuffix}`, 
            'Released-CounterParty': `${ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)}${counterPartySuffix}` });
          
          for(var j = 0 ; j < accountBalances.length; j++) {
            var accountBalance = accountBalances[j];
            p.addRow({Name:accountBalance.account, Locked:ethers.utils.formatUnits(accountBalance.lockedDepositAssetAmount, assetDecimals), 
              Pending: ethers.utils.formatUnits(accountBalance.pendingDepositAssetAmount, assetDecimals), 
              Released: `${ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, assetDecimals)}${assetSuffix}`, 
              'Released-CounterParty': `${ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount, counterPartyDecimals)}${counterPartySuffix}` });
 
          }
        }
        
        p.printTable();
      }
     

      //can be useful for trader perspective code
      async function renderExecutionPlans() { 
        console.log("================ Decision for exercise ================");
        var p = new Table();
        await renderExecutionPlan(0, p);
        await renderExecutionPlan(1, p);
        await renderExecutionPlan(2, p); 
        p.printTable();
        p = new Table();
        await renderExecutionPlan(3, p);
        await renderExecutionPlan(4, p);
        await renderExecutionPlan(5, p); 
        p.printTable();
      }
  
      
      async function renderCashFlow(): Promise<{assetAddress: string; assetBalance: BigNumber}[]>{
        console.log("================ Actual movement of money ================");
        const p = new Table();
        //print
        //console.log("Token|Epoch deposit|actual withdraw request|residue(+)/deficit(-)|movable(+)/required(-)"); 
        
        var result = [await renderCashFlowForAsset("ETH", NULL_ADDRESS, ETH_DECIMALS, p),
        await renderCashFlowForAsset("WBTC", wbtc.address, WBTC_DECIMALS, p),
        await renderCashFlowForAsset("USDT", usdt.address, USDT_DECIMALS, p)];
        
        p.printTable();
        return result;
      }

      async function renderCashFlowForAsset(assetName: string, assetAddress: string, decimals:BigNumberish, p: Table):Promise<{
        assetAddress: string;
        assetBalance: BigNumber}>{
        var assetCashFlow = await vault.connect(settler as Signer).settlementCashflowResult(assetAddress);  
        var assetBalance = (assetCashFlow.leftOverAmount.add(assetCashFlow.newDepositAmount).
        sub(assetCashFlow.newReleasedAmount));
        p.addRow({ Token: assetName, 'Epoch deposit': ethers.utils.formatUnits(assetCashFlow.newDepositAmount, decimals),
         'Actual withdraw request': ethers.utils.formatUnits(assetCashFlow.newReleasedAmount, decimals),
         'residue(+)/deficit(-)': ethers.utils.formatUnits(assetCashFlow.leftOverAmount, decimals), 
        'movable(+)/required(-)': ethers.utils.formatUnits(assetBalance, decimals)}); 
        return  {assetAddress, assetBalance} ;
      }

      async function renderExecutionPlan(index: BigNumberish, p: Table){

        var accounting = await vault.connect(settler as Signer).executionAccountingResult(index);
        var key = accounting.callOptionResult.option.concat(accounting.putOptionResult.option);
        var pair = optionPairs.get(key);
        if (!pair){
          return;
        } 
        var newDepositAssetAmount = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount, pair.callOptionAssetDecimals);
        var newCounterPartyAssetAmount = ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.putOptionAssetDecimals);
        var maturedCallOptionState = await pair.callOption.optionStates(accounting.callOptionResult.round.sub(BigNumber.from(1)));
        var maturedPutOptionState = await pair.putOption.optionStates(accounting.putOptionResult.round.sub(BigNumber.from(1)));
        var callStrikePrice = ethers.utils.formatUnits(maturedCallOptionState.strikePrice, pair.strikePriceDecimals);
        var putStrikePrice = ethers.utils.formatUnits(maturedPutOptionState.strikePrice, pair.strikePriceDecimals);
 
  
       var callAssetAutoRoll =accounting.callOptionResult.autoRollAmount.add(accounting.callOptionResult.autoRollPremium)
        .add(accounting.putOptionResult.autoRollCounterPartyAmount).add(accounting.putOptionResult.autoRollCounterPartyPremium);
        var putAssetAutoRull = accounting.callOptionResult.autoRollCounterPartyAmount.add(accounting.callOptionResult.autoRollCounterPartyPremium)
        .add(accounting.putOptionResult.autoRollAmount).add(accounting.putOptionResult.autoRollPremium);
        
        var callAssetReleased =  accounting.callOptionResult.releasedAmount.add(accounting.callOptionResult.releasedPremium)
        .add(accounting.putOptionResult.releasedCounterPartyAmount).add(accounting.putOptionResult.releasedCounterPartyPremium);
  
        
        var putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount.add(accounting.callOptionResult.releasedCounterPartyPremium)
        .add(accounting.putOptionResult.releasedAmount).add(accounting.putOptionResult.releasedPremium);

        var depositDebt = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount.add(callAssetAutoRoll).sub(callAssetReleased), 
        pair.callOptionAssetDecimals);
        var counterPartyDebt =  ethers.utils.formatUnits(accounting.putOptionResult.depositAmount.add(putAssetAutoRull).sub(putAssetReleased),
        pair.putOptionAssetDecimals);

        var callAssetReleasedStr = ethers.utils.formatUnits(callAssetReleased, pair.callOptionAssetDecimals);
        var putAssetReleasedStr = ethers.utils.formatUnits(putAssetReleased, pair.putOptionAssetDecimals);

        var decision = "";
        if (accounting.execute == OptionExecution.NoExecution){
          decision = "No Exe";
        }
        else if (accounting.execute == OptionExecution.ExecuteCall){
          decision = "Exe Call";
        }
        else{
  
          decision = "Exe Put";
        }

        var option = {};
        option['Option'] = `${pair.callOptionAssetName}<>${pair.putOptionAssetName}`;
        option['Decision'] = decision;
        option[`${pair.callOptionAssetName}-debt`] = depositDebt;
        option[`${pair.putOptionAssetName}-debt`] = counterPartyDebt;
        option[`${pair.callOptionAssetName} withdrawal`] = callAssetReleasedStr;
        option[`${pair.putOptionAssetName} withdrawal`] = putAssetReleasedStr;
        option[`${pair.callOptionAssetName} Deposit`] = newDepositAssetAmount;
        option[`${pair.putOptionAssetName} Deposit`] = newCounterPartyAssetAmount;
        option['call str/put str'] = `${callStrikePrice}/${putStrikePrice}`;
        p.addRow(option);
           
      }
      
  });

  
