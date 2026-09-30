// /**
//  * Contract-integration boundary.
//  *
//  * TODO(FE-02): Build providers and contract instances here rather than inside
//  * UI components. Read-only calls should use a Provider; transactions require a
//  * Signer obtained after an explicit wallet connection.
//  *
//  * Planned exports:
//  * - connectWallet()
//  * - getReadOnlyRegistry()
//  * - getWritableRegistry()
//  * - registerModel(input)
//  * - getModel(name, version)
//  * - revokeModel(name, version, reason)
//  */

// export const MODEL_REGISTRY_NOT_CONFIGURED =
//   "ModelRegistry deployment has not been configured yet.";

import { BrowserProvider, Contract } from "ethers";
import modelRegistryArtifact from "../contracts/ModelRegistry.json";
import { userFacingError } from "../utils/registryError.js";

export const MODEL_REGISTRY_NOT_CONFIGURED =
  "ModelRegistry deployment has not been configured yet.";

export const CONFIG = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 31337),
  rpcUrl: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
};

// -----------------------------------------------------------------------------
// Deployment
// -----------------------------------------------------------------------------

async function getDeployment() {
  try {
    const modules = import.meta.glob(
      "../contracts/deployment.json",
      { eager: true, import: "default" }
    );

    const deployment = Object.values(modules)[0];

    if (!deployment?.address) {
      return null;
    }

    return deployment;
  } catch {
    return null;
  }
}

export async function getRegistryAddress() {
  const deployment = await getDeployment();

  if (!deployment?.address) {
    throw new Error(MODEL_REGISTRY_NOT_CONFIGURED);
  }

  return deployment.address;
}

// -----------------------------------------------------------------------------
// Wallet
// -----------------------------------------------------------------------------

export function hasWallet() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.ethereum)
  );
}

export async function connectWallet() {
  if (!hasWallet()) {
    throw new Error(
      "No browser wallet detected. Install MetaMask and enable it for this site."
    );
  }

  const provider = new BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
  };
}

// -----------------------------------------------------------------------------
// Providers / Contract instances
// -----------------------------------------------------------------------------

export async function getReadOnlyRegistry() {
  if (!hasWallet()) {
    throw userFacingError(
      "MetaMask was not detected. Install or enable the extension in this browser, then refresh the page."
    );
  }

  const address = await getRegistryAddress();

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== CONFIG.chainId) {
    throw userFacingError(
      `Wrong network. Switch MetaMask to Hardhat Local (chain ID ${CONFIG.chainId}).`
    );
  }

  return new Contract(
    address,
    modelRegistryArtifact.abi,
    provider
  );
}

export async function getWritableRegistry() {
  const { signer, chainId } = await connectWallet();

  if (chainId !== CONFIG.chainId) {
    throw userFacingError(
      `Wrong network. Switch MetaMask to Hardhat Local (chain ID ${CONFIG.chainId}).`
    );
  }

  const address = await getRegistryAddress();

  return new Contract(
    address,
    modelRegistryArtifact.abi,
    signer
  );
}

// -----------------------------------------------------------------------------
// Network
// -----------------------------------------------------------------------------

export async function switchToConfiguredNetwork() {
  if (!hasWallet()) {
    throw new Error(
      "No browser wallet detected. Install MetaMask."
    );
  }

  const hexId = "0x" + CONFIG.chainId.toString(16);

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexId }],
    });
  } catch (err) {
    // Network has not been added to MetaMask.
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hexId,
            chainName: "Hardhat Local",
            rpcUrls: [CONFIG.rpcUrl],
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

// -----------------------------------------------------------------------------
// Read operations
// -----------------------------------------------------------------------------

export async function modelExists(modelName, version) {
  const registry = await getReadOnlyRegistry();

  return await registry.modelExists(
    modelName,
    version
  );
}

export async function getModel(modelName, version) {
  const registry = await getReadOnlyRegistry();

  return await registry.getModel(
    modelName,
    version
  );
}

// -----------------------------------------------------------------------------
// Write operations
// -----------------------------------------------------------------------------

export async function registerModel({
  modelName,
  version,
  modelHash,
  provenanceHash,
  metadataURI,
}) {
  const registry = await getWritableRegistry();
  const publisherRole = await registry.PUBLISHER_ROLE();
  const signerAddress = await registry.runner.getAddress();

  if (!(await registry.hasRole(publisherRole, signerAddress))) {
    throw userFacingError(
      "Connected wallet is not an authorized publisher. Switch to the ModelGuard Publisher account and try again."
    );
  }

  const tx = await registry.registerModel(
    modelName,
    version,
    modelHash,
    provenanceHash,
    metadataURI
  );

  return tx;
}

export async function revokeModel(
  modelName,
  version,
  reason
) {
  const registry = await getWritableRegistry();

  const tx = await registry.revokeModel(
    modelName,
    version,
    reason
  );

  return tx;
}

// -----------------------------------------------------------------------------
// Roles
// -----------------------------------------------------------------------------

export async function hasRole(role, account) {
  const registry = await getReadOnlyRegistry();

  return await registry.hasRole(
    role,
    account
  );
}
