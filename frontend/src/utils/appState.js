export const WALLET_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  WRONG_NETWORK: "wrong_network",
};

export const TRANSACTION_STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REJECTED: "rejected",
};

export const VERIFICATION_STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  VERIFIED: "verified",
  MISMATCH: "mismatch",
  REVOKED: "revoked",
  NOT_FOUND: "not_found",
  FAILED: "failed",
};

export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND:
    "No browser wallet detected. Please install or enable MetaMask.",

  WALLET_CONNECTION_REJECTED:
    "Wallet connection was rejected.",

  WRONG_NETWORK:
    "Connected to the wrong network.",

  CONTRACT_NOT_CONFIGURED:
    "ModelRegistry deployment has not been configured yet.",

  TRANSACTION_REJECTED:
    "The transaction was rejected by the wallet.",

  TRANSACTION_FAILED:
    "The blockchain transaction failed.",

  MODEL_NOT_FOUND:
    "The requested model was not found.",

  HASH_MISMATCH:
    "The selected file does not match the registered model hash.",

  MODEL_REVOKED:
    "This model has been revoked.",

  INVALID_FILE:
    "Please select a valid file.",

  UNKNOWN_ERROR:
    "An unexpected error occurred.",
};