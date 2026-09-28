# ModelGuard team work plan

## 1. Purpose

This document divides the ModelGuard MVP into parallel workstreams so team members can contribute without repeatedly editing the same files.

The team goal is a reliable three-minute demonstration of:

1. authorized model registration;
2. local SHA-256 hashing;
3. successful verification of an original model;
4. detection of a modified model;
5. model revocation; and
6. immutable version history.

## 2. Team allocation

| Workstream | Owner | Backup/reviewer | Main paths |
|---|---|---|---|
| A — Smart contract | **Kasun** | Ninada | `contracts/` |
| B — Tests and deployment | **Ninada** | Kasun | `test/`, `ignition/`, Hardhat config |
| C — Hashing and blockchain integration | **Oshani** | Kasun | `frontend/src/utils/`, `frontend/src/services/`, wallet panel |
| D — UI, documentation, and demo | **Imalsha** | Oshani | frontend components/styles, `docs/`, presentation |

Kasun also coordinates the repository and task board. Every member must understand the final contract and be able to explain the verification flow.

## 3. Ground rules

- Keep `main` in a buildable state.
- Create one branch per task: `feature/SC-02-register-model`, `test/TEST-02-registration`, and so on.
- Do not push directly to `main` after the initial scaffold commit.
- Keep pull requests small enough to review in approximately 15 minutes.
- Require at least one teammate review before merging.
- Rebase or update from `main` before final merge.
- Do not commit `.env`, wallet keys, seed phrases, RPC secrets, `node_modules`, or unlicensed model binaries.
- Do not change the contract interface without notifying frontend and test owners.
- Link each pull request to one task ID from this document.
- Mark a task complete only after its acceptance criteria are satisfied.

## 4. Phase 0 — Repository bootstrap

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
|---|---|---|---|---|---|
| SETUP-01 | Review the scaffold and confirm responsibilities | Kasun, Ninada, Oshani, Imalsha | None | Everyone accepts their workstream and reviewer assignment | Not started |
| SETUP-02 | Install root and frontend dependencies | Ninada | SETUP-01 | `npm ci` succeeds in the root and frontend packages | Not started |
| SETUP-03 | Run the initial checks | Ninada | SETUP-02 | Contract compiles, starter tests pass, frontend builds | Not started |
| SETUP-04 | Create remote repository and branch protection | Kasun | SETUP-03 | Repository is accessible and direct pushes to `main` are discouraged/protected | Not started |
| SETUP-05 | Create task issues from this plan | Kasun | SETUP-04 | Each implementation task has an assignee and task ID | Not started |

## 5. Workstream A — Smart contract

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
|---|---|---|---|---|---|
| SC-01 | Review storage, roles, errors, and events | Kasun | SETUP-03 | Proposed interface is accepted by Ninada and Oshani | Complete — awaiting interface review |
| SC-02 | Implement `registerModel` | Kasun | SC-01 | Valid publisher registration works; bad inputs and duplicates revert; event emitted | Complete |
| SC-03 | Implement `revokeModel` | Kasun | SC-02 | Publisher/admin policy enforced; reason stored; double revocation rejected | Complete |
| SC-04 | Implement `getModel` and finalize `modelExists` | Kasun | SC-02 | Existing record is returned and missing record behavior is documented/testable | Complete |
| SC-05 | Contract security review and NatSpec cleanup | Kasun and Ninada | SC-02–SC-04 | No overwrite/delete path, permissions checked, comments match behavior | Kasun complete — awaiting Ninada review |

### Contract owner notes

- Preserve the public function signatures unless the team agrees on a coordinated change.
- Do not add enumeration arrays merely for UI convenience; prefer events unless a genuine on-chain requirement exists.
- Validate everything again in Solidity even when the UI validates it.

## 6. Workstream B — Tests and deployment

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
|---|---|---|---|---|---|
| TEST-01 | Confirm starter constructor/ID tests | Ninada | SETUP-03 | Starter tests pass on a clean checkout | Not started |
| TEST-02 | Registration and authorization tests | Ninada | SC-02 | All registration TODO tests implemented and passing | Not started |
| TEST-03 | Lookup and versioning tests | Ninada | SC-04 | Record, existence, missing record, and multiple-version cases pass | Not started |
| TEST-04 | Revocation and event tests | Ninada | SC-03 | Permission, state, repeat-revocation, and event cases pass | Not started |
| DEP-01 | Validate local Ignition deployment | Ninada | SC-04 | Contract deploys to a fresh `hardhat node` | Not started |
| DEP-02 | Make initial admin configurable for public deployment | Ninada | DEP-01 | Deployment does not assume account 0 outside local development | Not started |
| DEP-03 | Export ABI/address for the frontend | Ninada | DEP-01 | One documented command updates generated frontend contract files | Not started |
| DEP-04 | Optional Sepolia deployment | Ninada | All MVP tasks | Deployed address recorded; no secrets committed | Backlog |

### Test owner notes

- Test failure paths as carefully as successful calls.
- Never reduce contract checks merely to make a failing test pass.
- Coordinate the ABI/address export format with Oshani before implementing `DEP-03`.

## 7. Workstream C — Hashing and blockchain integration

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
|---|---|---|---|---|---|
| FE-01 | Define frontend state and error model | Oshani | SC-01 | States cover disconnected, wrong network, pending, success, and failure | Not started |
| FE-02 | Implement wallet/provider/contract service | Oshani | DEP-03 | Read-only calls and signed transactions use one integration module | Not started |
| FE-03 | Implement and test `hashFile` | Oshani | SETUP-03 | Same file gives stable SHA-256; modified file differs; output is valid `bytes32` hex | Not started |
| FE-04 | Implement registration logic | Oshani | SC-02, FE-02, FE-03 | Authorized publisher can hash and register model+manifest | Not started |
| FE-05 | Implement verification logic | Oshani | SC-04, FE-02, FE-03 | UI distinguishes verified, mismatch, revoked, and not found | Not started |
| FE-06 | Implement details and revoke logic | Oshani | SC-03, FE-02 | Record details load; only eligible wallet sees working revoke action | Not started |

### Integration owner notes

- Never upload a model merely to hash it.
- Use the same SHA-256 helper for registration and verification.
- Keep ethers/provider code out of presentation components.
- Show transaction-pending and rejected-wallet-signature states clearly.

## 8. Workstream D — UI, documentation, and demonstration

| ID | Task | Owner | Depends on | Acceptance criteria | Status |
|---|---|---|---|---|---|
| UI-01 | Convert placeholder cards into accessible forms | Imalsha | FE-01 | Labels, validation messages, keyboard flow, and mobile layout work | Not started |
| UI-02 | Create reusable status/result components | Imalsha | FE-05 | Verified, mismatch, revoked, and not-found states are visually distinct and textual | Not started |
| UI-03 | Add transaction feedback and empty states | Imalsha | FE-04, FE-06 | User understands waiting, success, cancellation, and failure | Not started |
| DOC-01 | Select and document demo model licence/source | Imalsha | SETUP-03 | Source, licence, size, format, and original hash recorded | Not started |
| DOC-02 | Maintain architecture and setup documentation | Imalsha | All workstreams | `setup.md` commands and architecture match the implementation | Ongoing |
| DOC-03 | Finalize three-minute demo script | Imalsha | MVP complete | Rehearsed demonstration finishes within three minutes | Not started |
| DOC-04 | Prepare slides and limitations statement | Imalsha | MVP complete | Slides show problem, architecture, demo, security value, and limits | Not started |

## 9. Integration milestones

### Milestone 1 — Green foundation

Required tasks: `SETUP-01` to `SETUP-03`, `SC-01`, `TEST-01`, `FE-01`.

Exit condition: everyone can clone, install, compile, test, and build the placeholder frontend.

### Milestone 2 — Working registry

Required tasks: `SC-02` to `SC-04`, `TEST-02` to `TEST-04`, `DEP-01`.

Exit condition: registration, lookup, authorization, versions, and revocation work through tests on a local blockchain.

### Milestone 3 — Working application

Required tasks: `DEP-03`, `FE-02` to `FE-06`, `UI-01` to `UI-03`.

Exit condition: the full scenario works through the browser with separate publisher and verifier wallets.

### Milestone 4 — Submission ready

Required tasks: `SC-05`, `DOC-01` to `DOC-04`, final checklist.

Exit condition: clean checkout passes all checks, no secrets are present, documentation is accurate, and the team can demonstrate the system in three minutes.

## 10. Suggested seven-day schedule

| Day | Contract | Tests/deployment | Integration | UI/docs |
|---|---|---|---|---|
| 1 | SC-01 | SETUP-02/03, TEST-01 | FE-01 | Review architecture |
| 2 | SC-02 | TEST-02 | FE-03 | UI-01 scaffold |
| 3 | SC-03/04 | TEST-03/04 | FE-02 | DOC-01 |
| 4 | Fix review issues | DEP-01/03 | FE-04 | UI registration flow |
| 5 | SC-05 | Deployment fixes | FE-05/06 | UI-02/03 |
| 6 | Support integration | Full regression | End-to-end fixes | DOC-02/03/04 |
| 7 | Final review | Clean-checkout test | Demo rehearsal | Slides and submission |

## 11. Pull-request checklist

Every contributor should copy this checklist into a pull request:

- [ ] The PR addresses one named task ID.
- [ ] I updated or added tests where behavior changed.
- [ ] `npm run check` passes, or I explained why a dependent task blocks it.
- [ ] I did not commit secrets, local deployment output, dependencies, or unlicensed binaries.
- [ ] New public functions and important logic have comments.
- [ ] User-facing errors explain what the user can do next.
- [ ] I updated `setup.md` or architecture documentation if setup or behavior changed.
- [ ] I requested review from the backup/reviewer in the allocation table.

## 12. Definition of done

The MVP is done only when all of the following are true:

- a fresh clone can be installed using documented commands;
- root contract tests pass;
- the frontend production build succeeds;
- an authorized publisher can register a unique version;
- an unauthorized wallet is rejected by the contract;
- original and modified files produce different verification results;
- a revoked model produces a warning while its record remains visible;
- no model or provenance file is uploaded for hashing;
- no secret or private information is committed or stored on-chain;
- `setup.md` matches the actual commands and interface; and
- the live demonstration consistently finishes within three minutes.

## 13. First team meeting checklist

1. Add university registration numbers beside the member names if required.
2. Kasun, Ninada, Oshani, and Imalsha confirm their workstreams and reviewers.
3. Agree on communication channel and daily update time.
4. Confirm whether administrator emergency revocation is acceptable.
5. Select a small model candidate for licence review.
6. Create repository issues from the task tables.
7. Assign Milestone 1 tasks and begin work on separate branches.

