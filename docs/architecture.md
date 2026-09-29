# ModelGuard architecture

## Status

This is the initial design document. Any change to the security boundary, on-chain data model, hashing algorithm, or authorization policy should be discussed by the team and recorded here before implementation.

## Actors

### Administrator

- deploys the registry;
- grants and revokes publisher roles; and
- may revoke a model in an emergency.

### Publisher

- selects an existing model artifact and provenance manifest;
- hashes both files locally;
- registers a unique model name/version pair; and
- revokes its own unsafe or obsolete releases.

### Verifier

- does not need a publisher role;
- selects a local model file;
- reads a registry record without sending a transaction; and
- receives verified, mismatch, revoked, or not-found status.

## Trust boundary

The browser calculates SHA-256 over exact file bytes. The blockchain stores the resulting hash and binds it to an authorized publisher address and timestamp. Model files never need to pass through a ModelGuard server.

ModelGuard verifies integrity relative to a publisher's registered record. It does not establish model accuracy, fairness, safety, or truthfulness of the publisher's claims.

## Decisions already made

| Decision | Choice | Reason |
|---|---|---|
| Model storage | Off-chain | Model files are too large and expensive for on-chain storage |
| Artifact hash | SHA-256 | Widely supported by browser Web Crypto and external file tools |
| Registry key | `keccak256(abi.encode(name, version))` | Fixed-size, deterministic, and unambiguous key |
| Authorization | OpenZeppelin `AccessControl` | Contract-enforced administrator and publisher roles |
| Deletion | Not permitted | Registration and revocation history must remain auditable |
| First network | Local Hardhat | Fast, free, repeatable development and demonstration |
| Demo model | ONNX Model Zoo `mnist-12.onnx` (MIT, 26 KB) | Small, real, redistributable artifact; see `sample-models/README.md` |

## Open decisions

- Should metadata be a normal URL, an IPFS URI, or an optional text field for the MVP?
- May only the original publisher revoke, or may an administrator also perform emergency revocation? The current proposal allows both.
- Should the first public deployment use Sepolia, or is the local demonstration sufficient?

