/**
 * Client-side checks that mirror ModelRegistry.sol so users see a clear
 * message before a transaction is attempted. The contract still enforces
 * every rule; these checks only improve feedback.
 */

// Semantic Versioning 2.0.0 (https://semver.org), without a leading "v".
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export const MAX_NAME_LENGTH = 64;
export const MAX_REASON_LENGTH = 280;

export function validateModelName(value) {
  const name = value.trim();
  if (!name) return "Enter the model name, for example DemoClassifier.";
  if (name.length > MAX_NAME_LENGTH) {
    return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return "";
}

export function validateVersion(value) {
  const version = value.trim();
  if (!version) return "Enter the version, for example 1.0.0.";
  if (!SEMVER.test(version)) {
    return "Use semantic versioning such as 1.0.0 or 1.1.0-beta (no leading v).";
  }
  return "";
}

/**
 * Looking up a record needs only a non-empty version: records registered
 * before SemVer was enforced (for example "1.0") must stay findable.
 */
export function validateLookupVersion(value) {
  const version = value.trim();
  if (!version) return "Enter the version exactly as it was registered.";
  if (version.length > MAX_NAME_LENGTH) {
    return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return "";
}

export function validateFile(file, label) {
  if (!file) return `Choose the ${label}.`;
  if (file.size === 0) return `The selected ${label} is empty.`;
  return "";
}

export function validateManifest(file) {
  const error = validateFile(file, "provenance manifest");
  if (error) return error;
  if (!file.name.toLowerCase().endsWith(".json")) {
    return "The provenance manifest must be a .json file.";
  }
  return "";
}

export function validateMetadataUri(value) {
  const uri = value.trim();
  if (!uri) return "";
  if (!/^(https?|ipfs):\/\/\S+$/i.test(uri)) {
    return "Use an address starting with https://, http://, or ipfs://, or leave it empty.";
  }
  return "";
}

export function validateReason(value) {
  const reason = value.trim();
  if (!reason) return "Explain why this version is being revoked.";
  if (reason.length > MAX_REASON_LENGTH) {
    return `Use ${MAX_REASON_LENGTH} characters or fewer.`;
  }
  return "";
}

/** Returns true when an errors object contains at least one message. */
export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

/**
 * Moves keyboard focus to the first invalid control so keyboard and
 * screen-reader users land on the problem after submitting.
 */
export function focusFirstInvalid(form) {
  form?.querySelector('[aria-invalid="true"]')?.focus();
}
