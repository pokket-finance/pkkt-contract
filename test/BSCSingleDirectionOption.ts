import { assert, AssertionError, expect } from "chai";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { deployContract,deployUpgradeableContract } from "./utilities/deploy";
import { vaultDefinition } from "./utilities/vaultDefinition";
import { ERC20Mock, SingleDirectionOptionUpgradeable, SingleDirectionOptionV2Upgradeable } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {  GWEI, BUSD_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, OptionExecution, BUSD_MULTIPLIER, BSC_ETH_ADDRESS } from "../constants/constants";
import { Table } from 'console-table-printer';
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";   
import { advanceBlock, advanceTime, advanceTimeAndBlock, latest } from "./utilities/timer";
   
const BUSDMultiplier = BigNumber.from(10).pow(BUSD_DECIMALS);
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);
const PricePrecision = 4;
const RatioMultiplier = 10 ** 8; //precision xx.xx%
const StrikeMultiplier = 10 ** 4;
const ETHBUSDOPTIONPAIR = 0;
const WBTCBUSDOPTIONPAIR = 1;
const StrikePriceDecimals = 4;

const ethPrice = 1800 * StrikeMultiplier;
const btcPrice = 30000 * StrikeMultiplier;

describe.only("BSC Single Direction Option", async function () {
    let deployer: SignerWithAddress;
    let owner: SignerWithAddress;
    let manager: SignerWithAddress;
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    let trader: SignerWithAddress;
    let eth: ERC20Mock;
    let busd: ERC20Mock;
    let wbtc: ERC20Mock;
    let vault: SingleDirectionOptionUpgradeable;
    let vaultDefinitions: vaultDefinition[];
    let names: {[key:string]: string};
    let contracts: {[key:string]: ERC20Mock};
    let optionLifecycleAddress: string;

    before(async function () {
      [deployer, owner, manager, admin, alice, bob, carol, trader] = await ethers.getSigners();
    });

    context("operations", function () {
        beforeEach(async function () {
          this.owner = deployer as Signer;
          const optionLifecycle = await deployContract("OptionLifecycle", deployer as Signer);
          eth  = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "PeggedETH",
              "ETH",
              BigNumber.from(10000).mul(ETHMultiplier),
              ETH_DECIMALS
            ]
          ) as ERC20Mock;
          busd = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "Binance Pegged BUSD",
              "BUSD",
              BigNumber.from(100000000).mul(BUSDMultiplier),
              BUSD_DECIMALS
            ]
          ) as ERC20Mock;
          wbtc = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "Wrapped BTC",
              "WBTC",
              BigNumber.from(1000).mul(WBTCMultiplier),
              WBTC_DECIMALS
            ]
          ) as ERC20Mock;

          names = {};
          contracts = {};
          names[busd.address] = "busd";
          names[eth.address] = "eth";
          names[wbtc.address] = "wbtc";
          contracts[busd.address] = busd;
          contracts[eth.address] = eth;
          contracts[wbtc.address] = wbtc;

          const initArgs = [
            owner.address,
            manager.address, [
            {
              assetAmountDecimals: ETH_DECIMALS,
              asset: eth.address,
              underlying: eth.address,
              vaultId: 0,
              callOrPut: true
            }, {
              assetAmountDecimals: BUSD_DECIMALS,
              asset: busd.address,
              underlying: eth.address,
              vaultId: 0,
              callOrPut: false
            }, {
              assetAmountDecimals: WBTC_DECIMALS,
              asset: wbtc.address,
              underlying: wbtc.address,
              vaultId: 0,
              callOrPut: true
            }, {
              assetAmountDecimals: BUSD_DECIMALS,
              asset: busd.address,
              underlying: wbtc.address,
              vaultId: 0,
              callOrPut: false
            }
          ]
        ];
        optionLifecycleAddress = optionLifecycle.address;
        const optionVault = await ethers.getContractFactory("SingleDirectionOptionUpgradeable", {
          libraries: {
            OptionLifecycle: optionLifecycleAddress,
          },
        }) as ContractFactory;

        vault = await deployUpgradeableContract(optionVault, initArgs) as SingleDirectionOptionUpgradeable;
        vaultDefinitions = [];
        for(let i = 0; i < 4; i++) {
          const vaultDefinition = await vault.vaultDefinitions(i);
          vaultDefinitions.push({
            ...vaultDefinition,
            name: names[vaultDefinition.underlying].toString().toUpperCase() + ( vaultDefinition.callOrPut ? "-CALL": "-PUT"),
          })
        }
       
          await eth.transfer(alice.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(bob.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(carol.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(trader.address, BigNumber.from(1000).mul(ETHMultiplier));

          await busd.transfer(alice.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(bob.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(carol.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(trader.address, BigNumber.from(10000000).mul(BUSDMultiplier));

          await wbtc.transfer(alice.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.transfer(trader.address, BigNumber.from(100).mul(WBTCMultiplier));

          await wbtc.connect(alice as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(bob as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(carol as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(trader as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));

          await busd.connect(alice as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(bob as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(carol as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(trader as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));

          
          await eth.connect(alice as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(bob as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(carol as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier)); 
          await eth.connect(trader as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier)); 

        });

        afterEach(async function () {
        });

        it("mutiple rounds", async function () {
          //round 1
          await vault.connect(manager as Signer).kickOffOptions([{
            vaultId: 0,
            maxCapacity: BigNumber.from(100).mul(ETHMultiplier),
            environment:2
          }]);
          //round 2
          await advanceTimeAndBlock(60);
          //round 3
          await advanceTimeAndBlock(60);
          console.log('Alice deposit 1 ETH')
          await vault.connect(alice as Signer).deposit(0, BigNumber.from(1).mul(ETHMultiplier));
          await printState(vault, 0, alice)

          //round 4
          await advanceTimeAndBlock(60);

          await printState(vault, 0, alice)
          console.log('Alice deposit 2 ETH')
          await vault.connect(alice as Signer).deposit(0, BigNumber.from(2).mul(ETHMultiplier));
          await printState(vault, 0, alice)
          //round 5
          await advanceTimeAndBlock(60);
          
          await printState(vault, 0, alice)
          console.log('Alice initiate 3 ETH withdraw')
          await vault.connect(alice as Signer).initiateWithraw(0, BigNumber.from(3).mul(ETHMultiplier));
          console.log('Alice cancel 1.5 ETH withdraw')
          await vault.connect(alice as Signer).cancelWithdraw(0, BigNumber.from(15).mul(ETHMultiplier).div(10)); 
          console.log('Alice deposit 2 ETH')
          await vault.connect(alice as Signer).deposit(0, BigNumber.from(2).mul(ETHMultiplier));
          await printState(vault, 0, alice)
          //round 6
          await advanceTimeAndBlock(60);
          await printState(vault, 0, alice)
          
          //round 7
          await advanceTimeAndBlock(60);
          await printState(vault, 0, alice)
          
          //round 8
          await advanceTimeAndBlock(60);
          await printState(vault, 0, alice)
          //round 9
          await advanceTimeAndBlock(60);
          await printState(vault, 0, alice)
          //round 10
          await advanceTimeAndBlock(60); 
          await advanceTimeAndBlock(60); 
          await advanceTimeAndBlock(60); 
          await printState(vault, 0, alice)
          console.log('Alice initiate 3 ETH withdraw')
          await vault.connect(alice as Signer).initiateWithraw(0, BigNumber.from(3).mul(ETHMultiplier));
          await printState(vault, 0, alice)
          await advanceTimeAndBlock(60);  
          await advanceTimeAndBlock(60);  
          await advanceTimeAndBlock(60);
          await printState(vault, 0, alice)


        });

        it("end user perspective", async function () { 
        
            //round 1
            await vault.connect(manager as Signer).kickOffOptions([{
              vaultId: 0,
              maxCapacity: BigNumber.from(20).mul(ETHMultiplier),
              environment:2
            }, {
              vaultId: 1,
              maxCapacity: BigNumber.from(20).mul(1800).mul(BUSDMultiplier),
              environment:2
            }, {
              vaultId: 2,
              maxCapacity: BigNumber.from(10).mul(WBTCMultiplier),
              environment:2
            }, {
              vaultId: 3,
              maxCapacity: BigNumber.from(10).mul(30000).mul(BUSDMultiplier),
              environment:2
            }]);
  
            await vault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(ETHMultiplier));
            await vault.connect(bob as Signer).deposit(1, BigNumber.from(1000).mul(BUSDMultiplier));
            let aliceState = await vault.connect(alice as Signer).getUserState(0);
            assert.equal(aliceState.pending.toString(), BigNumber.from(10).mul(ETHMultiplier).toString());
            let bobState = await vault.connect(bob as Signer).getUserState(1);
            assert.equal(bobState.pending.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString()); 
                    
          //round 2
          await advanceTime(60); 
          //sell round 1
          await vault.connect(manager as Signer).sellOptions([{
            vaultId: 0,
            strike: ethPrice * 1.05,
            premiumRate: 0.015 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.96,
            premiumRate: 0.01 * RatioMultiplier
          }]); 
          
          aliceState = await vault.connect(alice as Signer).getUserState(0);
          assert.isTrue(aliceState.pending.eq(0));
          bobState = await vault.connect(bob as Signer).getUserState(1);
          assert.equal(bobState.onGoingAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString()); 
          assert.isTrue(bobState.pending.eq(0));

          await vault.connect(manager as Signer).addToWhitelist([trader.address]);
          await vault.connect(trader as Signer).buyOptions([0,1]);

          //round 3
          await advanceTimeAndBlock(60);
          
          aliceState = await vault.connect(alice as Signer).getUserState(0);
          assert.equal(aliceState.expiredAmount.toString(), BigNumber.from(10).mul(ETHMultiplier).toString());
          assert.isTrue(aliceState.onGoingAmount.eq(0));
          assert.isTrue(aliceState.pending.eq(0));
          bobState = await vault.connect(bob as Signer).getUserState(1);
          assert.equal(bobState.expiredAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString()); 
          assert.isTrue(bobState.onGoingAmount.eq(0));
          assert.isTrue(bobState.pending.eq(0));

          await  vault.connect(manager as Signer).expireOptions([{
            expiryLevel: ethPrice * 1.04,
            vaultId: 0
          }, {
            expiryLevel: ethPrice * 1.04,
            vaultId: 1
          }]);
          //nothing to collect, user get premium
          aliceState = await vault.connect(alice as Signer).getUserState(0);
          assert.equal(aliceState.onGoingAmount.toString(), BigNumber.from(10).mul(ETHMultiplier).mul(10150).div(10000).toString());
          assert.isTrue(aliceState.expiredAmount.eq(0));
          assert.isTrue(aliceState.pending.eq(0));
          const oldAliceOnGoing = aliceState.onGoingAmount;
          bobState = await vault.connect(bob as Signer).getUserState(1);
          assert.equal(bobState.onGoingAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).mul(10100).div(10000).toString()); 
          assert.isTrue(bobState.expiredAmount.eq(0));
          assert.isTrue(bobState.pending.eq(0));
          const oldBobOnGoing = bobState.onGoingAmount;

          //alice initiate withdraw after expiry, will terminate until next expire: round 2
          await vault.connect(alice as Signer).initiateWithraw(0, oldAliceOnGoing.div(10));
          //bob invest more for next round: round 3
          await vault.connect(bob as Signer).deposit(1, BigNumber.from(1000).mul(BUSDMultiplier));

          //sell round 2
          const sellings = [{
            vaultId: 0,
            strike: ethPrice * 1.1,
            premiumRate: 0.01 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 1,
            premiumRate: 0.015 * RatioMultiplier
          }];
          await vault.connect(manager as Signer).sellOptions(sellings); 

          await vault.connect(trader as Signer).buyOptions([0,1]);
          
          await advanceTime(60);

          //round 4
          const expires = [{
            expiryLevel: (ethPrice * 1.12).toFixed(0),
            vaultId: 0
          }, {
            expiryLevel: (ethPrice * 1.12).toFixed(0),
            vaultId: 1
          }];
          await  vault.connect(manager as Signer).expireOptions(expires);

           //trader has some value to collect for call option
           aliceState = await vault.connect(alice as Signer).getUserState(0);
           const optionHolderValue = BigNumber.from(expires[0].expiryLevel).sub(BigNumber.from(sellings[0].strike)).
           mul(oldAliceOnGoing).div(BigNumber.from(expires[0].expiryLevel));
           const remaining = oldAliceOnGoing.mul(BigNumber.from(10100)).div(10000).sub(optionHolderValue);
           const expiryPrice =  remaining.mul(10 ** 8).div(oldAliceOnGoing);
           const newOnGoing = oldAliceOnGoing.mul(expiryPrice).mul(9).div(10).div(10 ** 8);
           const redeemded = oldAliceOnGoing.mul(expiryPrice).mul(1).div(10).div(10 ** 8);
           assert.equal(aliceState.onGoingAmount.toString(), newOnGoing.toString());
           assert.isTrue(redeemded.gt(0));
           assert.isTrue(aliceState.redeemed.eq(redeemded));
           assert.isTrue(aliceState.pending.eq(0));
           bobState = await vault.connect(bob as Signer).getUserState(1);
           assert.equal(bobState.onGoingAmount.toString(), oldBobOnGoing.mul(10150).div(10000).add(BigNumber.from(1000).mul(BUSDMultiplier)).toString()); 
           assert.isTrue(bobState.expiredAmount.eq(0));
           assert.isTrue(bobState.redeemed.eq(0));
           assert.isTrue(bobState.pending.eq(0));
           const oldAliceBalance = await eth.balanceOf(alice.address);
           await expect(vault.connect(alice as Signer).withdraw(0, redeemded.add(1))).to.be.revertedWith("Not enough to withdraw");
           await vault.connect(alice as Signer).withdraw(0, redeemded.div(2));
           const newAliceBalance = await eth.balanceOf(alice.address);
           assert.equal(newAliceBalance.sub(oldAliceBalance).toString(), redeemded.div(2).toString());

           await vault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(ETHMultiplier));
           aliceState = await vault.connect(alice as Signer).getUserState(0);
           assert.equal(aliceState.pending.toString(), BigNumber.from(10).mul(ETHMultiplier).toString());
           assert.equal(aliceState.redeemed.toString(), redeemded.div(2).toString());

           await vault.connect(alice as Signer).withdraw(0, redeemded.div(2).add(BigNumber.from(10).mul(ETHMultiplier)));
           aliceState = await vault.connect(alice as Signer).getUserState(0);
           assert.isTrue(aliceState.redeemed.eq(0));
           assert.isTrue(aliceState.pending.eq(0));

           const selling2 = [{
            vaultId: 0,
            strike: ethPrice * 1.05,
            premiumRate: 0.01 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice,
            premiumRate: 0.015 * RatioMultiplier
          }];;
           await vault.connect(manager as Signer).sellOptions(selling2);
           await vault.connect(trader as Signer).buyOptions([0,1]);

           //round 5
           await advanceTimeAndBlock(60);
           
           bobState = await vault.connect(bob as Signer).getUserState(0);
           const bobExpiredAmount = bobState.expiredAmount;
           const aliceExpiredAmount = aliceState.onGoingAmount;
           //they will be redeemable instantly after expiry
           await vault.connect(alice as Signer).initiateWithraw(0, aliceExpiredAmount);
           await vault.connect(alice as Signer).cancelWithdraw(0, aliceExpiredAmount.div(2));
           await vault.connect(bob as Signer).initiateWithraw(1, bobExpiredAmount);
           await vault.connect(bob as Signer).cancelWithdraw(1, bobExpiredAmount.div(2));
           await vault.connect(bob as Signer).initiateWithraw(1, bobExpiredAmount.div(2));
           
          const expires2 = [{
            expiryLevel: (ethPrice * 0.95).toFixed(0),
            vaultId: 0
          }, {
            expiryLevel: (ethPrice * 0.95).toFixed(0),
            vaultId: 1
          }];
          await  vault.connect(manager as Signer).expireOptions(expires2);
 

           //trader has some value to collect for put option
           aliceState = await vault.connect(alice as Signer).getUserState(0);
           bobState = await vault.connect(bob as Signer).getUserState(0);
           
           
           assert.equal(aliceState.redeemed.toString(), aliceExpiredAmount.div(2).mul(10100).div(10000).toString());
           assert.isTrue(aliceState.onGoingAmount.eq(aliceState.redeemed));
           assert.isTrue(aliceState.expiredQueuedRedeemAmount.eq(0));
           assert.isTrue(aliceState.expiredAmount.eq(0));
           assert.isTrue(aliceState.onGoingQueuedRedeemAmount.eq(0));


           const optionHolderValue2 = BigNumber.from(selling2[1].strike).sub(BigNumber.from(expires2[1].expiryLevel)).
           mul(bobExpiredAmount).div(BigNumber.from(selling2[1].strike));
           const remaining2 = bobExpiredAmount.mul(BigNumber.from(10150)).div(10000).sub(optionHolderValue2);

           assert.equal(bobState.redeemed.toString(), remaining2.toString());
           assert.isTrue(bobState.onGoingAmount.eq(0));
           assert.isTrue(bobState.expiredQueuedRedeemAmount.eq(0));
           assert.isTrue(bobState.expiredAmount.eq(0));
           assert.isTrue(bobState.onGoingQueuedRedeemAmount.eq(0));


        });
        it("manager and trader perspective", async function () {
          await expect(vault.connect(alice as Signer).deposit(1, BigNumber.from(1000).mul(BUSDMultiplier))).to.be.revertedWith("!started");
        
            //round 1
          await vault.connect(manager as Signer).kickOffOptions([{
            vaultId: 0,
            maxCapacity: BigNumber.from(100).mul(ETHMultiplier),
            environment:2
          }, {
            vaultId: 1,
            maxCapacity: BigNumber.from(100).mul(1800).mul(BUSDMultiplier),
            environment:2
          }, {
            vaultId: 2,
            maxCapacity: BigNumber.from(10).mul(WBTCMultiplier),
            environment:2
          }, {
            vaultId: 3,
            maxCapacity: BigNumber.from(10).mul(30000).mul(BUSDMultiplier),
            environment:2
          }]);

          await vault.connect(alice as Signer).deposit(0, BigNumber.from(10).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(1, BigNumber.from(1000).mul(BUSDMultiplier));
          await vault.connect(alice as Signer).deposit(2, WBTCMultiplier);
          await vault.connect(alice as Signer).deposit(3, BigNumber.from(1000).mul(BUSDMultiplier));
        
          //round 2
          await advanceTime(60); 
        
          await vault.connect(manager as Signer).sellOptions([{
            vaultId: 0,
            strike: ethPrice * 1.1,
            premiumRate: 0.015 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.91,
            premiumRate: 0.015 * RatioMultiplier
          },{
            vaultId: 2,
            strike: btcPrice * 1.1,
            premiumRate: 0.01 * RatioMultiplier //1%
          }, {
            vaultId: 3,
            strike: btcPrice * 0.91,
            premiumRate: 0.01 * RatioMultiplier
          }]); 
          
          await vault.connect(manager as Signer).addToWhitelist([trader.address, carol.address]);
          const whitelistedTraders = await vault.whitelistTraders();
          assert.equal(whitelistedTraders.length, 2);
          assert.equal(whitelistedTraders[0], trader.address)
          assert.equal(whitelistedTraders[1], carol.address)
          
          await expect(vault.connect(bob as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("!whitelisted");
          const vaultStates = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId)));
          const premiums = vaultStates.map(v=> v.onGoing.amount.mul(v.onGoing.premiumRate).div(RatioMultiplier));
          const oldBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(trader.address)));
          await vault.connect(trader as Signer).buyOptions([0,1,2,3]);
          await expect(vault.connect(carol as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("Already sold");
          const newBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(trader.address)));
          const combined1 = reduceBalances(premiums, newBalances, [0,1,2,3]);
          const combined2 = reduceBalances(premiums, oldBalances, [0,1,2,3]);
          for(let key in combined1) {
            const calculation = combined1[key];
            const calculation2 = combined2[key];
            assert.equal(calculation.balance.add(calculation.calculation).toString(), calculation2.balance.toString());
          }
          for(let i = 0; i < 4; i++) {
            assert.equal(vaultStates[i].currentRound, 2);
          }
          await vault.connect(bob as Signer).deposit(2, BigNumber.from(1).mul(WBTCMultiplier));

          //round 3
          await advanceTime(60);
          const expiries = [{
            expiryLevel: ethPrice * 0.85,
            vaultId: 0
          }, {
            expiryLevel: ethPrice * 0.85,
            vaultId: 1
          }, {
            expiryLevel: btcPrice * 0.88,
            vaultId: 2
          }, {
            expiryLevel: btcPrice * 0.88,
            vaultId: 3
          }];

          await expect(vault.connect(trader as Signer).buyOptions([0])).to.be.revertedWith("Expiry level not specified yet");
          await expect(vault.connect(trader as Signer).buyOptions([2])).to.be.revertedWith("Expiry level not specified yet");
          const vaultStates2 = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId))); 
          //we need to expire previous first, market is dropping down greatly, all the put option invester would lose
          await vault.connect(manager as Signer).expireOptions(expiries);

          const carolOldBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(carol.address)));
          await vault.connect(carol as Signer).collectOptionHolderValues();
          const carolNewBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(carol.address)));
          for(let i = 0; i < carolOldBalances.length; i++) {
            assert.equal(carolOldBalances[i].toString(), carolNewBalances[i].toString());
          }

          const busdOldBalance = await busd.balanceOf(trader.address);
          const collectables = await vault.connect(trader as Signer).optionHolderValues(); 
          await vault.connect(trader as Signer).collectOptionHolderValues(); 
          
          assert.equal(collectables.length, 1);
          assert.equal(collectables[0].asset, busd.address);
          const collectables2 = await vault.connect(trader as Signer).optionHolderValues();
          assert.equal(collectables2.length, 0);

          const busdNewBalance = await busd.balanceOf(trader.address);
          let totalCollectableCalculated= BigNumber.from(0);
          for(let i = 1; i < 4; i=i+2) {
              const callOrPut = vaultDefinitions[i].callOrPut;
              const expiryLevel = expiries[i].expiryLevel;
              const strike = vaultStates2[i].expired.strike.toNumber();
              const diff = callOrPut ? (expiryLevel > strike ? expiryLevel - strike: 0) : 
                           (strike > expiryLevel ? strike - expiryLevel : 0);
              const calculated = vaultStates2[i].expired.amount.mul(diff).div(callOrPut ? expiryLevel : strike); 
              totalCollectableCalculated = totalCollectableCalculated.add(calculated);
              assert.isTrue(calculated.gt(0));
          } 
          assert.equal(collectables[0].amount.toString(), totalCollectableCalculated.toString());
          assert.equal(busdOldBalance.add(collectables[0].amount).toString(), busdNewBalance.toString());
  
          
          await vault.connect(manager as Signer).sellOptions([{
            vaultId: 0,
            strike: ethPrice * 1,
            premiumRate: 0.015 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.85,
            premiumRate: 0.015 * RatioMultiplier
          },{
            vaultId: 2,
            strike: btcPrice * 1.02,
            premiumRate: 0.01 * RatioMultiplier //1%
          }, {
            vaultId: 3,
            strike: btcPrice * 0.88,
            premiumRate: 0.01 * RatioMultiplier
          }]);
          await vault.connect(manager as Signer).removeFromWhitelist([trader.address]);
          const whitelistedTraders2 = await vault.whitelistTraders();
          assert.equal(whitelistedTraders2.length, 1); 
          assert.equal(whitelistedTraders2[0], carol.address)
          
          await expect(vault.connect(trader as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("!whitelisted");

          await vault.connect(carol as Signer).buyOptions([0,1,2,3]);
          //round 4
          await advanceTime(60);
          const expiries2 = [{
            expiryLevel: ethPrice * 1.02,
            vaultId: 0
          }, {
            expiryLevel: ethPrice * 1.02,
            vaultId: 1
          }, {
            expiryLevel: btcPrice * 1.05,
            vaultId: 2
          }, {
            expiryLevel: btcPrice * 1.05,
            vaultId: 3
          }];
          await advanceBlock();
          const vaultStates3 = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId)));

          //market is going up greatly, all the call option invester would lose
          await vault.connect(manager as Signer).expireOptions(expiries2);
          
          const collectables3 = await vault.connect(carol as Signer).optionHolderValues();
           
          const oldBalances2 = [await eth.balanceOf(carol.address), 
            await wbtc.balanceOf(carol.address)];
          assert.equal(collectables3.length, 2);
          assert.equal(collectables3[0].asset, eth.address);
          assert.equal(collectables3[1].asset, wbtc.address);
          await vault.connect(carol as Signer).collectOptionHolderValues();
           
          const newBalances2 = [await eth.balanceOf(carol.address), 
            await wbtc.balanceOf(carol.address)];
          for(let i = 0; i < 2; i++) {
              const callOrPut = vaultDefinitions[i*2].callOrPut;
              const expiryLevel = expiries2[i*2].expiryLevel;
              const strike = vaultStates3[i*2].expired.strike.toNumber();
              const diff = callOrPut ? (expiryLevel > strike ? expiryLevel - strike: 0) : 
                           (strike > expiryLevel ? strike - expiryLevel : 0);
              const calculated = vaultStates3[i*2].expired.amount.mul(diff).div(callOrPut ? expiryLevel: strike); 
              assert.isTrue(calculated.gt(0));
              assert.equal(collectables3[i].amount.toString(), calculated.toString());
              
              assert.equal(oldBalances2[i].add(calculated).toString(), newBalances2[i].toString());
          } 
  
          const ethState = await vault.getVaultState(0);
          const currentTVL = ethState.totalPending.add(ethState.onGoing.amount).add(ethState.expired.amount).sub(ethState.expired.queuedRedeemAmount);
          assert.isTrue(currentTVL.gt(0)); 
          await expect(vault.connect(manager as Signer).setCapacities([{
            vaultId: 0,
            maxCapacity: currentTVL.sub(1)
          }])).to.be.revertedWith("Max Cap less than tvl");
          await vault.connect(manager as Signer).setCapacities([{
            vaultId: 0,
            maxCapacity: currentTVL.add(100)
          }]);
   
          await vault.connect(manager as Signer).sellOptions([{
            vaultId: 0,
            strike: ethPrice * 1,
            premiumRate: 0.015 * RatioMultiplier //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.85,
            premiumRate: 0.015 * RatioMultiplier
          },{
            vaultId: 2,
            strike: btcPrice * 1.02,
            premiumRate: 0.01 * RatioMultiplier //1%
          }, {
            vaultId: 3,
            strike: btcPrice * 0.88,
            premiumRate: 0.01 * RatioMultiplier
          }]); 

          await vault.connect(carol as Signer).buyOptions([0,1,2,3]);
          await advanceTime(60);
          await advanceBlock();   
          await advanceTime(60);
          await advanceBlock();   
          await advanceTime(60);
          await advanceBlock();   

          const history = await vault.connect(trader as Signer).expiredHistory();
          for(let item of history) { 
            const vaultDefinition = vaultDefinitions[item.vaultId];
            const assetAmountDecimals = vaultDefinition.assetAmountDecimals;
            console.log(`vaultId: ${vaultDefinition.name}, round: ${item.round}, amount: ${ethers.utils.formatUnits(item.amount, assetAmountDecimals)}, 
            strike: ${item.strike.toNumber()/StrikeMultiplier}, expiryLevel: ${item.expiryLevel.toNumber() / StrikeMultiplier},  
            premimum: ${item.premiumRate.toNumber() / RatioMultiplier}, optionHolderValue ${ethers.utils.formatUnits(item.optionHolderValue, assetAmountDecimals)}`)
          }
          const history2 = await vault.connect(carol as Signer).expiredHistory();
          for(let item of history2) { 
            const vaultDefinition = vaultDefinitions[item.vaultId];
            const assetAmountDecimals = vaultDefinition.assetAmountDecimals;
            console.log(`vaultId: ${vaultDefinition.name}, round: ${item.round}, amount: ${ethers.utils.formatUnits(item.amount, assetAmountDecimals)}, 
            strike: ${item.strike.toNumber()/StrikeMultiplier}, expiryLevel: ${item.expiryLevel.toNumber() / StrikeMultiplier},  
            premimum: ${item.premiumRate.toNumber() / RatioMultiplier}, optionHolderValue ${ethers.utils.formatUnits(item.optionHolderValue, assetAmountDecimals)}`)
          }
        });


      /* it("new upgrader perspecitve", async function () {          
          const proxyAddress = vault.address;  
          await upgrades.admin.changeProxyAdmin(proxyAddress, admin.address); 
           let optionVaultV2 = await ethers.getContractFactory("SingleDirectionOptionV2Upgradeable", {
            signer: admin as Signer,
            libraries: {
              OptionLifecycle: optionLifecycleAddress
            },
          }) as ContractFactory;
          console.log("Upgrading SingleDirectionOption");
          let v2 = await upgrades.upgradeProxy(proxyAddress, optionVaultV2, { 
            unsafeAllow: ['delegatecall'], 
            unsafeAllowLinkedLibraries: true, 
           }) as SingleDirectionOptionV2Upgradeable; 

          console.log("New v2 implement proxy Address " + v2.address);
           const vaultDefinition = await v2.vaultDefinitions(0);
           assert.equal(vaultDefinition.asset, vaultDefinitions[0].asset);
           await expect(v2.connect(manager as Signer).clearBidding()).to.be.revertedWith("Nothing to bid");

          console.log("SingleDirectionOption upgraded successfully");
        }) */

        it("hacker perspective", async function () { 
          const notOwner = "Ownable: caller is not the owner";
          const notManager = "!manager";
          const notWhitelisted = "!whitelisted";
          await expect(vault.connect(alice as Signer).addVaults([{
            vaultId:0,
            assetAmountDecimals: 8,
            asset: BSC_ETH_ADDRESS,
            underlying: BSC_ETH_ADDRESS,
            callOrPut: true
          }])).to.be.revertedWith(notOwner);  
          await expect(vault.connect(alice as Signer).setManager(alice.address)).to.be.revertedWith(notOwner);   
          
          await expect(vault.connect(alice as Signer).addToWhitelist([alice.address, bob.address])).to.be.revertedWith(notManager);  
          await expect(vault.connect(alice as Signer).removeFromWhitelist([alice.address, bob.address])).to.be.revertedWith(notManager);
          
          await expect(vault.connect(alice as Signer).kickOffOptions([{vaultId:0, maxCapacity: 100, environment: 2}])).to.be.revertedWith(notManager); 
          await expect(vault.connect(alice as Signer).sellOptions([{
            strike:"1600",
            premiumRate: "1",
            vaultId: 0
          }])).to.be.revertedWith(notManager);
          await expect(vault.connect(alice as Signer).expireOptions([])).to.be.revertedWith(notManager);

          await expect(vault.connect(alice as Signer).buyOptions([0])).to.be.revertedWith(notWhitelisted);
          await expect(vault.connect(alice as Signer).collectOptionHolderValues()).to.be.revertedWith(notWhitelisted);

          await vault.connect(owner as Signer).transferOwnership(alice.address);
          await expect(vault.connect(owner as Signer).setManager(alice.address)).to.be.revertedWith(notOwner);  
          await vault.connect(alice as Signer).setManager(bob.address);
          await vault.connect(bob as Signer).addToWhitelist([alice.address, carol.address]); 
          await vault.connect(bob as Signer).removeFromWhitelist([alice.address]); 
          await vault.connect(alice as Signer).transferOwnership(deployer.address);
          await vault.connect(deployer as Signer).setManager(manager.address);
          await expect(vault.connect(bob as Signer).addToWhitelist([alice.address])).to.be.revertedWith(notManager);  

        });
      });
        
      async function printState(vault: SingleDirectionOptionUpgradeable, vaultId:number, ...signers: Signer[]) { 
        const vaultDefinition = await vault.vaultDefinitions(vaultId);
        const decimals = vaultDefinition.assetAmountDecimals;
        const vaultState = await vault.getVaultState(vaultId);
        console.log(`Round ${vaultState.currentRound}`);
        console.log(`\tpending: ${ethers.utils.formatUnits(vaultState.totalPending, decimals)}, redeemed: ${ethers.utils.formatUnits(vaultState.totalRedeemed, decimals)}, 
        onGoing/onGoingQueueedRedeem: ${ethers.utils.formatUnits(vaultState.onGoing.amount)}/${ethers.utils.formatUnits(vaultState.onGoing.queuedRedeemAmount)},  
        expired/expiredQueueedRedeem: ${ethers.utils.formatUnits(vaultState.expired.amount)}/${ethers.utils.formatUnits(vaultState.expired.queuedRedeemAmount)}`)
        for(let signer of signers) {

          const userState = await vault.connect(signer).getUserState(vaultId);
          console.log(`\t${await signer.getAddress()}: pending: ${ethers.utils.formatUnits(userState.pending, decimals)}, redeemed: ${ethers.utils.formatUnits(userState.redeemed, decimals)}, 
          onGoing/onGoingQueueedRedeem: ${ethers.utils.formatUnits(userState.onGoingAmount)}/${ethers.utils.formatUnits(userState.onGoingQueuedRedeemAmount)},  
          expired/expiredQueueedRedeem: ${ethers.utils.formatUnits(userState.expiredAmount)}/${ethers.utils.formatUnits(userState.expiredQueuedRedeemAmount)}`)
        } 
      }
      function reduceBalances(calculations:BigNumber[], balances:BigNumber[], vaultIds:number[]){
        let newCalculatedBalance: {[key:string]: {
          calculation: BigNumber,
          balance:BigNumber}
        } = {};
        for(let i = 0; i < vaultIds.length; i ++) {
          const vault = vaultDefinitions[vaultIds[i]];
          let calculated = newCalculatedBalance[vault.asset];
          if (!calculated) {
            calculated = {
              calculation: BigNumber.from(0),
              balance: BigNumber.from(0)
            };
            newCalculatedBalance[vault.asset] = calculated;
          }
          calculated.calculation = calculated.calculation.add(calculations[i]);
          calculated.balance = balances[i];
        }
        return newCalculatedBalance;
      } 

  });

  
