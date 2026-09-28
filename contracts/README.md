# ModelRegistry smart contract

This document explains the completed smart-contract work in `ModelRegistry.sol`. It is intended to make the code easy to review before the test, deployment, and frontend integrations are completed.

## What the contract does

The contract stores a permanent blockchain record for each registered model version. The model file and provenance document remain off-chain. Only their SHA-256 hashes and small release metadata are stored in the contract.

The contract supports:

1. authorized publisher management through OpenZeppelin `AccessControl`;
2. registration of unique model name/version pairs;
3. retrieval of complete registration records;
4. existence checks for active and revoked records; and
5. permanent revocation by the original publisher or an administrator.

## Roles

| Role | Permission |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Grants or removes publisher roles and may perform emergency revocation |
| `PUBLISHER_ROLE` | Registers new model versions |
| Original record publisher | May revoke its own registered version |
| Ordinary address | May read records and check whether they exist |

The deployment constructor grants both administrator and publisher roles to `initialAdmin`. A zero administrator address is rejected.

## Model record

Every release stores:

| Field | Meaning |
|---|---|
| `modelName` | Human-readable model family name |
| `version` | Release version, preferably semantic versioning such as `1.0.0` |
| `modelHash` | SHA-256 hash of the exact model file bytes |
| `provenanceHash` | SHA-256 hash of the provenance JSON file |
| `metadataURI` | Optional public metadata location |
| `publisher` | Wallet that registered the release |
| `registeredAt` | Blockchain timestamp of registration |
| `revoked` | Whether the release has been withdrawn |
| `revocationReason` | Permanent public explanation for revocation |

## How a record is identified

The contract creates a fixed-size model ID from the exact model name and version:

```solidity
keccak256(abi.encode(modelName, version))
```

`abi.encode` is deliberately used instead of `abi.encodePacked` so two variable-length strings cannot produce an ambiguous concatenation.

Names and versions are case-sensitive. For example, `DemoModel` and `demomodel` are different names. The frontend should keep naming consistent rather than silently changing user input.

## Registration flow

`registerModel` performs the following operations:

1. OpenZeppelin verifies that the caller has `PUBLISHER_ROLE`.
2. The contract rejects an empty model name or version.
3. It rejects zero model and provenance hashes.
4. It computes the model ID.
5. It rejects an existing name/version pair.
6. It stores the record with the caller and current block timestamp.
7. It emits `ModelRegistered`.

An existing record cannot be overwritten. A new release must use a new version.

## Lookup flow

`getModel` calculates the ID from a name and version and returns the complete record. It reverts with `ModelNotFound` when no record exists, preventing an empty struct from being mistaken for a valid model.

`modelExists` returns `true` for active and revoked records. Revocation changes trust status but does not erase history.

## Revocation flow

`revokeModel` performs these checks in order:

1. the record exists;
2. it has not already been revoked;
3. the caller is the original publisher or an administrator; and
4. the public revocation reason is not empty.

It then marks the record as revoked, stores the reason, and emits `ModelRevoked`.

Revocation is permanent. There is intentionally no un-revoke or delete function because restoring or deleting a withdrawn record would weaken the audit trail. A corrected model should be published under a new version.

The original publisher may revoke its record even if its `PUBLISHER_ROLE` was removed later. This is safe for the current scope because revocation can only reduce trust; it cannot change hashes, restore a version, or create a new release.

## Public functions

| Function | Transaction? | Access |
|---|---:|---|
| `computeModelId(name, version)` | No | Everyone |
| `registerModel(...)` | Yes | `PUBLISHER_ROLE` |
| `getModel(name, version)` | No | Everyone |
| `modelExists(name, version)` | No | Everyone |
| `revokeModel(name, version, reason)` | Yes | Original publisher or administrator |
| `grantRole(...)` / `revokeRole(...)` | Yes | Role administrator, provided by OpenZeppelin |

Read-only calls do not require gas when called normally through an RPC provider. Registration, revocation, and role changes require signed transactions.

## Custom errors

The contract uses custom errors instead of long revert strings:

- `InvalidAdministrator`
- `InvalidModelName`
- `InvalidVersion`
- `InvalidModelHash`
- `InvalidProvenanceHash`
- `InvalidRevocationReason`
- `ModelAlreadyExists`
- `ModelNotFound`
- `ModelAlreadyRevoked`
- `NotPublisherOrAdministrator`

Unauthorized publisher-role operations use OpenZeppelin's `AccessControlUnauthorizedAccount` error.

## Events

`ModelRegistered` records the indexed model ID and publisher plus the main release information.

`ModelRevoked` records the indexed model ID, the address that performed the revocation, and its reason.

The frontend or an external indexer can use these events to build a version history without storing an additional on-chain array.

## Security decisions

- Model and provenance files are never stored on-chain.
- The contract stores client-calculated hashes but does not claim to inspect the files.
- A record can be created only by an authorized publisher.
- Registered name/version pairs cannot be overwritten.
- Revoked records cannot be deleted or restored.
- An empty revocation reason is rejected to preserve a useful audit trail.
- `metadataURI` is optional and must be treated as untrusted content by the frontend.
- No enumeration array is maintained, avoiding unnecessary storage and gas costs.
- The contract proves registration and integrity relative to a publisher; it does not prove model quality, accuracy, fairness, or publisher honesty.

## Work completed

| Work-plan item | Result |
|---|---|
| `SC-01` | Storage, roles, errors, events, permissions, and interface reviewed |
| `SC-02` | Registration implemented with validation and overwrite prevention |
| `SC-03` | Permanent publisher/admin revocation implemented |
| `SC-04` | Record lookup and existence checks implemented |
| `SC-05` | Kasun's NatSpec and security-review pass completed; Ninada's independent review remains |

## Handoff notes

### For contract tests

Tests should cover successful calls and every custom error, OpenZeppelin authorization failures, event arguments, two different versions, publisher revocation, administrator revocation, revoked-record lookup, and duplicate rejection.

### For frontend integration

The frontend must:

- use SHA-256 and send its 32-byte hexadecimal output as `bytes32`;
- use exactly the same name/version strings for registration and lookup;
- display active, revoked, mismatch, and not-found as different states;
- treat metadata and revocation text as untrusted display content; and
- obtain a signer only for registration, revocation, and role changes.

## Commands

From the repository root:

```bash
npm run compile
npm run test
npm run check
```

The complete behavioral test suite is owned by the testing workstream. The contract should not be considered integration-complete until those pending tests are implemented and pass.

