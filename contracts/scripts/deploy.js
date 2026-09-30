import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const { ethers, networkName } = await network.connect();

const [deployer] = await ethers.getSigners();
const { chainId } = await ethers.provider.getNetwork();
console.log(`Deploying DappContract to ${networkName} (chain ${chainId}) from ${deployer.address}`);

const dapp = await ethers.deployContract("DappContract", ["Hello from the EVM test chain!"]);
await dapp.waitForDeployment();
const address = await dapp.getAddress();
console.log(`DappContract deployed at ${address}`);

// Export the ABI and address so the mobile app picks them up automatically.
const root = path.dirname(fileURLToPath(import.meta.url));
const artifactPath = path.join(root, "..", "artifacts", "contracts", "DappContract.sol", "DappContract.json");
const { abi } = JSON.parse(await readFile(artifactPath, "utf8"));

const outDir = path.join(root, "..", "..", "mobile", "src", "models", "contracts");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "DappContract.abi.json"), JSON.stringify(abi, null, 2) + "\n");

const addressesPath = path.join(outDir, "addresses.json");
let addresses = {};
try {
  addresses = JSON.parse(await readFile(addressesPath, "utf8"));
} catch {
  // first deployment
}
addresses[chainId.toString()] = address;
await writeFile(addressesPath, JSON.stringify(addresses, null, 2) + "\n");
console.log(`Wrote ABI and address to ${path.relative(process.cwd(), outDir)}`);
