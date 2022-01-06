// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol"; 
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/IPKKTStructureOption.sol";  
import "./OptionVault.sol";

contract PKKTHodlBoosterOption is OptionVault, IPKKTStructureOption {
    
    using SafeERC20 for IERC20; 
    using StructureData for StructureData.UserState;
    using StructureData for uint128; 
     
     mapping(uint8=>address[]) private usersInvolved;  
     mapping(uint8=>mapping(address=>StructureData.UserState)) private userStates;  
     mapping(uint8=>StructureData.OptionData) private optionData;
     
     //private data for complete withdrawal and redeposit 
     //mapping(uint8=>mapping(address=>uint128)) private releasedDepositAssetAmount;
     //mapping(uint8=>mapping(address=>uint128)) private releasedCounterPartyAssetAmount;  
     
    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    constructor( address _settler, StructureData.OptionPairDefinition[] memory _optionPairDefinitions) OptionVault(_settler) {  
        addOptionPairs(_optionPairDefinitions);
    }

    function validateOptionById(uint8 _optionId) private {  
        require(_optionId != 0 && _optionId <= optionPairCount*2 , "!optionId"); 
    }
 

    function getAccountBalance(uint8 _optionId) external view override returns (StructureData.UserBalance memory) {
  
       StructureData.UserState storage userState = userStates[_optionId][msg.sender];  

       StructureData.UserBalance memory result = StructureData.UserBalance({
           pendingDepositAssetAmount:userState.pendingAsset,
           releasedDepositAssetAmount: userState.releasedDepositAssetAmount,
           releasedCounterPartyAssetAmount: userState.releasedCounterPartyAssetAmount,
           lockedDepositAssetAmount:0,
           terminatingDepositAssetAmount: 0,
           toTerminateDepositAssetAmount: 0
       });
       if (underSettlement) {  
           if (currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex 
                uint16 premium = optionStates[_optionId][currentRound - 2].premiumRate;
                result.lockedDepositAssetAmount = userState.deriveVirtualLocked(premium);
                result.terminatingDepositAssetAmount = userState.assetToTerminate.withPremium(premium);
                result.toTerminateDepositAssetAmount = userState.assetToTerminateForNextRound;
          }
           else { 
                result.lockedDepositAssetAmount = userState.tempLocked;               
                result.toTerminateDepositAssetAmount = userState.assetToTerminateForNextRound;
           }
       }
       else {
           result.lockedDepositAssetAmount = userState.ongoingAsset;
           result.toTerminateDepositAssetAmount = userState.assetToTerminate;
       }
       return result;
    }

    function getWithdrawable(uint8 _optionId, address _asset) internal override view returns(uint128) {
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];  
       //require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "!asset");
       if ((_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)) { 
            return optionStates[_optionId][currentRound].totalAmount.add(optionData[_optionId].totalReleasedDepositAssetAmount);
        }
        else {
            return  optionData[_optionId].totalReleasedCounterPartyAssetAmount;
        }  
    }

    function getOptionSnapShot(uint8 _optionId) external override view returns(StructureData.OptionSnapshot memory) { 
       StructureData.OptionState storage currentOption = optionStates[_optionId][currentRound]; 
       StructureData.OptionState memory lockedOption;
       StructureData.OptionState memory onGoingOption;
       StructureData.OptionData storage data = optionData[_optionId];
       StructureData.OptionSnapshot memory result = StructureData.OptionSnapshot({
            totalPending: currentOption.totalAmount,
            totalReleasedDeposit :  data.totalReleasedDepositAssetAmount,
            totalReleasedCounterParty : data.totalReleasedCounterPartyAssetAmount,
            totalLocked : 0,
            totalTerminating : 0,
            totalToTerminate: 0
       }); 
       if (underSettlement) { 
           lockedOption = optionStates[_optionId][currentRound - 1];
            result.totalToTerminate = data.assetToTerminateForNextRound;
           if (currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex
              onGoingOption = optionStates[_optionId][currentRound - 2];
              result.totalTerminating = onGoingOption.totalTerminate.withPremium(onGoingOption.premiumRate); 
              result.totalLocked = lockedOption.totalAmount.add( 
                onGoingOption.totalAmount.withPremium(onGoingOption.premiumRate)).sub(result.totalTerminating);
           }
           else {
               result.totalLocked = lockedOption.totalAmount;  
           }
       }
       else if (currentRound > 1) {
           onGoingOption = optionStates[_optionId][currentRound - 1];
           result.totalLocked = onGoingOption.totalAmount;
           result.totalToTerminate = onGoingOption.totalTerminate;
       }
       return result;
    }

    /*function completeWithdraw(uint8 _optionId, uint256 _amount, address _asset) external override validateOptionById(_optionId) nonReentrant { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");  
       StructureData.OptionPairDefinition memory pair = optionPairs[(_optionId - 1)/2];
       require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "Invalid asset");
       if ((_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)) { 
           releasedDepositAssetAmount[_optionId][msg.sender] = releasedDepositAssetAmount[_optionId][msg.sender].sub(_amount); 
           totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].sub(_amount);
       }
       else { 
           releasedCounterPartyAssetAmount[_optionId][msg.sender] = releasedCounterPartyAssetAmount[_optionId][msg.sender].sub(_amount);
           totalReleasedCounterPartyAssetAmount[_optionId] = totalReleasedCounterPartyAssetAmount[_optionId].sub(_amount);
       }
       
       clientWithdraw(msg.sender, _amount, _asset, false);
    }*/


    function initiateWithraw(uint8 _optionId, uint128 _assetToTerminate) external override {
        //require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        //require(currentRound > 1, "No on going"); 
        validateOptionById(_optionId);
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender];  
        if (underSettlement) {  
            uint128 newAssetToTerminate = userState.assetToTerminateForNextRound + _assetToTerminate; 
            if (currentRound == 2) {
                require(newAssetToTerminate <=  userState.tempLocked, "Exceeds"); 
                StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);  
            }
            else {
                StructureData.OptionState storage onGoingOption = optionStates[_optionId][currentRound - 2];
                uint128 totalLocked = userState.deriveVirtualLocked(onGoingOption.premiumRate); 
                require(newAssetToTerminate <=  totalLocked, "Exceeds");   
                //store temporarily
                optionData[_optionId].assetToTerminateForNextRound = optionData[_optionId].assetToTerminateForNextRound
                .add(_assetToTerminate); 
            } 
            userState.assetToTerminateForNextRound = newAssetToTerminate;
        }
        else {
            uint128 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate);
            require(newAssetToTerminate <=  userState.ongoingAsset, "Exceeds");
            userState.assetToTerminate = newAssetToTerminate;
            StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);
        }

    }

    function cancelWithdraw(uint8 _optionId, uint128 _assetToTerminate) external override  { 
        //require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        //require(currentRound > 1, "No on going");
        validateOptionById(_optionId);
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender]; 
        if (underSettlement) {  
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound - _assetToTerminate; 
            if (currentRound == 2) {  
                optionStates[_optionId][currentRound - 1].totalTerminate = optionStates[_optionId][currentRound - 1].totalTerminate.sub(_assetToTerminate);  
            }
            else { 
                //store temporarily
                optionData[_optionId].assetToTerminateForNextRound = optionData[_optionId].assetToTerminateForNextRound.sub(_assetToTerminate); 
            }  
        }
        else {  
            userState.assetToTerminate = userState.assetToTerminate.sub( _assetToTerminate); 
            StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);
        }

    } 
    
    
    /*function maxInitiateWithdraw(uint8 _optionId) external override  validateOptionById(_optionId){  
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender]; 
        
        if (underSettlement) {    
            if (currentRound == 2) { 
                uint256 diff = userState.tempLocked.sub(userState.assetToTerminateForNextRound); 
                if (diff > 0) { 
                    userState.assetToTerminateForNextRound = userState.tempLocked; 
                    StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                    previousOption.totalTerminate = previousOption.totalTerminate.add(diff);  
                    //console.log("maxInitiateWithdraw %s %d %d", name(), previousOption.round,  previousOption.totalTerminate);
                }
            }
            else {
                StructureData.OptionState storage onGoingOption = optionStates[_optionId][currentRound - 2];
                uint256 totalLocked = userState.deriveVirtualLocked(onGoingOption.premiumRate); 
                uint256 diff = totalLocked.sub(userState.assetToTerminateForNextRound);
                if (diff > 0) { 
                    userState.assetToTerminateForNextRound = totalLocked;
                    //store temporarily
                    assetToTerminateForNextRound[_optionId] = assetToTerminateForNextRound[_optionId].add(diff);  
                }
            } 
        }
        else {    
            uint256 onGoing = userState.ongoingAsset;
            uint256 diff = onGoing.sub(userState.assetToTerminate);
            if (diff > 0) { 
                userState.assetToTerminate = onGoing; 
                StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(diff);  
            }
        }
 
    }

    function maxCancelWithdraw(uint8 _optionId) external override validateOptionById(_optionId){   
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender];  
        if (underSettlement) {   
            if (currentRound == 2) {  
                StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.sub(userState.assetToTerminateForNextRound);   
            }
            else { 
                //store temporarily
                assetToTerminateForNextRound[_optionId] = assetToTerminateForNextRound[_optionId].sub(userState.assetToTerminateForNextRound);  
            }  
            userState.assetToTerminateForNextRound = 0;
        }
        else {   
            StructureData.OptionState storage onGoingOption = optionStates[_optionId][currentRound - 1];
            onGoingOption.totalTerminate = onGoingOption.totalTerminate.sub(userState.assetToTerminate);
            userState.assetToTerminate = 0; 
        } 
    }
    */
    
    function withdraw(uint8 _optionId, uint128 _amount, address _asset) external override  { 
       //require(_amount > 0, "!amount");   
       
        validateOptionById(_optionId);
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       //require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "!asset");
       
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender]; 
       if ((_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)) {
           //todo: 0 out released amount if missing balance from trader
           uint128 releasedAmount = userState.releasedDepositAssetAmount;
           if (releasedAmount <= _amount) {  
               uint128 redeemAmount = _amount.sub(releasedAmount);
               userState.pendingAsset = userState.pendingAsset.sub(redeemAmount);
               userState.releasedDepositAssetAmount = 0; 
               optionData[_optionId].totalReleasedDepositAssetAmount = optionData[_optionId].totalReleasedDepositAssetAmount.sub(releasedAmount);
               StructureData.OptionState storage optionState = optionStates[_optionId][currentRound];
               optionState.totalAmount = optionState.totalAmount.sub(redeemAmount);  
           }
           else { 
               userState.releasedDepositAssetAmount = releasedAmount.sub(_amount); 
               optionData[_optionId].totalReleasedDepositAssetAmount = optionData[_optionId].totalReleasedDepositAssetAmount.sub(_amount);
           }
       }
       else {
 
           //same result as completeWithdraw  
           userState.releasedCounterPartyAssetAmount = userState.releasedCounterPartyAssetAmount.sub(_amount);
           optionData[_optionId].totalReleasedCounterPartyAssetAmount = optionData[_optionId].totalReleasedCounterPartyAssetAmount.sub( _amount);
       }
       clientWithdraw(msg.sender, _amount, _asset, false);
        emit Withdraw(_optionId, msg.sender, _asset, _amount);
    }
 

    //only allowed for re-depositing the matured deposit asset, the max can be deducted from getMatured() with asset matched depositAsset in address
    /*function redeposit(uint8 _optionId, uint256 _amount) external override validateOptionById(_optionId) nonReentrant { 
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount");  
       releasedDepositAssetAmount[_optionId][msg.sender] = releasedDepositAssetAmount[_optionId][msg.sender].sub(_amount);
       totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].sub(_amount);
       _depositFor(_optionId, msg.sender, _amount, currentRound, 0);
    }*/

  
    //only allowed for re-depositing the matured counterParty asset, the max can be deducted from getMatured() with asset matched counterPartyAsset in address
    /*function redepositToCounterParty(uint8 _optionId, uint256 _amount) external override validateOptionById(_optionId) { 
       require(!underSettlement, "Being settled");
       require(currentRound > 1, "!No Matured");
       require(_amount > 0, "!amount");  
       releasedCounterPartyAssetAmount[_optionId][msg.sender] = releasedCounterPartyAssetAmount[_optionId][msg.sender].sub(_amount);
       totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].sub(_amount); 

       _depositFor(getCounterPartyOptionId(_optionId), msg.sender, _amount, currentRound, 0); 
    }*/

    /*function getCounterPartyOptionId(uint8 _optionId) private pure returns(uint8) {
       return _optionId % 2 == 1 ? (_optionId + 1) : (_optionId - 1);
    }*/
 
    //deposit eth
    function depositETH(uint8 _optionId) external override payable  { 
       //require(currentRound > 0, "!Started"); 
       require(msg.value > 0, "!value"); 
       
       validateOptionById(_optionId);
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset;
       require(depositAsset == address(0), "!ETH");

        //todo: convert to weth  
       _depositFor(_optionId, msg.sender, uint128(msg.value), currentRound, 0);
       //payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _optionId, uint128 _amount) external override{   
        //require(currentRound > 0, "!Started"); 
        require(_amount > 0, "!amount"); 
        validateOptionById(_optionId);
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
        address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset; 
        require(depositAsset != address(0), "ETH");
        _depositFor(_optionId, msg.sender, _amount,currentRound, 0);  
        IERC20(depositAsset).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
  
    function _depositFor(uint8 _optionId, address _userAddress, uint128 _amount, uint16 _round, uint128 _toTerminate) private { 
        StructureData.OptionState storage optionState = optionStates[_optionId][_round];
        //require(optionState.totalAmount + (_amount) <= quota[_optionId], "Not enough quota");
        StructureData.UserState storage userState =  userStates[_optionId][_userAddress]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved[_optionId].push(_userAddress);
        } 
        if (_round != currentRound) { 
            userState.tempLocked = userState.tempLocked.add(_amount); 
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.add(_toTerminate);
            optionData[_optionId].assetToTerminateForNextRound = optionData[_optionId].assetToTerminateForNextRound.add(_toTerminate);
        }
        else { 
            userState.pendingAsset = userState.pendingAsset.add(_amount); 
        }
        optionState.totalAmount = optionState.totalAmount.add(_amount);
        
        emit Deposit(_optionId, _userAddress, _round, _amount);
    }

 
    /*function redeem(uint8 _optionId, uint256 _amount) external override validateOptionById(_optionId) nonReentrant{  
         require(_amount > 0, "!amount"); 
         StructureData.UserState storage userState =  userStates[_optionId][msg.sender];  
         userState.pendingAsset = userState.pendingAsset.sub(_amount); 
         
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
         address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset;
         StructureData.OptionState storage optionState = optionStates[_optionId][currentRound];
         optionState.totalAmount = optionState.totalAmount.sub(_amount);
         clientWithdraw(msg.sender, _amount, depositAsset, true); 
         emit Withdraw(_optionId, msg.sender, depositAsset, _amount);
    }*/
 
  
    //used to render the history at client side, reading the minting transactions of a specific address,
    //for each transaction, read the blockheight and call this method to get the result
    //the blockheight is the the height when the round is committed  
    //function getRoundData(uint8 _optionId, uint256 _blockHeight) external view override returns(StructureData.OptionState memory) {
    //    return optionStates[_optionId][optionHeights[_blockHeight]];
    //} 


   /*
    *  Following operations can only be triggered from ISettlementAggregator with the settler role
    */

   //first, open t+1 round
   function rollToNextByOption(uint8 _optionId) internal override returns(uint128 _pendingAmount){    
      
       //if (currentRound > 2) {
        //   require(optionStates[_optionId][currentRound-2].strikePrice > 0,  "!StrikePrice");
        //} 
   
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: currentRound,
                            totalAmount: 0,
                            totalTerminate: 0,
                            premiumRate:  0, 
                            strikePrice: 0,
                            executed: false,
                            callOrPut: optionPairs[(_optionId - 1)/2].callOptionId == _optionId
                        });
        optionStates[_optionId][currentRound] = currentOption; 
       if (currentRound > 1) {
            uint256 userCount = usersInvolved[_optionId].length;
            for (uint i=0; i < userCount; i++) { 
                StructureData.UserState storage userState = userStates[_optionId][ usersInvolved[_optionId][i]]; 
                if(userState.pendingAsset != 0) {  
                    userState.tempLocked = userState.pendingAsset;   
                }   
                userState.pendingAsset = 0;
            }
       } 
       //emit OpenOption(_optionId, currentRound); 
       return currentRound > 1 ? optionStates[_optionId][currentRound-1].totalAmount : 0;
    }
    

   //then dry run settlement and get accounting result
   function dryRunSettlementByOption(uint8 _optionId, bool _execute) internal override view returns(StructureData.SettlementAccountingResult memory _result) {
  
        StructureData.SettlementAccountingResult memory result = StructureData.SettlementAccountingResult({ 
            round: currentRound - 1,
            depositAmount: optionStates[_optionId][currentRound - 1].totalAmount,
            executed: _execute,
            autoRollAmount: 0,
            autoRollPremium: 0,
            releasedAmount: 0,
            releasedPremium: 0,
            autoRollCounterPartyAmount: 0,
            autoRollCounterPartyPremium: 0,
            releasedCounterPartyAmount: 0,
            releasedCounterPartyPremium: 0, 
            optionId: _optionId
        });
       if (currentRound > 2) { 
           
            StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
            bool isCall = pair.callOptionId == _optionId;
            StructureData.OptionState storage previousOptionState = optionStates[_optionId][currentRound - 2];
            StructureData.MaturedState memory maturedState = StructureData.calculateMaturity(_execute, previousOptionState, isCall,
            isCall ? pair.depositAssetAmountDecimals : pair.counterPartyAssetAmountDecimals, 
            isCall ? pair.counterPartyAssetAmountDecimals : pair.depositAssetAmountDecimals); 
            if (_execute) { 
                result.autoRollCounterPartyAmount = maturedState.autoRollCounterPartyAssetAmount;
                result.autoRollCounterPartyPremium = maturedState.autoRollCounterPartyAssetPremiumAmount;
                result.releasedCounterPartyAmount = maturedState.releasedCounterPartyAssetAmount;
                result.releasedCounterPartyPremium = maturedState.releasedCounterPartyAssetPremiumAmount;
            }
            else { 
                result.autoRollAmount = maturedState.autoRollDepositAssetAmount;
                result.autoRollPremium = maturedState.autoRollDepositAssetPremiumAmount;
                result.releasedAmount = maturedState.releasedDepositAssetAmount;
                result.releasedPremium = maturedState.releasedDepositAssetPremiumAmount;
            } 
       } 
       return result;
   }

   //then, make decision based on dry run result and close t-1 round
   function closePreviousByOption(uint8 _optionId, bool _execute) internal override  
   returns(StructureData.MaturedState memory _maturedState) {    
        //uint16 maturedRound = currentRound - 2;
        StructureData.OptionState storage previousOptionState = optionStates[_optionId][currentRound - 2];   
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
        bool isCall = pair.callOptionId == _optionId;
        StructureData.MaturedState memory maturedState = StructureData.calculateMaturity(_execute, previousOptionState, isCall,
            isCall ? pair.depositAssetAmountDecimals : pair.counterPartyAssetAmountDecimals, 
            isCall ? pair.counterPartyAssetAmountDecimals : pair.depositAssetAmountDecimals);     
        previousOptionState.executed = _execute;
        if (_execute) {
            optionData[_optionId].totalReleasedCounterPartyAssetAmount = optionData[_optionId].totalReleasedCounterPartyAssetAmount
            .add(maturedState.releasedCounterPartyAssetAmountWithPremium); 
        }
        else {
            optionData[_optionId].totalReleasedDepositAssetAmount= optionData[_optionId].totalReleasedDepositAssetAmount
            .add(maturedState.releasedDepositAssetAmountWithPremium);

        }
        if (previousOptionState.totalAmount > 0) { 
            
            uint256 userCount = usersInvolved[_optionId].length; 
            
            uint128 totalAutoRollBase = previousOptionState.totalAmount.sub(previousOptionState.totalTerminate);
            if (_execute) { 
                autoRollToCounterPartyByOption(userCount, totalAutoRollBase, _optionId, previousOptionState, 
                maturedState.releasedCounterPartyAssetAmountWithPremium, maturedState.autoRollCounterPartyAssetAmountWithPremium);
            }
            else { 
                autoRollByOption(userCount, totalAutoRollBase, _optionId, previousOptionState, 
                maturedState.releasedDepositAssetAmountWithPremium, maturedState.autoRollDepositAssetAmountWithPremium);
            }
        }    
        //emit CloseOption(_optionId, currentRound - 2);
        return maturedState;
   }

   //next, commit t round
   function commitCurrentByOption(uint8 _optionId) internal override {   
        
        //uint16 lockedRound = currentRound - 1;
        //StructureData.OptionState storage optionState = optionStates[_optionId][currentRound - 1];  
        //mint for the current option
        //_mint(address(this), optionState.totalAmount);
        uint256 userCount = usersInvolved[_optionId].length;
        for (uint i=0; i < userCount; i++) {
            StructureData.updateUserState(userStates[_optionId][usersInvolved[_optionId][i]]);
         }
         
        optionStates[_optionId][currentRound - 1].totalTerminate = optionStates[_optionId][currentRound - 1].totalTerminate.add(optionData[_optionId].assetToTerminateForNextRound); 
        optionData[_optionId].assetToTerminateForNextRound = 0; 
        //emit CommitOption(_optionId, currentRound - 1); 
   }
       
 
 

   function autoRollToCounterPartyByOption(uint256 _userCount, uint128 _totalAutoRollBase, uint8 _optionId, StructureData.OptionState storage _optionState, 
    uint128 _totalReleased, uint128 _totalAutoRoll) private {  
        //uint256 lockedRound = currentRound - 1;  
        uint8 counterPartyOptionId = _optionId % 2 == 1 ? (_optionId + 1) : (_optionId - 1);
        //uint256 assetToTerminateForNextRoundByOption = assetToTerminateForNextRound[_optionId];
        //debit assetToTerminateForNextRound if executed
        if (optionData[_optionId].assetToTerminateForNextRound > 0 && _totalAutoRoll > 0) { 
             optionData[_optionId].assetToTerminateForNextRound = optionData[_optionId].assetToTerminateForNextRound.subOrZero(  
             _totalAutoRollBase.withPremium(_optionState.premiumRate));

        }
        for (uint i=0; i < _userCount; i++) {
            address userAddress = usersInvolved[_optionId][i];
            StructureData.UserState storage userState = userStates[_optionId][userAddress];  
             
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            } 
            uint128 amountToTerminate = StructureData.getAmountToTerminate(_totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) {
                userState.releasedCounterPartyAssetAmount  = 
                userState.releasedCounterPartyAssetAmount.add(amountToTerminate);
            } 
            uint128 remainingAmount = StructureData.getAmountToTerminate(_totalAutoRoll, userState.ongoingAsset.sub(userState.assetToTerminate), _totalAutoRollBase);
            if (remainingAmount > 0){    
                (uint128 onGoingTerminate,) = userState.deriveWithdrawRequest(_optionState.premiumRate);
                if (onGoingTerminate != 0) {
                    uint128 virtualOnGoing =  userState.ongoingAsset.withPremium(_optionState.premiumRate);
                    onGoingTerminate = StructureData.getAmountToTerminate(remainingAmount, onGoingTerminate, virtualOnGoing);
                } 
                
                _depositFor(counterPartyOptionId, userAddress, remainingAmount, currentRound - 1, 0);
            } 
            userState.assetToTerminate = 0;
        }  
   }
 
   function autoRollByOption(uint256 _userCount, uint128 _totalAutoRollBase, uint8 _optionId, StructureData.OptionState storage _optionState, 
   uint128 _totalReleased, uint128 _totalAutoRoll) private {
        //uint256 lockedRound = currentRound - 1; 
          for (uint i=0; i < _userCount; i++) {
            address userAddress = usersInvolved[_optionId][i];
            StructureData.UserState storage userState = userStates[_optionId][userAddress];   
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            }
                
            uint128 amountToTerminate = StructureData.getAmountToTerminate(_totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) { 
                userState.releasedDepositAssetAmount  = 
                userState.releasedDepositAssetAmount.add(amountToTerminate); 
            }
            uint128 remainingAmount = StructureData.getAmountToTerminate(_totalAutoRoll, userState.ongoingAsset.sub(userState.assetToTerminate), _totalAutoRollBase);
            if (remainingAmount > 0) { 
                _depositFor(_optionId, userAddress, remainingAmount, currentRound - 1, 0);
            } 
                
            userState.assetToTerminate = 0;
        }  
   }
 
}