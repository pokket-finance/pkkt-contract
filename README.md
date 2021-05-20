# pkkt-contracts

Smart constracts for PKKT Farming

## Deploy Factory smart contract

Project currently use hardhat for deployment. The variable should import from process.env or similar datasource:

## Plugins

PKKT Farming is currently extended with the following plugins.
Instructions on how to use them in your own application are linked below.
Plugin should import from hardhat.config.js

| Plugin               | npm                                                           |
| -------------------- | ------------------------------------------------------------- |
| hardhat-waffle       | https://www.npmjs.com/package/@nomiclabs/hardhat-waffle       |
| hardhat-etherscan    | https://www.npmjs.com/package/@nomiclabs/hardhat-etherscan    |
| hardhat-gas-reporter | https://www.npmjs.com/package/@nomiclabs/hardhat-gas-reporter |

## Deploy PKKT Factory contract

1. Import hardhat library, embed ethers, upgrades modules

```javascript
const { ethers } = require("hardhat");
```

2. Configure your revenue address before deploy

```javascript
const [deployer] = await ethers.getSigners();
```

3. Log your address of PKKT token deployment

```javascript
console.log(
  "Deploying PKKT Token contracts with the account:",
  deployer.address
);
```

4. Get PKKT Token contract factory prototype

```javascript
const PKKTToken = await ethers.getContractFactory("PKKTToken");
```

5. Deploy PKKT Token with cap = 100000000000000000000000000

```javascript
const pkktToken = await PKKTToken.deploy("100000000000000000000000000");
```

6. Log the address and wait for deploy success

```javascript
// Log the address
console.log("Address of pkkt Token", pkktToken.address);
// Wait for pkkt token factory deploy success
await pkktToken.deployed();
```

7. Log your address of PKKT farm deployment

```javascript
console.log("Deploy PKKT Farm contracts with the account:", deployer.address);
```

8. Get PKKT Farm contract factory prototype

```javascript
const PKKTFarm = await ethers.getContractFactory("PKKTFarm");
```

9. Deploy PKKT Farm with 3 arguments: pkkt token address, pkkts/block = 10, start block = 0

```javascript
const farm = await PKKTFarm.deploy(
  pkktToken.address,
  "10000000000000000000",
  "0"
);
```

10. Log the address and wait for deploy success

```javascript
// Log the address
console.log("Address of pkkt Farm: ", farm.address);
// Wait for pkkt token factory deploy success
await farm.deployed();
```

11. Add minter role for farm

```javascript
// check minter role
if ((await pkktToken.isMinter(farm.address)) == false)
  // Connect with owner and give farm minter role with allowance  = 1000000000000000000000000;
  await (
    await pkktToken
      .connect(deployer)
      .addMinter(farm.address, "1000000000000000000000000")
  ).wait();
```

## Components

- IERC20 is an interface for interactions with ERC20 tokens.

- Ownable is a standard OpenZeppelin contract for access control with an owner role.

- SafeMath is a standard OpenZeppelin library for math operations that prevents integer
  overflows.

- PKKT Token is a smart contract for creating token
- PKKTToken is Ownable, ERC20 and has following parameters:

  - uint256 private \_cap;

  - mapping (address => bool) public minters;;

  - mapping (address => uint256) public mintingAllowance;

- PKKTToken contract has following events:

  - event MinterAdded(address indexed account) - emit when minter is added;

  - event MinterRemoved(address indexed account) - emit when minter is removed;

  - event MintingAllowanceUpdated(address indexed account, uint256 oldAllowance, uint256 newAllowance) - emit
    when minting allowance of minter changes ;

- PKKTToken contract has following functions:

  - constructor - public functions that sets name, symbol, decimal, minter role of owner and cap

  - cap - public view function that returns cap - cap is a limit of the amount of token that can be minted

  - isMinter - public view function that returns minter role of address

  - burn - public function that decreases the amount of token by sending to zero address. Has
    onlyOwner modifier

  - burnFrom - public function that decreases the amount of token of the given address by sending to zero
    address for token. Has onlyOwner modifier

  - mint - public function that mints the amount of token and sends to the given address (only called minter)

  - addMinter - public function for giving the given address minter role. Has
    onlyOwner modifier

  - removeMinter - public function for removing the given address minter role. Has
    onlyOwner modifier

  - increaseMintingAllowance - public function that increases minting allowance of the given address. Has onlyOwner
    modifier

  - decreaseMintingAllowance - public function that decreases minting allowance of the given address. Has onlyOwner
    modifier

- PKKTFarm is a smart contract for the users depositing lp token from UNI or SUSHI and geting back ppkt token
  parameters.

- PKKTFarm is a smart contract for campaign management. PKKTToken is Ownable and has following parameters and structs:

  - struct UserInfo {
    uint256 amount;
    uint256 rewardDebt;
    uint pendingReward;
    }

  - struct PoolInfo {
    IERC20 lpToken;
    uint256 allocPoint;
    uint256 lastRewardBlock;
    uint256 accPKKTPerShare;
    }

  - PKKTToken public pkkt;

  - uint256 public pkktPerBlock ;

  - PoolInfo[] public poolInfo;;

  - mapping(uint256 => mapping(address => UserInfo)) public userInfo;

  - uint256 public totalAllocPoint = 0;

  - uint256 public startBlock;

  - event Deposit(address indexed user, uint256 indexed pid, uint256 amount) - emit when user deposit token;

  - event Withdraw(address indexed user, uint256 indexed pid, uint256 amount) - emit when user withdraw token ;

  - event EmergencyWithdraw(
    address indexed user,
    uint256 indexed pid,
    uint256 amount
    ); - emit when user withdraw token without caring about reward

  - event HarvestReward(
    address indexed user,
    uint256 indexed pid,
    uint256 amount
    ); - emit when user harvest reward

- PKKTFarm contract has following functions:

  - constructor - public functions that has 3 arguments: instance of pkkt token, the number of pkkt token per
    block and the start block of farming

  - poolLength - external function that returns the number of pool in farm

  - add - public function that initializes the new pool. Has onlyOwner modifier

  - set - public function that updates allocPoint of the given pool. Has onlyOwner modifier

  - timeMultiplier - public function that returns the time of farming for caculating reward

  - setPKKTPerBlock - public function that sets new ppkt token per block. Has onlyOwner modifier

  - pendingPKKT - public view function that returns the amount reward of user.

  - massUpdatePools - public function that updates the whole of pools

  - updatePool - public function that updates pool for caculating reward

  - deposit - public function that the users deposit the lp token from UNISWAP or SUSHISWAP to the pool for recieving
    reward(pkkt token)

  - withdraw - public function that the users withdraw the lp token from to the pool

  - emergencyWithdraw - public function that the users withdraws without caring about rewards. EMERGENCY ONLY

  - compoundReward - public function that the users compound reward to pkkt pool

  - harvest - public function that the users can harvest reward for farming

  - harvestAll - public function that the users can harvest reward all the pools they deposited

  - safePKKTTransfer - internal function that transfers pkkt token for safe reason

## License

MIT
