const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying PKKT Token contracts with the account:",
    deployer.address
  );
  //Deploy pkkt Token
  const PKKTToken = await ethers.getContractFactory("PKKTToken");
  const pkktToken = await PKKTToken.deploy("100000000000000000000000000");
  console.log("Address of pkkt Token", pkktToken.address);
  await pkktToken.deployed();
  //Deploy pkkt Farm
  console.log("Deploy PKKT Farm contracts with the account:", deployer.address);
  const PKKTFarm = await ethers.getContractFactory("PKKTFarm");
  const farm = await PKKTFarm.deploy(
    pkktToken.address,
    "10000000000000000000",
    "0"
  );
  console.log("Address of pkkt Farm: ", farm.address);
  await farm.deployed();
  //add  minter role for farm
  if ((await pkktToken.isMinter(farm.address)) == false) {
    console.log("Add minter role for farm");
    await (
      await pkktToken
        .connect(deployer)
        .addMinter(farm.address, "1000000000000000000000000")
    ).wait();
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
