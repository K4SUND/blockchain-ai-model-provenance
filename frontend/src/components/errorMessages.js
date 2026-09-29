import { Interface } from "ethers";
import registryArtifact from "../contracts/ModelRegistry.json";
import { MODEL_REGISTRY_NOT_CONFIGURED } from "../services/modelRegistry.js";

/**
 * Turns wallet, network, and contract errors into messages that tell the
 * user what happened and what to do next. Components show only these
 * messages; the raw error is still logged by the caller for debugging.
 */

const registryInterface = new Interface(registryArtifact.abi);

// One entry per custom error in ModelRegistry.sol and OpenZeppelin AccessControl.
const CONTRACT_ERRORS = {
  AccessControlUnauthorizedAccount:
    "This wallet is not an authorized publisher. Switch to a publisher account in MetaMask.",
  NotPublisherOrAdministrator:
    "Only the wallet that registered this version, or an administrator, can revoke it.",
  ModelAlreadyExists:
    "This model name and version is already registered. Records can't be overwritten, so use a new version number.",
  ModelAlreadyRevoked: "This version has already been revoked.",
  ModelNotFound: "No record exists for this model name and version.",
  InvalidModelName: "The model name can't be empty.",
  InvalidVersion: "The version can't be empty.",
  InvalidModelHash: "The model hash is invalid.",
  InvalidProvenanceHash: "The provenance hash is invalid.",
  InvalidRevocationReason: "Enter a reason for the revocation.",
};

/** True when the user closed or rejected the MetaMask request. */
export function isUserRejection(err) {
  return (
    err?.code === "ACTION_REJECTED" ||
    err?.code === 4001 ||
    err?.info?.error?.code === 4001 ||
    err?.error?.code === 4001
  );
}

/**
 * Finds the contract's custom-error name. ethers usually decodes it into
 * err.revert, but MetaMask sometimes nests the raw revert data instead.
 */
function findRevertName(err) {
  if (err?.revert?.name) return err.revert.name;

  const candidates = [
    err?.data,
    err?.info?.error?.data,
    err?.info?.error?.data?.data,
    err?.error?.data,
    err?.error?.data?.data,
  ];

  for (const data of candidates) {
    if (typeof data !== "string" || !data.startsWith("0x") || data.length < 10) {
      continue;
    }
    try {
      const parsed = registryInterface.parseError(data);
      if (parsed) return parsed.name;
    } catch {
      // Not one of this contract's errors; try the next candidate.
    }
  }
  return null;
}

export function describeError(err, fallback = "Something went wrong. Please try again.") {
  if (isUserRejection(err)) {
    return "You cancelled the request in MetaMask. Nothing was changed.";
  }

  const revertName = findRevertName(err);
  if (revertName && CONTRACT_ERRORS[revertName]) {
    return CONTRACT_ERRORS[revertName];
  }

  const text = `${err?.shortMessage ?? ""} ${err?.message ?? ""}`;

  if (text.includes(MODEL_REGISTRY_NOT_CONFIGURED)) {
    return "The registry contract isn't deployed yet. Run npm run deploy:local, then reload this page.";
  }
  if (err?.code === "BAD_DATA" && err?.value === "0x") {
    return "No registry contract was found at the configured address. Check that MetaMask is on Hardhat Local. If the local blockchain was restarted, run npm run deploy:local and reload.";
  }
  if (/nonce/i.test(text)) {
    return "MetaMask's transaction history is out of date, which usually happens after restarting the local blockchain. In MetaMask, open Settings → Advanced → Clear activity tab data, then try again.";
  }
  if (/no browser wallet/i.test(text)) {
    return err.message;
  }
  if (err?.code === "NETWORK_ERROR" || /could not detect network|failed to fetch/i.test(text)) {
    return "Can't reach the blockchain. Check that the local node (npm run node) is running and MetaMask is on Hardhat Local.";
  }

  return err?.shortMessage || err?.reason || err?.message || fallback;
}
