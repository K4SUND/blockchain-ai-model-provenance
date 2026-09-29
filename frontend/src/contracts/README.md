# Generated contract files

These files are generated from the Hardhat build and the Ignition deployment by one command (task `DEP-03`). Do not edit them by hand or invent an ABI or address.

```bash
npm run deploy:local      # deploys, then runs export:frontend automatically
npm run export:frontend   # re-export only, e.g. after recompiling
```

| File | Committed? | Contents |
|---|---|---|
| `ModelRegistry.json` | Yes | `{ contractName, abi }` from `artifacts/contracts/ModelRegistry.sol/ModelRegistry.json`. Changes only when the contract interface changes. |
| `deployment.json` | No (local output) | Chain-specific deployment record, see below. |
| `deployment.example.json` | Yes | Shape of `deployment.json` with empty values. |

`deployment.json` fields:

| Field | Meaning |
|---|---|
| `chainId` | Chain the contract was deployed to, for example `31337` |
| `contractName` | Always `ModelRegistry` |
| `address` | Deployed registry address |
| `transactionHash` | Deployment transaction |
| `blockNumber` | Deployment block; use it as `fromBlock` when querying `ModelRegistered`/`ModelRevoked` events for version history |
| `deployedAt` | ISO-8601 timestamp of the deployment block |

The export script reads the address from Ignition's record for the connected chain and checks that contract code exists there. If the local node was restarted without redeploying, the export fails instead of writing a stale address.

Because `deployment.json` is not committed, it is missing on a fresh clone until `npm run deploy:local` has run. Frontend code should handle that case (for example with `import.meta.glob("./deployment.json", { eager: true })`, which returns an empty object when the file is absent) rather than breaking `npm run frontend:build`.
