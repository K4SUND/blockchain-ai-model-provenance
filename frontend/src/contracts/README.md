# Generated contract files

After a successful local deployment, place the frontend contract information in this directory:

- `ModelRegistry.json` — the required ABI exported from the Hardhat artifact;
- `deployment.json` — chain ID and deployed contract address.

Do not manually invent an ABI or contract address. Task `DEP-03` in `workplan.md` should automate this export to prevent the frontend from using stale deployment data.

