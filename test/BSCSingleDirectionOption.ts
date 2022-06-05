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
import { advanceTime } from "./utilities/timer";
   
const BUSDMultiplier = BigNumber.from(10).pow(BUSD_DECIMALS);
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);
const PricePrecision = 4;
const RatioMultipler = 10000; //precision xx.xx%
const ETHBUSDOPTIONPAIR = 0;
const WBTCBUSDOPTIONPAIR = 1;
const StrikePriceDecimals = 4;

const ethPrice = 1800 * (10 ** PricePrecision);
const btcPrice = 30000 * (10 ** PricePrecision);

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
          await wbtc.connect(alice as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(bob as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(carol as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));

          await busd.connect(alice as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(bob as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(carol as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));

          
          await eth.connect(alice as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(bob as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(carol as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier)); 

        });

        afterEach(async function () {
        });


        it("end user perspective", async function () { 
        });
        it("manager and trader perspective", async function () {
          await expect(vault.connect(alice as Signer).deposit(1, 1000 * 10 ** BUSD_DECIMALS)).to.be.revertedWith("!Started");
          //round 1
          await vault.connect(manager as Signer).kickOffOptions([{
            vaultId: 0,
            maxCapacity: 100,
            environment:2
          }, {
            vaultId: 1,
            maxCapacity: 100* 1800 * 10 * BUSD_DECIMALS,
            environment:2
          }, {
            vaultId: 2,
            maxCapacity: 10,
            environment:2
          }, {
            vaultId: 3,
            maxCapacity: 10 * 30000 * 10 ** BUSD_DECIMALS,
            environment:2
          }]);

          await vault.connect(alice as Signer).deposit(0, 10 * 10 ** ETH_DECIMALS);
          await vault.connect(alice as Signer).deposit(1, 1000 * 10 ** BUSD_DECIMALS);
          await vault.connect(alice as Signer).deposit(2, 10 * 10 ** WBTC_DECIMALS);
          await vault.connect(alice as Signer).deposit(3, 1000 * 10 ** BUSD_DECIMALS);
          //round 2
          await advanceTime(60);

          await vault.connect(manager as Signer).sellOptions([{
            vaultId: 0,
            strike: ethPrice * 1.1,
            premiumRate: 0.015 * 10000 //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.91,
            premiumRate: 0.015 * 10000
          },{
            vaultId: 2,
            strike: btcPrice * 1.1,
            premiumRate: 0.01 * 10000 //1%
          }, {
            vaultId: 3,
            strike: btcPrice * 0.91,
            premiumRate: 0.01 * 10000
          }]);
          await vault.connect(manager as Signer).addToWhitelist([trader.address, carol.address]);
          
          await expect(vault.connect(bob as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("!whitelisted");
          const vaultStates = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId)));
          const premiums = vaultStates.map(v=> v.onGoing.amount.mul(v.onGoing.premiumRate).div(10000));
          const oldBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(trader.address)));
          await vault.connect(trader as Signer).buyOptions([0,1,2,3]);
          await expect(vault.connect(carol as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("Already sold");
          const newBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(trader.address)));
          for(let i = 0; i < newBalances.length; i++) {
            assert.equal(newBalances[i].add(premiums[i]).toString(), oldBalances[i].toString());
            assert.equal(vaultStates[i].currentRound, 2);
          }

          //round 3
          await advanceTime(60);
          const expiries = [{
            expiryLevel: ethPrice * 0.95,
            vaultId: 0
          }, {
            expiryLevel: ethPrice * 0.95,
            vaultId: 1
          }, {
            expiryLevel: btcPrice * 0.98,
            vaultId: 2
          }, {
            expiryLevel: btcPrice * 0.98,
            vaultId: 3
          }];

          
          await vault.connect(bob as Signer).deposit(2, 10 * 10 ** WBTC_DECIMALS);
          await expect(vault.connect(trader as Signer).buyOptions([0])).to.be.revertedWith("Nothing to sell");
          await expect(vault.connect(trader as Signer).buyOptions([2])).to.be.revertedWith("Expiry level not specified yet");

          //we need to expire previous first, market is dropping down
          await vault.connect(manager as Signer).expireOptions(expiries);

          const carolOldBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(carol.address)));
          await vault.connect(carol as Signer).collectOptionHolderValues();
          const carolNewBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(carol.address)));
          for(let i = 0; i < carolOldBalances.length; i++) {
            assert.equal(carolOldBalances[i].toString(), carolNewBalances[i].toString());
          }



          const vaultStates2 = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId)));
          const collectables = await vault.connect(trader as Signer).optionHolderValues();
          await vault.connect(trader as Signer).collectOptionHolderValues();

          const traderNewBalances = await Promise.all(vaultDefinitions.map(v=> contracts[v.asset].balanceOf(trader.address)));
          const collectables2 = await vault.connect(trader as Signer).optionHolderValues();
          for(let i = 0; i < traderNewBalances.length; i++) {
              const collectable = collectables[i].amount;
              assert.equal(traderNewBalances[i].add(collectable).toString(), newBalances[i].toString());
              const callOrPut = vaultDefinitions[i].callOrPut;
              const expiryLevel = expiries[i].expiryLevel;
              const strike = vaultStates2[i].expired.strike.toNumber();
              const diff = callOrPut ? (expiryLevel > strike ? expiryLevel - strike: 0) : 
                           (strike > expiryLevel ? strike - expiryLevel : 0);
              const calculated = vaultStates2[i].expired.amount.mul(diff).div(expiryLevel);
              assert.equal(calculated.toString(), collectable.toString());
              assert.isTrue(collectable.gt(0));
              assert.equal(collectables2[i].amount.toString(), "0");
              assert.equal(vaultStates2[i].currentRound, 3);
          }

          const expiries2 = [{
            vaultId: 0,
            strike: ethPrice * 1,
            premiumRate: 0.015 * 10000 //1%
          }, {
            vaultId: 1,
            strike: ethPrice * 0.85,
            premiumRate: 0.015 * 10000
          },{
            vaultId: 2,
            strike: btcPrice * 1.02,
            premiumRate: 0.01 * 10000 //1%
          }, {
            vaultId: 3,
            strike: btcPrice * 0.88,
            premiumRate: 0.01 * 10000
          }];
          
          await vault.connect(manager as Signer).sellOptions(expiries2);
          await vault.connect(manager as Signer).removeFromWhitelist([trader.address]);
          
          await expect(vault.connect(trader as Signer).buyOptions([0,1,2,3])).to.be.revertedWith("!whitelisted");

          //round 4
          await advanceTime(60);

          const vaultStates3 = await Promise.all(vaultDefinitions.map(v=>vault.getVaultState(v.vaultId)));

        });


        it("new upgrader perspecitve", async function () {          
          const proxyAddress = vault.address;  
          await upgrades.admin.changeProxyAdmin(proxyAddress, admin.address);
          /*
          let optionVaultV2 = await ethers.getContractFactory("SingleDirectionOptionV2Upgradeable", { 
            libraries: {
              OptionLifecycle: optionLifecycleAddress
            },
          }) as ContractFactory; 
           await expect(function(){
            upgrades.upgradeProxy(proxyAddress, optionVaultV2, { 
              unsafeAllow: ['delegatecall'], 
              unsafeAllowLinkedLibraries: true, 
             })
           }).to.throw(); */
 
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
        })
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
        

  });

  
