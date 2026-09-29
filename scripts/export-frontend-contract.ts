import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import hre from "hardhat";

/**
 * Exports the ModelRegistry ABI and deployed address for the frontend (DEP-03).
 *
 * Usage (after deploying with Ignition):
 *
 *   npm run export:frontend
 *
 * or, for another network:
 *
 *   npx hardhat run --network <name> scripts/export-frontend-contract.ts
 *
 * Writes:
 * - frontend/src/contracts/ModelRegistry.json — contract name and ABI;
 * - frontend/src/contracts/deployment.json — chain ID, address, deployment
 *   transaction/block, and block timestamp.
 *
 * The address is read from Ignition's deployment record for the connected
 * chain and checked against the live node, so a stale address (for example
 * after restarting `hardhat node` without redeploying) is rejected instead of
 * being handed to the frontend.
 */

const CONTRACT_NAME = "ModelRegistry";
const FUTURE_ID = "ModelRegistryModule#ModelRegistry";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "frontend", "src", "contracts");

interface JournalConfirm {
  type: string;
  futureId: string;
  hash: string;
  receipt: { blockNumber: number; contractAddress?: string };
}

async function readJson<T>(file: string, missingHint: string): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`${path.relative(rootDir, file)} not found. ${missingHint}`);
    }
    throw error;
  }
}

/** Finds the confirmed deployment transaction for the registry in Ignition's journal. */
async function readDeploymentReceipt(deploymentDir: string): Promise<JournalConfirm> {
  const journal = await readFile(path.join(deploymentDir, "journal.jsonl"), "utf8");
  const confirm = journal
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as JournalConfirm)
    .filter(
      (entry) => entry.type === "TRANSACTION_CONFIRM" && entry.futureId === FUTURE_ID,
    )
    .at(-1);

  if (confirm === undefined) {
    throw new Error(`No confirmed ${FUTURE_ID} transaction found in the Ignition journal.`);
  }
  return confirm;
}

async function main() {
  const { ethers, networkName } = await hre.network.connect();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deploymentDir = path.join(rootDir, "ignition", "deployments", `chain-${chainId}`);

  const addresses = await readJson<Record<string, string>>(
    path.join(deploymentDir, "deployed_addresses.json"),
    `Deploy the contract to chain ${chainId} first (npm run deploy:local).`,
  );
  const address = addresses[FUTURE_ID];
  if (address === undefined) {
    throw new Error(`${FUTURE_ID} is not recorded in the chain-${chainId} deployment.`);
  }

  if ((await ethers.provider.getCode(address)) === "0x") {
    throw new Error(
      `No contract code at ${address} on network "${networkName}" (chain ${chainId}). ` +
        "The node was probably restarted; run npm run deploy:local again.",
    );
  }

  const receipt = await readDeploymentReceipt(deploymentDir);
  const block = await ethers.provider.getBlock(receipt.receipt.blockNumber);
  const artifact = await hre.artifacts.readArtifact(CONTRACT_NAME);

  const abiFile = { contractName: CONTRACT_NAME, abi: artifact.abi };
  const deploymentFile = {
    chainId,
    contractName: CONTRACT_NAME,
    address,
    transactionHash: receipt.hash,
    blockNumber: receipt.receipt.blockNumber,
    deployedAt:
      block === null ? null : new Date(block.timestamp * 1000).toISOString(),
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, `${CONTRACT_NAME}.json`),
    `${JSON.stringify(abiFile, null, 2)}\n`,
  );
  await writeFile(
    path.join(outputDir, "deployment.json"),
    `${JSON.stringify(deploymentFile, null, 2)}\n`,
  );

  console.log(`Exported ${CONTRACT_NAME} for chain ${chainId} at ${address}`);
  console.log(`  ${path.relative(rootDir, path.join(outputDir, `${CONTRACT_NAME}.json`))}`);
  console.log(`  ${path.relative(rootDir, path.join(outputDir, "deployment.json"))}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
