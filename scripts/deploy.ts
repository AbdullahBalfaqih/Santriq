import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // We will initially set the deployer as the authorized agent
  // In a production environment, this would be the address of the TEE or Flare agent
  const agentAddress = deployer.address;

  const ScamGuardian = await ethers.getContractFactory("ScamGuardian");
  const scamGuardian = await ScamGuardian.deploy(agentAddress);

  await scamGuardian.waitForDeployment();

  console.log("ScamGuardian deployed to:", await scamGuardian.getAddress());
  console.log("Authorized Agent set to:", agentAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
