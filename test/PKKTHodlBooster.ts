import { ethers } from "hardhat";
import { assert, Assertion, expect } from "chai";
import { Contract } from "@ethersproject/contracts"; 
import { BigNumber, BigNumberish, Signer } from "ethers";
import { deployContract } from "./utilities/deploy";
import { deployUpgradeableContract } from "./utilities/deployUpgradable"; 
import {advanceBlockTo} from "./utilities/timer"; 
import {OptionPair, OptionSetting} from "./utilities/optionPair";
import { PKKTHodlBoosterOption, ERC20Mock } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NULL_ADDRESS,WEI,GWEI ,USDT_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, SETTLEMENTPERIOD,OptionExecution, WBTC_ADDRESS } from "../constants/constants";
import { AssertionError } from "assert/strict";
import { Table  } from 'console-table-printer';
import { deploy } from "@openzeppelin/hardhat-upgrades/dist/utils";
  
const CAP = BigNumber.from(1000).mul(WEI);

const MAX = BigNumber.from(500).mul(WEI);
   
const USDTMultiplier = BigNumber.from(10).pow(USDT_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const PricePrecision = 4;
const RatioMultipler = 10000; //precision xx.xx% 
const ETHUSDTOPTION = 0;
const WBTCUSDTOPTION = 1;
const StrikePriceDecimals = 4;
 
describe.only("PKKT Hodl Booster", async function () { 
    let deployer: SignerWithAddress; 
    let settler: SignerWithAddress;
    let alice: SignerWithAddress; 
    let bob: SignerWithAddress; 
    let carol: SignerWithAddress;
    let trader: SignerWithAddress; 
    let usdt: ERC20Mock;
    let wbtc: ERC20Mock; 
    let vault: PKKTHodlBoosterOption;
    let optionPairs: OptionPair[];
    let optionSettings: OptionSetting[];
    let names: {}
    
    before(async function () {
      [deployer, settler, alice, bob, carol, trader] = await ethers.getSigners(); 
        
    });

    context("operations", function () {
        beforeEach(async function () {  
          this.owner = deployer as Signer;  
          const optionLifecycle = await deployContract("OptionLifecycle", deployer as Signer);

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
           
          names = {};
          names[usdt.address] = "usdt";
          names[NULL_ADDRESS] = "eth";
          names[wbtc.address] = "wbtc";  
          vault = await deployContract(
            "PKKTHodlBoosterOption",
            {
              signer: deployer as Signer,
              libraries: {
                OptionLifecycle: optionLifecycle.address,
              } 
            } , 
            [settler.address, [
              { 
                depositAssetAmountDecimals: ETH_DECIMALS,
                counterPartyAssetAmountDecimals: USDT_DECIMALS,
                depositAsset: NULL_ADDRESS,
                counterPartyAsset: usdt.address,
                callOptionId: 0,
                putOptionId: 0
              
              },
              { 
                depositAssetAmountDecimals: WBTC_DECIMALS,
                counterPartyAssetAmountDecimals: USDT_DECIMALS,
                depositAsset:wbtc.address,
                counterPartyAsset:  usdt.address,
                callOptionId: 0,
                putOptionId: 0
              
              }
            ]]
          ) as PKKTHodlBoosterOption;
          optionSettings = [];
          var ethOption = await vault.optionPairs(0); 
          var wbtcOption = await vault.optionPairs(1);  
          optionPairs = [ ethOption, wbtcOption]; 
          optionSettings.push({
             name:"ETH-USDT-CALL",
             optionId: ethOption.callOptionId,
             depositAsset: ethOption.depositAsset,
             counterPartyAsset: ethOption.counterPartyAsset,
             depositAssetAmountDecimals: ethOption.depositAssetAmountDecimals,
             counterPartyAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals
          });
          optionSettings.push({
            name:"ETH-USDT-PUT",
             optionId: ethOption.putOptionId,
             depositAsset: ethOption.counterPartyAsset,
             counterPartyAsset: ethOption.depositAsset,
             depositAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals,
             counterPartyAssetAmountDecimals: ethOption.depositAssetAmountDecimals
          });

          optionSettings.push({
            name:"WBTC-USDT-CALL",
            optionId: wbtcOption.callOptionId,
            depositAsset: wbtcOption.depositAsset,
            counterPartyAsset: wbtcOption.counterPartyAsset,
            depositAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals,
            counterPartyAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals
         });

         optionSettings.push({
          name:"WBTC-USDT-PUT",
          optionId: wbtcOption.putOptionId,
          depositAsset: wbtcOption.counterPartyAsset,
          counterPartyAsset: wbtcOption.depositAsset,
          depositAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals,
          counterPartyAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals
       }); 

          await usdt.transfer(alice.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(bob.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(carol.address,  BigNumber.from(1000000).mul(USDTMultiplier));
          await usdt.transfer(trader.address,  BigNumber.from(1000000).mul(USDTMultiplier));

          await wbtc.transfer(alice.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address,  BigNumber.from(10).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address,  BigNumber.from(10).mul(WBTCMultiplier));  
          await wbtc.connect(alice as Signer).approve(vault.address, BigNumber.from(10).mul(WBTCMultiplier));   
          await wbtc.connect(bob as Signer).approve(vault.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          await wbtc.connect(carol as Signer).approve(vault.address, BigNumber.from(10).mul(WBTCMultiplier)); 
          
          await usdt.connect(alice as Signer).approve(vault.address, BigNumber.from(1000000).mul(USDTMultiplier));   
          await usdt.connect(bob as Signer).approve(vault.address, BigNumber.from(1000000).mul(USDTMultiplier)); 
          await usdt.connect(carol as Signer).approve(vault.address, BigNumber.from(1000000).mul(USDTMultiplier));  

        });

        afterEach(async function () {
 
        });
       
        it("user perspective", async function () {
             
          //await expect(vault.connect(alice as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
          //await expect(vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  

          /* open round 1*/
          await vault.connect(settler as Signer).initiateSettlement(); 

          //5+4 eth
          //2+0.5 btc
          await vault.connect(alice as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: BigNumber.from(5).mul(ETHMultiplier)});
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
 
          await vault.connect(alice as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId,{ value: BigNumber.from(4).mul(ETHMultiplier)});
          //await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
          //await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
          //await expect(vault.connect(alice as Signer).depositETH( optionPairs[WBTCUSDTOPTION].callOptionId, { value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  
           
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10));

          var ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId); 
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString()); 
          assert.equal(ethOptionBalance.lockedDepositAssetAmount.toString(), "0"); 
          
          var btcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString()); 
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0"); 

          btcOptionBalance = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString()); 
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0");  

          var round = await vault.currentRound();
          var optionState = await vault.getOptionStateByRound(optionPairs[ETHUSDTOPTION].callOptionId, round);
          
          assert.equal(round.toString(), "1"); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(optionState.round.toString(), "1"); 
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");

          round = await vault.currentRound();
          optionState = await vault.getOptionStateByRound(optionPairs[WBTCUSDTOPTION].callOptionId, round);
          
          assert.equal(round.toString(), "1");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
          assert.equal(optionState.round.toString(), "1"); 
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");   
          var ethBalance = await ethers.provider.getBalance(alice.address); 
          //redeem all eth
          var tx = await (await vault.connect(alice as Signer).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, BigNumber.from(8).mul(ETHMultiplier), NULL_ADDRESS)).wait();
          var gasPrice = (await ethers.provider.getTransaction(tx.transactionHash)).gasPrice;
          var tx2 = await (await vault.connect(alice as Signer).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, BigNumber.from(1).mul(ETHMultiplier), NULL_ADDRESS)).wait();
          var gasPrice2 = (await ethers.provider.getTransaction(tx2.transactionHash)).gasPrice;
        
          //await expect(ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.reverted;  
          var ethBalance2 = await ethers.provider.getBalance(alice.address);  
          var diff = (ethBalance2.add(tx.gasUsed.mul(gasPrice??0)).add(tx2.gasUsed.mul(gasPrice2??0)).sub(ethBalance));  
          assert.isTrue(diff.sub(BigNumber.from(9).mul(ETHMultiplier)).abs().lte(GWEI));
          ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId); 
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), "0");
          var optionState = await vault.getOptionStateByRound(optionPairs[ETHUSDTOPTION].callOptionId, round); 
          assert.equal(optionState.totalAmount.toString(), "0");
          var btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
          await vault.connect(alice as Signer).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(15).mul(WBTCMultiplier).div(10), wbtc.address);
          var btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address); 
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15).mul(WBTCMultiplier).div(10).toString());
          var btcBalance = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          await vault.connect(bob as Signer).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10), wbtc.address);
          btcBalance2 = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          btcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          optionState = await vault.getOptionStateByRound(optionPairs[WBTCUSDTOPTION].callOptionId, round); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          


          /* open round 2*/
          await vault.connect(settler as Signer).initiateSettlement();
          //new round , alice deposit 5eth
          await vault.connect(alice as Signer).depositETH( optionPairs[ETHUSDTOPTION].callOptionId, { value: BigNumber.from(5).mul(ETHMultiplier)});
          //bob deposit 1 btc
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
          var balance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
          var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
          //bob stop auto rolling of round 1, will be able to complete withdraw after the settlement next round
          await vault.connect(alice as Signer).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, diff);


          const ethPrice = 4000 * (10**PricePrecision);
          const btcPrice = 50000 * (10**PricePrecision); 

          await vault.connect(settler as Signer).setOptionParameters([
          {
            strikePrice:ethPrice,
            premiumRate: 0.025 * RatioMultipler,
            optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
          }, 
          //fake
          {
            strikePrice:ethPrice,
            premiumRate: 0.025 * RatioMultipler,
            optionId:  optionPairs[ETHUSDTOPTION].putOptionId
          },
          {
            strikePrice:btcPrice,
            premiumRate: 0.025 * RatioMultipler,
            optionId: optionPairs[WBTCUSDTOPTION].callOptionId
          },
          //fake
          {
            strikePrice:btcPrice,
            premiumRate: 0.025 * RatioMultipler,
            optionId: optionPairs[WBTCUSDTOPTION].putOptionId
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
            pairId: 0,
            execute: OptionExecution.NoExecution
          }, 
          {
            pairId: 1,
            execute: OptionExecution.NoExecution
          }]);
          await vault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice, 
              premiumRate: 0.02 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
            }, 
            //fake
            {
              strikePrice:ethPrice, 
              premiumRate: 0.02 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].putOptionId
            },
            {
              strikePrice:btcPrice, 
              premiumRate: 0.02 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].callOptionId
            },
            //fake
            {
              strikePrice:btcPrice, 
              premiumRate: 0.02 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].putOptionId
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

            await vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
            var available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            assert.equal(available.pendingDepositAssetAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            //0.5 * 1.025
            assert.equal(available.releasedDepositAssetAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
            btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            await vault.connect(alice as Signer).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(15125).mul(WBTCMultiplier).div(10000), wbtc.address);
            btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15125).mul(WBTCMultiplier).div(10000).toString());

            //bob want to stop the whole auto roll
            await vault.connect(bob as Signer).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
            //later on he changes his mind to allow part of it 
            await vault.connect(bob as Signer).cancelWithdraw(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10)); 
             //alice want to stop part of  the auto roll (3 auto roll + 2 release)
            await vault.connect(alice as Signer).initiateWithraw(optionPairs[ETHUSDTOPTION].callOptionId, BigNumber.from(2).mul(ETHMultiplier));
          


            /* open round 4*/
            await vault.connect(settler as Signer).initiateSettlement(); 
            await vault.connect(settler as Signer).settle([{
              pairId: 0,
              execute: OptionExecution.ExecuteCall
            }, 
            {
              pairId: 1,
              execute: OptionExecution.NoExecution
            }]);
            await vault.connect(settler as Signer).setOptionParameters([
              {
                strikePrice:ethPrice, 
                premiumRate: 0.02 * RatioMultipler,
                optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
              }, 
              //fake
              {
                strikePrice:ethPrice, 
                premiumRate: 0.02 * RatioMultipler,
                optionId:  optionPairs[ETHUSDTOPTION].putOptionId
              },
              {
                strikePrice:btcPrice, 
                premiumRate: 0.02 * RatioMultipler,
                optionId: optionPairs[WBTCUSDTOPTION].callOptionId
              },
              //fake
              {
                strikePrice:btcPrice, 
                premiumRate: 0.02 * RatioMultipler,
                optionId: optionPairs[WBTCUSDTOPTION].putOptionId
              },
              ]); 
   
   
             
              //alice got the 2*4000*1.02 executed usdc
              available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId ); 
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), "8160000000");
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");  
              //bob got 0.5*1.02 none executed btc
              var available2 = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
              assert.equal(available2.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available2.releasedDepositAssetAmount.toString(), "51000000");  
              
              var usdtInstruction = await vault.settlementCashflowResult(usdt.address);
              var diff = usdtInstruction.leftOverAmount.add(usdtInstruction.newDepositAmount).sub(usdtInstruction.newReleasedAmount);
               
              if (diff.lt(0)){
                  await usdt.connect(trader as Signer).transfer(vault.address, -diff);
              }
              var usdtBalance = await usdt.connect(alice as Signer).balanceOf(alice.address);
              await vault.connect(alice as Signer).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, available.releasedCounterPartyAssetAmount, usdt.address );
              var usdtBalance2 = await usdt.connect(alice as Signer).balanceOf(alice.address);
              assert.equal(usdtBalance2.sub(usdtBalance).toString(), available.releasedCounterPartyAssetAmount.toString());

              available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId );
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");  

        });

        it("trader perspective", async function () {

          /* open round 1*/
          await vault.connect(settler as Signer).initiateSettlement();  
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await vault.connect(alice as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: BigNumber.from(5).mul(ETHMultiplier)});

          await vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[ETHUSDTOPTION].putOptionId, BigNumber.from(4000).mul(USDTMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[ETHUSDTOPTION].putOptionId, BigNumber.from(2000).mul(USDTMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, BigNumber.from(50000).mul(USDTMultiplier));

          await renderTVL(false);

          
          /* open round 2*/
          await vault.connect(settler as Signer).initiateSettlement();
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await vault.connect(bob as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId , { value: BigNumber.from(1).mul(ETHMultiplier)});
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, BigNumber.from(100000).mul(USDTMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, BigNumber.from(50000).mul(USDTMultiplier));

          
          await renderTVL(false); 
          await renderCashFlow(OptionExecution.NoExecution, OptionExecution.NoExecution); 

         const ethPrice = 4000 * (10**PricePrecision);
         const btcPrice = 50000 * (10**PricePrecision);
          //set the strikeprice and premium of user deposits collected in round 1
          await vault.connect(settler as Signer).setOptionParameters([
          {
            strikePrice:ethPrice*1.05, 
            premiumRate: 0.025 * RatioMultipler,
            optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
          },  
          {
            strikePrice:ethPrice*0.95, 
            premiumRate: 0.025 * RatioMultipler,
            optionId:  optionPairs[ETHUSDTOPTION].putOptionId
          },
          {
            strikePrice:btcPrice*1.05, 
            premiumRate: 0.025 * RatioMultipler,
            optionId: optionPairs[WBTCUSDTOPTION].callOptionId
          }, 
          {
            strikePrice:btcPrice * 0.95, 
            premiumRate: 0.025 * RatioMultipler,
            optionId: optionPairs[WBTCUSDTOPTION].putOptionId
          },
          ]);
          /* open round 3*/
          await vault.connect(settler as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          //var ethHodlBoosterCallToTerminate = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
          await vault.connect(alice as Signer).initiateWithraw(optionPairs[ETHUSDTOPTION].callOptionId, 
            balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount)); //5.125 eth with premium
          //var ethHodlBoosterCallToTerminate2 = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          
          //var wbtcHodlBoosterPutToTerminate = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance2 = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].putOptionId);
          await vault.connect(bob as Signer).initiateWithraw(optionPairs[WBTCUSDTOPTION].putOptionId, 
            balance2.lockedDepositAssetAmount.sub(balance2.toTerminateDepositAssetAmount));  //51250.0 usdt with premium 
          //var wbtcHodlBoosterPutToTerminate2 = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          //var wbtcHodlBoosterCallTerminate = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance3 = await vault.connect(carol as Signer).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
          await vault.connect(carol as Signer).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, 
            balance3.lockedDepositAssetAmount.sub(balance3.toTerminateDepositAssetAmount)); //1.025 wbtc with premium
          //var wbtcHodlBoosterCallTerminate2 = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;

          await renderTVL(true);
          await renderExecutionPlans();

          await vault.connect(settler as Signer).settle([{ 
            pairId:0,
            execute: OptionExecution.NoExecution
          }, 
          {
            pairId:1,
            execute: OptionExecution.NoExecution
          }])

          
         var result = await renderCashFlow(OptionExecution.NoExecution,OptionExecution.NoExecution);

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
              premiumRate: 0.02 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
            },  
            {
              strikePrice:ethPrice*0.96, 
              premiumRate: 0.02 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].putOptionId
            },
            {
              strikePrice:btcPrice*1.04, 
              premiumRate: 0.02 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].callOptionId
            }, 
            {
              strikePrice:btcPrice * 0.96, 
              premiumRate: 0.02 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].putOptionId
            },
            ]);

            await renderTVL(false);

            
          /* open round 4*/
          await vault.connect(settler as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          await renderTVL(true);
          await renderExecutionPlans();

          await vault.connect(settler as Signer).settle([{
            pairId:0,
            execute: OptionExecution.ExecuteCall
          }, 
          {
            pairId:1,
            execute: OptionExecution.NoExecution
          }]);
          var result2 = await renderCashFlow(OptionExecution.ExecuteCall, OptionExecution.NoExecution);
          
          await vault.connect(settler as Signer).setOptionParameters([
            {
              strikePrice:ethPrice*1.03, 
              premiumRate: 0.01 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].callOptionId 
            },  
            {
              strikePrice:ethPrice*0.97, 
              premiumRate: 0.01 * RatioMultipler,
              optionId:  optionPairs[ETHUSDTOPTION].putOptionId
            },
            {
              strikePrice:btcPrice*1.03, 
              premiumRate: 0.01 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].callOptionId
            }, 
            {
              strikePrice:btcPrice * 0.97, 
              premiumRate: 0.01 * RatioMultipler,
              optionId: optionPairs[WBTCUSDTOPTION].putOptionId
            },
            ]); 
           var ethEnough = await vault.balanceEnough(NULL_ADDRESS);
           assert.equal(ethEnough, result2[0].assetBalance.gte(0));
           var btcEnough = await vault.balanceEnough(wbtc.address); 
           assert.equal(btcEnough, result2[1].assetBalance.gte(0));
           var usdtEnough = await vault.balanceEnough(usdt.address);
           assert.equal(usdtEnough, result2[2].assetBalance.gte(0));
           if (!ethEnough) {
              await trader.sendTransaction({
                to: vault.address,
                value: -result2[0].assetBalance, 
              });
              console.log(`Sent ${ethers.utils.formatUnits(-result2[0].assetBalance, ETH_DECIMALS)} eth`);
           }
           if (!btcEnough){
              await wbtc.connect(trader as Signer).transfer(vault.address, -result2[1].assetBalance);
              console.log(`Sent ${ethers.utils.formatUnits(-result2[1].assetBalance, WBTC_DECIMALS)} wbtc`);
           }

           if (!usdtEnough){
            await usdt.connect(trader as Signer).transfer(vault.address, -result2[2].assetBalance);
            console.log(`Sent ${ethers.utils.formatUnits(-result2[2].assetBalance, USDT_DECIMALS)} usdt`);
          }
          ethEnough = await vault.balanceEnough(NULL_ADDRESS);
          btcEnough = await vault.balanceEnough(wbtc.address); 
          usdtEnough = await vault.balanceEnough(usdt.address);
          assert.isTrue(ethEnough);
          assert.isTrue(btcEnough);
          assert.isTrue(usdtEnough);

          await renderTVL(false);
          //withdraw
          var accounts = [{name: "alice", account: alice}, 
           {name: "bob", account: bob}, 
           {name:"carol", account: carol}]
          for(var i = 0; i < optionSettings.length; i++) {
            var option = optionSettings[i];
            for(var j = 0; j < accounts.length; j++) {
              var account = accounts[j];

              var accountBalance = await vault.connect(account.account as Signer).getAccountBalance(option.optionId); 
              if (accountBalance.releasedDepositAssetAmount.gt(0)) { 
                await vault.connect(account.account as Signer).withdraw(option.optionId, accountBalance.releasedDepositAssetAmount, option.depositAsset);
                console.log(`${account.name} withdrawn ${ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, option.depositAssetAmountDecimals)} ${names[option.depositAsset]}`);
              }
              if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) { 
                await vault.connect(account.account as Signer).withdraw(option.optionId, accountBalance.releasedCounterPartyAssetAmount,  option.counterPartyAsset);
                console.log(`${account.name} withdrawn ${ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount,  option.counterPartyAssetAmountDecimals)} ${names[ option.counterPartyAsset]}`);
              }
            }
          }


          /* open round 5*/
          await vault.connect(settler as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          
          //await renderTVL(false);
          //await renderExecutionPlans();



        });

        it("physical balance perspective", async function () {
        });
      }); 
        

       
      //can be useful for user perspective code
      async function renderTVL(underSettlement: boolean) {
        
        console.log(`================================ TVL(${underSettlement? "Settling" : "Settled"}) ================================`);
        
        var p = new Table();  
        
        for(var i = 0; i < optionSettings.length; i++)
        {
          var option = optionSettings[i];  
          var assetDecimals = option.depositAssetAmountDecimals; 
          var counterPartyDecimals = option.counterPartyAssetAmountDecimals;
          var optionTVL = await vault.getOptionSnapShot(option.optionId);
          
          var assetEnough = await vault.balanceEnough(option.depositAsset);
          var counterPartyEnough = await vault.balanceEnough(option.counterPartyAsset);

          var accountBalances = [{account: "alice", ...await vault.connect(alice as Signer).getAccountBalance(option.optionId)},
          {account: "bob", ...await vault.connect(bob as Signer).getAccountBalance(option.optionId)},
          {account: "carol", ...await vault.connect(carol as Signer).getAccountBalance(option.optionId)}];
          var assetSuffix = optionTVL.totalReleasedDeposit.gt(0) ? (assetEnough ? "（available)" :"(missing)") : "";
          var counterPartySuffix = optionTVL.totalReleasedCounterParty.gt(0) ? (counterPartyEnough ? "（available)" :"(missing)") : "";
          p.addRow({Name:option.name, Locked:ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals), 
            Pending: ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals), 
            Terminating: ethers.utils.formatUnits(optionTVL.totalTerminating, assetDecimals), 
            'To Terminate': ethers.utils.formatUnits(optionTVL.totalToTerminate, assetDecimals), 
            Released: `${ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals)}${assetSuffix}`, 
            'Released-CounterParty': `${ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)}${counterPartySuffix}` });
          var totalLocked = BigNumber.from(0);
          var totalReleased = BigNumber.from(0);
          var totalReleasedCounterParty = BigNumber.from(0);
          var totalPending = BigNumber.from(0);
          var totalTerminating = BigNumber.from(0);
          var totalToTerminate = BigNumber.from(0);
          for(var j = 0 ; j < accountBalances.length; j++) {
            var accountBalance = accountBalances[j];
            p.addRow({Name:accountBalance.account, Locked:ethers.utils.formatUnits(accountBalance.lockedDepositAssetAmount, assetDecimals), 
              Pending: ethers.utils.formatUnits(accountBalance.pendingDepositAssetAmount, assetDecimals),  
              Terminating: ethers.utils.formatUnits(accountBalance.terminatingDepositAssetAmount, assetDecimals), 
              'To Terminate' : ethers.utils.formatUnits(accountBalance.toTerminateDepositAssetAmount, assetDecimals), 
              Released: `${ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, assetDecimals)}${assetSuffix}`, 
              'Released-CounterParty': `${ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount, counterPartyDecimals)}${counterPartySuffix}` });
              totalLocked = totalLocked.add(accountBalance.lockedDepositAssetAmount);
              totalReleased = totalReleased.add(accountBalance.releasedDepositAssetAmount);
              totalReleasedCounterParty = totalReleasedCounterParty.add(accountBalance.releasedCounterPartyAssetAmount);
              totalPending = totalPending.add(accountBalance.pendingDepositAssetAmount);
              totalTerminating = totalTerminating.add(accountBalance.terminatingDepositAssetAmount);
              totalToTerminate = totalToTerminate.add(accountBalance.toTerminateDepositAssetAmount);
              assert.isTrue(accountBalance.toTerminateDepositAssetAmount.lte(accountBalance.lockedDepositAssetAmount));
          } 
          assert.equal(optionTVL.totalLocked.toString(), totalLocked.toString()); 
          assert.equal(optionTVL.totalPending.toString(), totalPending.toString());
          assert.equal(optionTVL.totalReleasedDeposit.toString(), totalReleased.toString());
          assert.equal(optionTVL.totalReleasedCounterParty.toString(), totalReleasedCounterParty.toString());
          assert.equal(optionTVL.totalTerminating.toString(), totalTerminating.toString());
          assert.equal(optionTVL.totalToTerminate.toString(), totalToTerminate.toString());
          assert.isTrue(optionTVL.totalToTerminate.lte(optionTVL.totalLocked));
        }
         
        p.printTable();
      }
     

      //can be useful for trader perspective code
      async function renderExecutionPlans() { 
        console.log("================================ Decision for exercise ================================");
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
  
      
      async function renderCashFlow(decision1: OptionExecution, decision2: OptionExecution): Promise<{assetAddress: string; assetBalance: BigNumber}[]>{
        console.log(`================================ Actual movement of money(${decision1},${decision2}) ================================`);
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
        var pair = optionPairs[accounting.callOptionResult.optionId / 2]; 
        if (!pair){ 
          return;
        } 
        var newDepositAssetAmount = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount, pair.depositAsset);
        var newCounterPartyAssetAmount = ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.counterPartyAsset);
        var maturedCallOptionState = await vault.getOptionStateByRound(pair.callOptionId, accounting.callOptionResult.round - 1);
        var maturedPutOptionState = await vault.getOptionStateByRound(pair.putOptionId, accounting.putOptionResult.round- 1);
        var callStrikePrice = ethers.utils.formatUnits(maturedCallOptionState.strikePrice, StrikePriceDecimals);
        var putStrikePrice = ethers.utils.formatUnits(maturedPutOptionState.strikePrice, StrikePriceDecimals);
 
  
       var callAssetAutoRoll =accounting.callOptionResult.autoRollAmount.add(accounting.callOptionResult.autoRollPremium)
        .add(accounting.putOptionResult.autoRollCounterPartyAmount).add(accounting.putOptionResult.autoRollCounterPartyPremium);
        var putAssetAutoRull = accounting.callOptionResult.autoRollCounterPartyAmount.add(accounting.callOptionResult.autoRollCounterPartyPremium)
        .add(accounting.putOptionResult.autoRollAmount).add(accounting.putOptionResult.autoRollPremium);
        
        var callAssetReleased =  accounting.callOptionResult.releasedAmount.add(accounting.callOptionResult.releasedPremium)
        .add(accounting.putOptionResult.releasedCounterPartyAmount).add(accounting.putOptionResult.releasedCounterPartyPremium);
  
        
        var putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount.add(accounting.callOptionResult.releasedCounterPartyPremium)
        .add(accounting.putOptionResult.releasedAmount).add(accounting.putOptionResult.releasedPremium);

        var depositDebt = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount.add(callAssetAutoRoll).sub(callAssetReleased), 
        pair.depositAssetAmountDecimals);
        var counterPartyDebt =  ethers.utils.formatUnits(accounting.putOptionResult.depositAmount.add(putAssetAutoRull).sub(putAssetReleased),
        pair.counterPartyAssetAmountDecimals);

        var callAssetReleasedStr = ethers.utils.formatUnits(callAssetReleased, pair.depositAssetAmountDecimals);
        var putAssetReleasedStr = ethers.utils.formatUnits(putAssetReleased, pair.counterPartyAssetAmountDecimals);

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
        option['Option'] = `${names[pair.depositAsset]}<>${names[pair.counterPartyAsset]}`;
        option['Decision'] = decision;
        option[`${names[pair.depositAsset]}-debt`] = depositDebt;
        option[`${names[pair.counterPartyAsset]}-debt`] = counterPartyDebt;
        option[`${names[pair.depositAsset]} withdrawal`] = callAssetReleasedStr;
        option[`${names[pair.counterPartyAsset]} withdrawal`] = putAssetReleasedStr;
        option[`${names[pair.depositAsset]} Deposit`] = newDepositAssetAmount;
        option[`${names[pair.counterPartyAsset]} Deposit`] = newCounterPartyAssetAmount;
        option['call str/put str'] = `${callStrikePrice}/${putStrikePrice}`;
        p.addRow(option);
           
      }
      
  });

  
