import assert from "node:assert/strict";
import test from "node:test";

import { Interface } from "ethers";

import {
  formatRegistryError,
  userFacingError,
} from "./registryError.js";

const errors = new Interface([
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error ModelAlreadyExists(bytes32 modelId)",
  "error ModelAlreadyRevoked(bytes32 modelId)",
  "error ModelNotFound(bytes32 modelId)",
  "error NotPublisherOrAdministrator(address caller)",
]);

const address = "0x0000000000000000000000000000000000000001";
const value = `0x${"01".repeat(32)}`;

test("formats an unauthorized publisher error", () => {
  const data = errors.encodeErrorResult(
    "AccessControlUnauthorizedAccount",
    [address, value]
  );

  assert.equal(
    formatRegistryError({ data }),
    "Connected wallet is not an authorized publisher. Switch to the ModelGuard Publisher account and try again."
  );
});

test("decodes custom errors nested by a wallet provider", () => {
  const data = errors.encodeErrorResult("ModelAlreadyExists", [value]);

  assert.equal(
    formatRegistryError({ info: { error: { data } } }),
    "This model name and version is already registered. Existing records cannot be overwritten; use a new version."
  );
});

test("formats unauthorized revocation", () => {
  const data = errors.encodeErrorResult(
    "NotPublisherOrAdministrator",
    [address]
  );

  assert.equal(
    formatRegistryError({ error: { data: { data } } }),
    "Connected wallet cannot revoke this model. Switch to the original publisher or administrator account."
  );
});

test("formats repeated revocation", () => {
  const data = errors.encodeErrorResult("ModelAlreadyRevoked", [value]);

  assert.equal(
    formatRegistryError({ data }),
    "This model version has already been revoked. Revocation is permanent."
  );
});

test("formats a missing record", () => {
  const data = errors.encodeErrorResult("ModelNotFound", [value]);

  assert.equal(
    formatRegistryError({ data }),
    "No blockchain record exists for this model name and version."
  );
});

test("formats wallet rejection without exposing provider text", () => {
  assert.equal(
    formatRegistryError({ code: 4001, message: "raw provider message" }),
    "Transaction was rejected in MetaMask. No blockchain change was made."
  );
});

test("formats wrong-network read failures", () => {
  assert.equal(
    formatRegistryError({ code: "BAD_DATA" }),
    "ModelGuard cannot read the registry on this network. Switch MetaMask to Hardhat Local (chain ID 31337) and confirm the current local contract is deployed."
  );
});

test("preserves explicit safe user messages", () => {
  assert.equal(
    formatRegistryError(userFacingError("Safe message")),
    "Safe message"
  );
});

test("does not display an unknown raw provider error", () => {
  assert.equal(
    formatRegistryError(
      { message: "execution reverted (unknown custom error)" },
      "Friendly fallback"
    ),
    "Friendly fallback"
  );
});

