// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
 
import {Utils} from "./libraries/Utils.sol";  
import {StructureData} from "./libraries/StructureData.sol";     
import "./interfaces/IPKKTStructureOption.sol";  
import "./OptionVault.sol";

contract PKKTHodlBoosterOption is OptionVault, IPKKTStructureOption {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using StructureData for StructureData.UserState;
    using Utils for uint256;

    event Deposit(uint8 indexed optionId, address indexed account, uint256 indexed round, uint256 amount);
    event Withdraw(uint8 indexed optionId, address indexed account, address indexed asset, uint256 amount);
    event CloseOption(uint8 indexed optionId, uint256 indexed round);
    event CommitOption(uint8 indexed optionId, uint256 indexed round);
    event OpenOption(uint8 indexed optionId, uint256 indexed round);
    event OptionCreated(uint8 indexed optionId, string name);
    event OptionTransfer(uint8 indexed optionId, address indexed account, uint256 premium, uint256 round);
    
     
     mapping(uint8=>mapping(uint256=>StructureData.OptionState)) public optionStates;
     mapping(uint8=>address[]) private usersInvolved;  
     mapping(uint8=>mapping(address=>StructureData.UserState)) private userStates;  
     mapping(uint8=>uint256) public totalReleasedDepositAssetAmount; 
     mapping(uint8=>uint256) public totalReleasedCounterPartyAssetAmount; 
     
     //private data for complete withdrawal and redeposit 
     mapping(uint8=>mapping(address=>uint256)) private releasedDepositAssetAmount;
     mapping(uint8=>mapping(address=>uint256)) private releasedCounterPartyAssetAmount;  
     mapping(uint8=>uint256) private assetToTerminateForNextRound; 
     mapping(uint8=>uint256) private quota; 
     
    //take if for eth, we make price precision as 4, then underlying price can be 40000000 for 4000$
    //for shib, we make price precision as 8, then underlying price can be 4000 for 0.00004000$
    constructor( address _settler, StructureData.OptionPairDefinition[] memory _optionPairDefinitions) OptionVault(_settler) { 
        //todo: addOptionPair
        addOptionPairs(_optionPairDefinitions);
    }

    modifier validateOptionById(uint256 _optionId) {  
        require(_optionId != 0 && _optionId <= optionPairCount*2 , "!optionId");
        _;
    }
 

    function getAccountBalance(uint8 _optionId) external override view validateOptionById(_optionId) returns (StructureData.UserBalance memory) {
  
       StructureData.UserState storage userState = userStates[_optionId][msg.sender];  

       StructureData.UserBalance memory result = StructureData.UserBalance({
           pendingDepositAssetAmount:userState.pendingAsset,
           releasedDepositAssetAmount: releasedDepositAssetAmount[_optionId][msg.sender],
           releasedCounterPartyAssetAmount: releasedCounterPartyAssetAmount[_optionId][msg.sender],
           lockedDepositAssetAmount:0,
           terminatingDepositAssetAmount: 0,
           toTerminateDepositAssetAmount: 0
       });
       if (underSettlement) {  
           if (currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex 
                uint256 premium = optionStates[_optionId][currentRound - 2].premiumRate;
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

    function getWithdrawable(uint8 _optionId, address _asset) public override view validateOptionById(_optionId) returns(uint256) {
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2]; 
        //console.log("asset: %s %d", _asset, _optionId);
        //console.log("pair: %s %s", pair.depositAsset, pair.counterPartyAsset);
       require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "Invalid asset");
       if ((_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)) { 
            return optionStates[_optionId][currentRound].totalAmount.add(totalReleasedDepositAssetAmount[_optionId]);
        }
        else {
            return totalReleasedCounterPartyAssetAmount[_optionId];
        }  
    }

    function getOptionSnapShot(uint8 _optionId) external override view validateOptionById(_optionId) returns(StructureData.OptionSnapshot memory) { 
       StructureData.OptionState storage currentOption = optionStates[_optionId][currentRound]; 
       StructureData.OptionState memory lockedOption;
       StructureData.OptionState memory onGoingOption;
        
       StructureData.OptionSnapshot memory result = StructureData.OptionSnapshot({
            totalPending: currentOption.totalAmount,
            totalReleasedDeposit :  totalReleasedDepositAssetAmount[_optionId],
            totalReleasedCounterParty : totalReleasedCounterPartyAssetAmount[_optionId],
            totalLocked : 0,
            totalTerminating : 0,
            totalToTerminate: 0
       }); 
       if (underSettlement) { 
           lockedOption = optionStates[_optionId][currentRound - 1];
           if (currentRound > 2) {
              //when there are maturing round waiting for settlement, it becomes complex
              onGoingOption = optionStates[_optionId][currentRound - 2];
              result.totalToTerminate = assetToTerminateForNextRound[_optionId];
              result.totalTerminating = onGoingOption.totalTerminate.withPremium(onGoingOption.premiumRate); 
              result.totalLocked = lockedOption.totalAmount.add(
                onGoingOption.totalAmount.withPremium(onGoingOption.premiumRate)
              ).sub(result.totalTerminating);
           }
           else {
               result.totalLocked = lockedOption.totalAmount; 
               result.totalToTerminate = assetToTerminateForNextRound[_optionId];
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


    function initiateWithraw(uint8 _optionId, uint256 _assetToTerminate) external override validateOptionById(_optionId) {
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        require(currentRound > 1, "No on going"); 
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender];  
        if (underSettlement) {  
            uint256 newAssetToTerminate = userState.assetToTerminateForNextRound.add(_assetToTerminate); 
            if (currentRound == 2) {
                require(newAssetToTerminate <=  userState.tempLocked, "Exceeds available"); 
                StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);  
            }
            else {
                StructureData.OptionState storage onGoingOption = optionStates[_optionId][currentRound - 2];
                uint256 totalLocked = userState.deriveVirtualLocked(onGoingOption.premiumRate); 
                require(newAssetToTerminate <=  totalLocked, "Exceeds available");   
                //store temporarily
                assetToTerminateForNextRound[_optionId] = assetToTerminateForNextRound[_optionId].add(_assetToTerminate); 
            } 
            userState.assetToTerminateForNextRound = newAssetToTerminate;
        }
        else {
            uint256 newAssetToTerminate = userState.assetToTerminate.add(_assetToTerminate); 
            require(newAssetToTerminate <=  userState.ongoingAsset, "Exceeds available");
            userState.assetToTerminate = newAssetToTerminate;
            StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1];
            previousOption.totalTerminate = previousOption.totalTerminate.add(_assetToTerminate);
        }

    }

    function cancelWithdraw(uint8 _optionId, uint256 _assetToTerminate) external override  validateOptionById(_optionId){ 
        require(_assetToTerminate > 0 , "!_assetToTerminate"); 
        require(currentRound > 1, "No on going");
        StructureData.UserState storage userState =  userStates[_optionId][msg.sender]; 
        if (underSettlement) {  
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.sub(_assetToTerminate); 
            if (currentRound == 2) { 
                StructureData.OptionState storage previousOption = optionStates[_optionId][currentRound - 1]; 
                previousOption.totalTerminate = previousOption.totalTerminate.sub(_assetToTerminate);  
            }
            else { 
                //store temporarily
                assetToTerminateForNextRound[_optionId] = assetToTerminateForNextRound[_optionId].sub(_assetToTerminate); 
            }  
        }
        else {  
            userState.assetToTerminate = userState.assetToTerminate.sub(_assetToTerminate); 
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
    
    function withdraw(uint8 _optionId, uint256 _amount, address _asset) external override validateOptionById(_optionId) nonReentrant { 
       require(_amount > 0, "!amount");  
       require(!underSettlement, "Being settled");  
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       require(_asset == pair.depositAsset || _asset == pair.counterPartyAsset, "Invalid asset");
       if ((_optionId == pair.callOptionId && _asset == pair.depositAsset) || 
            (_optionId == pair.putOptionId && _asset == pair.counterPartyAsset)) {
           //todo: 0 out released amount if missing balance from trader
           uint256 releasedAmount = releasedDepositAssetAmount[_optionId][msg.sender];
           if (releasedAmount <= _amount) { 
               StructureData.UserState storage userState =  userStates[_optionId][msg.sender];  
               uint256 redeemAmount = _amount.sub(releasedAmount);
               userState.pendingAsset = userState.pendingAsset.sub(redeemAmount);
               releasedDepositAssetAmount[_optionId][msg.sender] = 0; 
               totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].sub(releasedAmount);
               StructureData.OptionState storage optionState = optionStates[_optionId][currentRound];
               optionState.totalAmount = optionState.totalAmount.sub(redeemAmount);  
           }
           else { 
               releasedDepositAssetAmount[_optionId][msg.sender] = releasedAmount.sub(_amount); 
               totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].sub(_amount);
           }
       }
       else {
 
           //same result as completeWithdraw  
           releasedCounterPartyAssetAmount[_optionId][msg.sender] = releasedCounterPartyAssetAmount[_optionId][msg.sender].sub(_amount);
           totalReleasedCounterPartyAssetAmount[_optionId] = totalReleasedCounterPartyAssetAmount[_optionId].sub(_amount);
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
    function depositETH(uint8 _optionId) external payable override validateOptionById(_optionId) nonReentrant{ 
       require(currentRound > 0, "!Started"); 
       require(msg.value > 0, "!value"); 
       
       StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset;
       require(depositAsset == address(0), "!ETH");

        //todo: convert to weth  
       _depositFor(_optionId, msg.sender, msg.value, currentRound, 0);
       //payable(vaultAddress()).transfer(msg.value);
    }

    //deposit other erc20 coin, take wbtc
    function deposit(uint8 _optionId, uint256 _amount) external override validateOptionById(_optionId)  nonReentrant{   
        require(currentRound > 0, "!Started"); 
        require(_amount > 0, "!amount"); 
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
       address depositAsset = pair.callOptionId == _optionId ? pair.depositAsset : pair.counterPartyAsset;
       require(depositAsset != address(0), "ETH");
        _depositFor(_optionId, msg.sender, _amount,currentRound, 0);  
        IERC20(depositAsset).safeTransferFrom(msg.sender, address(this), _amount);
    }
 
  
    function _depositFor(uint8 _optionId, address _userAddress, uint256 _amount, uint256 _round, uint256 _toTerminate) private { 
        StructureData.OptionState storage optionState = optionStates[_optionId][_round];
        require(optionState.totalAmount.add(_amount) <= quota[_optionId], "Not enough quota");
        StructureData.UserState storage userState =  userStates[_optionId][_userAddress]; 
        //first time added
        if (!userState.hasState) { 
            userState.hasState = true;
            usersInvolved[_optionId].push(_userAddress);
        } 
        if (_round != currentRound) { 
            userState.tempLocked = userState.tempLocked.add(_amount); 
            userState.assetToTerminateForNextRound = userState.assetToTerminateForNextRound.add(_toTerminate);
            assetToTerminateForNextRound[_optionId] = assetToTerminateForNextRound[_optionId].add(_toTerminate);
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
    function getRoundData(uint8 _optionId, uint256 _blockHeight) external view override validateOptionById(_optionId) returns(StructureData.OptionState memory) {
        return optionStates[_optionId][optionHeights[_blockHeight]];
    } 


   /*
    *  Following operations can only be triggered from ISettlementAggregator with the settler role
    */

   //first, open t+1 round
   function rollToNextByOption(uint8 _optionId, uint256 _quota) internal override returns(uint256 _pendingAmount){    
      
       if (currentRound > 2) {
           require(optionStates[_optionId][currentRound-1].strikePrice > 0,  "!Strike Price");
        } 
   
        quota[_optionId] = _quota; 
        StructureData.OptionState memory currentOption =  
        StructureData.OptionState({
                            round: currentRound,
                            totalAmount: 0,
                            totalTerminate: 0,
                            premiumRate:  0,
                            pricePrecision: 0,
                            strikePrice: 0,
                            executed: false,
                            callOrPut: optionPairs[(_optionId - 1)/2].callOptionId == _optionId
                        });
        optionStates[_optionId][currentRound] = currentOption; 
       if (currentRound > 1) {
            uint256 userCount = usersInvolved[_optionId].length;
            for (uint i=0; i < userCount; i++) {
                address userAddress = usersInvolved[_optionId][i];
                StructureData.UserState storage userState = userStates[_optionId][userAddress]; 
                if(userState.pendingAsset != 0) {  
                    userState.tempLocked = userState.pendingAsset;  
                    //console.log("userState.pendingAsset  %s %d" ,  userAddress, userState.pendingAsset);
                }   
                userState.pendingAsset = 0;
            }
       } 
        emit OpenOption(_optionId, currentRound); 
        if (currentRound > 1) {
            return optionStates[_optionId][currentRound-1].totalAmount;
        }
        return 0;
    }
    

   //then dry run settlement and get accounting result
   function dryRunSettlementByOption(uint8 _optionId, bool _execute) internal override view returns(StructureData.SettlementAccountingResult memory _result) {
 

        StructureData.OptionState storage lockedOption = optionStates[_optionId][currentRound - 1]; 
        StructureData.SettlementAccountingResult memory result = StructureData.SettlementAccountingResult({ 
            round: currentRound - 1,
            depositAmount: lockedOption.totalAmount,
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
        uint maturedRound = currentRound - 2;
        StructureData.OptionState storage previousOptionState = optionStates[_optionId][maturedRound];   
        StructureData.OptionPairDefinition storage pair = optionPairs[(_optionId - 1)/2];
        bool isCall = pair.callOptionId == _optionId;
        StructureData.MaturedState memory maturedState = StructureData.calculateMaturity(_execute, previousOptionState, isCall,
            isCall ? pair.depositAssetAmountDecimals : pair.counterPartyAssetAmountDecimals, 
            isCall ? pair.counterPartyAssetAmountDecimals : pair.depositAssetAmountDecimals);     
        previousOptionState.executed = _execute;
        if (_execute) {
            totalReleasedCounterPartyAssetAmount[_optionId] = totalReleasedCounterPartyAssetAmount[_optionId].
            add(maturedState.releasedCounterPartyAssetAmount).add(maturedState.releasedCounterPartyAssetPremiumAmount); 
        }
        else {
            totalReleasedDepositAssetAmount[_optionId] = totalReleasedDepositAssetAmount[_optionId].
            add(maturedState.releasedDepositAssetAmount).add(maturedState.releasedDepositAssetPremiumAmount);

        }
        if (previousOptionState.totalAmount > 0) { 
            if (_execute) { 
                autoRollToCounterPartyByOption(_optionId, previousOptionState, maturedState);
            }
            else { 
                autoRollByOption(_optionId, previousOptionState, maturedState);
            }
        }    
        emit CloseOption(_optionId, maturedRound);
        return maturedState;
   }

   //next, commit t round
   function commitCurrentByOption(uint8 _optionId) internal override {   
        
        uint256 lockedRound = currentRound - 1;
        StructureData.OptionState storage optionState = optionStates[_optionId][lockedRound];  
        //mint for the current option
        //_mint(address(this), optionState.totalAmount);
        uint256 userCount = usersInvolved[_optionId].length;
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[_optionId][i];
            StructureData.UserState storage userState = userStates[_optionId][userAddress]; 
            if (userState.assetToTerminateForNextRound != 0){ 
                userState.assetToTerminate = userState.assetToTerminateForNextRound;
                userState.assetToTerminateForNextRound = 0;
            } 
            else if (userState.assetToTerminate != 0){
                userState.assetToTerminate = 0;
            }            
            if(userState.tempLocked == 0) {  
                userState.ongoingAsset = 0;
                continue;
            } 
            //transfer each user a share of the option to trigger transfer event
            //can be used to calculate the user option selling operations
            //utilizing some web3 indexed services, take etherscan api/graphql etc.
            //_transfer(address(this), userAddress, userState.tempLocked);
            emit OptionTransfer(_optionId, userAddress, optionState.premiumRate, optionState.round);
            userState.ongoingAsset = userState.tempLocked; 
            userState.tempLocked = 0; 
         }
         
        optionState.totalTerminate = optionState.totalTerminate.add(assetToTerminateForNextRound[_optionId]); 
        assetToTerminateForNextRound[_optionId] = 0; 
        emit CommitOption(_optionId, lockedRound); 
   }
       
   //at last, specify option parameters
   function setOptionParametersByOption(StructureData.OptionParameters memory _optionParameters) internal override  {
         
        uint256 previousRound = currentRound - 1;
        StructureData.OptionState storage optionState = optionStates[_optionParameters.optionId][previousRound]; 
        require(optionState.strikePrice == 0, "Strike Price already set");
        optionState.strikePrice = _optionParameters.strikePrice;
        optionState.premiumRate = _optionParameters.premiumRate;
        optionState.pricePrecision = _optionParameters.pricePrecision;
   }

 
 

   function autoRollToCounterPartyByOption(uint8 _optionId, StructureData.OptionState storage _optionState, StructureData.MaturedState memory _maturedState) private {
        uint256 userCount = usersInvolved[_optionId].length; 
        uint256 totalAutoRollBase = _optionState.totalAmount.sub(_optionState.totalTerminate);
        //uint256 lockedRound = currentRound - 1;  
        uint256 totalReleased2 = _maturedState.releasedCounterPartyAssetAmount.add(_maturedState.releasedCounterPartyAssetPremiumAmount);
        uint256 totalAutoRoll2 = _maturedState.autoRollCounterPartyAssetAmount.add(_maturedState.autoRollCounterPartyAssetPremiumAmount);  
        uint8 counterPartyOptionId = _optionId % 2 == 1 ? (_optionId + 1) : (_optionId - 1);
        //uint256 assetToTerminateForNextRoundByOption = assetToTerminateForNextRound[_optionId];
        //debit assetToTerminateForNextRound if executed
        if (assetToTerminateForNextRound[_optionId] > 0 && totalAutoRoll2 > 0) { 
             assetToTerminateForNextRound[_optionId] = Utils.subOrZero(assetToTerminateForNextRound[_optionId],  
             totalAutoRollBase.withPremium(_optionState.premiumRate));

        }
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[_optionId][i];
            StructureData.UserState storage userState = userStates[_optionId][userAddress];  
             
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            } 
            uint256 amountToTerminate = Utils.getAmountToTerminate(totalReleased2, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) {
                releasedCounterPartyAssetAmount[_optionId][userAddress] = 
                releasedCounterPartyAssetAmount[_optionId][userAddress].add(amountToTerminate);
            } 
            uint256 remainingAmount = Utils.getAmountToTerminate(totalAutoRoll2, userState.ongoingAsset.sub(userState.assetToTerminate), totalAutoRollBase);
            if (remainingAmount > 0){    
                (uint256 onGoingTerminate,) = userState.deriveWithdrawRequest(_optionState.premiumRate);
                if (onGoingTerminate != 0) {
                    uint256 virtualOnGoing =  userState.ongoingAsset.withPremium(_optionState.premiumRate);
                    onGoingTerminate = Utils.getAmountToTerminate(remainingAmount, onGoingTerminate, virtualOnGoing);
                } 
                
                _depositFor(counterPartyOptionId, userAddress, remainingAmount, currentRound - 1, 0);
            } 
            userState.assetToTerminate = 0;
        } 
         
   }
 
   function autoRollByOption(uint8 _optionId, StructureData.OptionState storage _optionState, StructureData.MaturedState memory _maturedState) private {
        uint256 userCount = usersInvolved[_optionId].length; 
        uint256 totalAutoRollBase = _optionState.totalAmount.sub(_optionState.totalTerminate);
        //uint256 lockedRound = currentRound - 1; 
        uint256 totalReleased = _maturedState.releasedDepositAssetAmount.add(_maturedState.releasedDepositAssetPremiumAmount);
        uint256 totalAutoRoll = _maturedState.autoRollDepositAssetAmount.add(_maturedState.autoRollDepositAssetPremiumAmount);
        for (uint i=0; i < userCount; i++) {
            address userAddress = usersInvolved[_optionId][i];
            StructureData.UserState storage userState = userStates[_optionId][userAddress];  
            if (userState.ongoingAsset == 0) {
                userState.assetToTerminate = 0;
                continue;
            }
                
            uint256 amountToTerminate = Utils.getAmountToTerminate(totalReleased, userState.assetToTerminate, _optionState.totalTerminate);
            if (amountToTerminate > 0) { 
                releasedDepositAssetAmount[_optionId][userAddress] = 
                releasedDepositAssetAmount[_optionId][userAddress].add(amountToTerminate); 
            }
            uint256 remainingAmount = Utils.getAmountToTerminate(totalAutoRoll, userState.ongoingAsset.sub(userState.assetToTerminate), totalAutoRollBase);
            if (remainingAmount > 0) { 
                _depositFor(_optionId, userAddress, remainingAmount, currentRound - 1, 0);
            } 
                
            userState.assetToTerminate = 0;
        }  
   }
}