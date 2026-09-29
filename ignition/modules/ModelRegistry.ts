import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys ModelRegistry with an explicitly configured initial administrator.
 *
 * `initialAdmin` has no default, so a deployment never silently falls back to
 * whichever key happens to be account 0 on the target network. Supply it with
 * a parameters file:
 *
 * - local development: `ignition/parameters/localhost.json` (Hardhat account 0,
 *   used by `npm run deploy:local`);
 * - public testnet: copy `ignition/parameters/sepolia.example.json` and set the
 *   address of the wallet that should administer the registry.
 *
 * The initial administrator also receives PUBLISHER_ROLE. The contract rejects
 * the zero address.
 */
export default buildModule("ModelRegistryModule", (module) => {
  const initialAdmin = module.getParameter<string>("initialAdmin");
  const modelRegistry = module.contract("ModelRegistry", [initialAdmin]);

  return { modelRegistry };
});
