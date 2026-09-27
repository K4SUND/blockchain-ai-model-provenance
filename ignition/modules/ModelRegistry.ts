import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys ModelRegistry using local account 0 as the initial administrator.
 *
 * TODO(DEP-02): Add an explicit configurable administrator parameter before a
 * public-testnet deployment. Never silently use an arbitrary production key.
 */
export default buildModule("ModelRegistryModule", (module) => {
  const initialAdmin = module.getAccount(0);
  const modelRegistry = module.contract("ModelRegistry", [initialAdmin]);

  return { modelRegistry };
});

