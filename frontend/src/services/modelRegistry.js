/**
 * Contract-integration boundary.
 *
 * TODO(FE-02): Build providers and contract instances here rather than inside
 * UI components. Read-only calls should use a Provider; transactions require a
 * Signer obtained after an explicit wallet connection.
 *
 * Planned exports:
 * - connectWallet()
 * - getReadOnlyRegistry()
 * - getWritableRegistry()
 * - registerModel(input)
 * - getModel(name, version)
 * - revokeModel(name, version, reason)
 */

export const MODEL_REGISTRY_NOT_CONFIGURED =
  "ModelRegistry deployment has not been configured yet.";

