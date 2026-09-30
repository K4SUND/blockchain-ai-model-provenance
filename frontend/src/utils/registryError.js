import { Interface } from "ethers";

/**
 * Error fragments are kept here so errors can still be decoded when a wallet
 * provider wraps the revert bytes and ethers cannot associate them with the
 * contract call automatically.
 */
const registryErrorInterface = new Interface([
  "error AccessControlBadConfirmation()",
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error InvalidAdministrator()",
  "error InvalidModelHash()",
  "error InvalidModelName()",
  "error InvalidProvenanceHash()",
  "error InvalidRevocationReason()",
  "error InvalidVersion()",
  "error ModelAlreadyExists(bytes32 modelId)",
  "error ModelAlreadyRevoked(bytes32 modelId)",
  "error ModelNotFound(bytes32 modelId)",
  "error NotPublisherOrAdministrator(address caller)",
]);

const CUSTOM_ERROR_MESSAGES = Object.freeze({
  AccessControlBadConfirmation:
    "The requested role operation was not confirmed by the correct wallet.",
  AccessControlUnauthorizedAccount:
    "Connected wallet is not an authorized publisher. Switch to the ModelGuard Publisher account and try again.",
  InvalidAdministrator:
    "The configured administrator address is invalid.",
  InvalidModelHash:
    "The calculated model fingerprint is invalid. Select the model file again.",
  InvalidModelName:
    "Model name is required.",
  InvalidProvenanceHash:
    "The calculated provenance fingerprint is invalid. Select the manifest again.",
  InvalidRevocationReason:
    "A non-empty revocation reason is required.",
  InvalidVersion:
    "Model version is required.",
  ModelAlreadyExists:
    "This model name and version is already registered. Existing records cannot be overwritten; use a new version.",
  ModelAlreadyRevoked:
    "This model version has already been revoked. Revocation is permanent.",
  ModelNotFound:
    "No blockchain record exists for this model name and version.",
  NotPublisherOrAdministrator:
    "Connected wallet cannot revoke this model. Switch to the original publisher or administrator account.",
});

const NESTED_ERROR_KEYS = [
  "data",
  "error",
  "info",
  "cause",
  "revert",
  "result",
  "originalError",
];

function isHexData(value) {
  return (
    typeof value === "string" &&
    /^0x[0-9a-fA-F]+$/.test(value) &&
    value.length >= 10 &&
    (value.length - 2) % 2 === 0
  );
}

/** Collect likely revert data without assuming one wallet-provider shape. */
function collectRevertData(root) {
  const results = [];
  const seen = new Set();
  const queue = [{ value: root, depth: 0 }];

  while (queue.length > 0) {
    const { value, depth } = queue.shift();

    if (isHexData(value)) {
      results.push(value);
      continue;
    }

    if (
      value === null ||
      typeof value !== "object" ||
      seen.has(value) ||
      depth >= 6
    ) {
      continue;
    }

    seen.add(value);

    for (const key of NESTED_ERROR_KEYS) {
      if (key in value) {
        queue.push({ value: value[key], depth: depth + 1 });
      }
    }
  }

  return results;
}

function findKnownErrorName(error) {
  const directNames = [
    error?.revert?.name,
    error?.errorName,
    error?.info?.errorName,
  ];

  for (const name of directNames) {
    if (name in CUSTOM_ERROR_MESSAGES) {
      return name;
    }
  }

  for (const data of collectRevertData(error)) {
    try {
      const decoded = registryErrorInterface.parseError(data);

      if (decoded?.name in CUSTOM_ERROR_MESSAGES) {
        return decoded.name;
      }
    } catch {
      // The hex string may be transaction calldata rather than revert data.
    }
  }

  return null;
}

function collectErrorValues(root, keyName) {
  const values = [];
  const seen = new Set();
  const queue = [{ value: root, depth: 0 }];

  while (queue.length > 0) {
    const { value, depth } = queue.shift();

    if (
      value === null ||
      typeof value !== "object" ||
      seen.has(value) ||
      depth >= 6
    ) {
      continue;
    }

    seen.add(value);

    if (keyName in value) {
      values.push(value[keyName]);
    }

    for (const key of NESTED_ERROR_KEYS) {
      if (key in value && typeof value[key] === "object") {
        queue.push({ value: value[key], depth: depth + 1 });
      }
    }
  }

  return values;
}

function findMessage(error) {
  return collectErrorValues(error, "message").find(
    (message) => typeof message === "string" && message.trim() !== ""
  );
}

function hasCode(error, ...codes) {
  return collectErrorValues(error, "code").some((code) =>
    codes.includes(code)
  );
}

/**
 * Converts wallet, ethers, RPC, and Solidity errors into stable UI text.
 * Raw provider messages are intentionally not shown to end users.
 */
export function formatRegistryError(
  error,
  fallback = "The blockchain request failed. Check the wallet, network, and model details, then try again."
) {
  if (typeof error?.userMessage === "string") {
    return error.userMessage;
  }

  const customErrorName = findKnownErrorName(error);

  if (customErrorName) {
    return CUSTOM_ERROR_MESSAGES[customErrorName];
  }

  if (hasCode(error, 4001, "ACTION_REJECTED")) {
    return "Transaction was rejected in MetaMask. No blockchain change was made.";
  }

  if (hasCode(error, "INSUFFICIENT_FUNDS")) {
    return "The connected wallet does not have enough local test ETH for this transaction.";
  }

  const message = findMessage(error) || "";

  if (/no browser wallet detected|install metamask/i.test(message)) {
    return "MetaMask was not detected. Install or enable the extension in this browser, then refresh the page.";
  }

  if (/deployment has not been configured/i.test(message)) {
    return "ModelRegistry is not configured. Deploy it with npm run deploy:local, then restart the frontend.";
  }

  if (
    hasCode(error, "NETWORK_ERROR", "BAD_DATA") ||
    /wrong network|chain id|could not decode result data|network changed/i.test(
      message
    )
  ) {
    return "ModelGuard cannot read the registry on this network. Switch MetaMask to Hardhat Local (chain ID 31337) and confirm the current local contract is deployed.";
  }

  if (
    /failed to fetch|connection refused|could not coalesce|missing response/i.test(
      message
    )
  ) {
    return "ModelGuard cannot reach the local blockchain. Confirm npm run node is still running at http://127.0.0.1:8545.";
  }

  return fallback;
}

/** Create an error whose safe text survives wallet/provider wrapping. */
export function userFacingError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

