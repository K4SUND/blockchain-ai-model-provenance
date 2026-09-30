// /**
//  * TODO(FE-06): Show the complete registry record and audit information.
//  * Add the revoke action only when the connected signer is allowed to use it.
//  */
// export default function ModelDetails() {
//   return (
//     <section className="panel details" aria-labelledby="details-title">
//       <p className="section-label">Registry record</p>
//       <h2 id="details-title">Model details</h2>
//       <p className="muted">
//         Search results, publisher information, hashes, timestamps, and
//         revocation history will appear here.
//       </p>
//     </section>
//   );
// }

import { useState } from "react";
import {
  connectWallet,
  getModel,
  modelExists,
  revokeModel,
  hasRole,
} from "../services/modelRegistry.js";
import { formatRegistryError } from "../utils/registryError.js";

const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "—";
  }

  return new Date(seconds * 1000).toLocaleString();
}

function shortenAddress(address) {
  if (!address) {
    return "—";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ModelDetails() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");

  const [model, setModel] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [canRevoke, setCanRevoke] = useState(false);

  const handleLoadModel = async () => {
    const trimmedName = modelName.trim();
    const trimmedVersion = version.trim();

    setError("");
    setMessage("");
    setModel(null);
    setCanRevoke(false);

    if (!trimmedName || !trimmedVersion) {
      setError("Enter both the model name and version.");
      return;
    }

    setLoading(true);

    try {
      const exists = await modelExists(
        trimmedName,
        trimmedVersion
      );

      if (!exists) {
        setError(
          "No record exists for this model name and version."
        );
        return;
      }

      const record = await getModel(
        trimmedName,
        trimmedVersion
      );

      setModel(record);

      /*
       * Revoke permission:
       * 1. The original publisher can revoke.
       * 2. The DEFAULT_ADMIN_ROLE can revoke.
       */
      try {
        const wallet = await connectWallet();

        setWalletAddress(wallet.address);

        const isPublisher =
          wallet.address.toLowerCase() ===
          String(record.publisher).toLowerCase();

        const isAdministrator = await hasRole(
          DEFAULT_ADMIN_ROLE,
          wallet.address
        );

        setCanRevoke(
          isPublisher || isAdministrator
        );
      } catch {
        /*
         * Model details are still readable without a
         * connected/authorized wallet.
         */
        setWalletAddress("");
        setCanRevoke(false);
      }
    } catch (err) {
      console.error("LOAD MODEL ERROR:", err);

      setError(
        formatRegistryError(
          err,
          "Failed to load the model record. Confirm that Hardhat Local is selected and the local node is running."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!model) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("Enter a reason before revoking the model.");
      return;
    }

    if (!canRevoke) {
      setError(
        "Your connected wallet is not allowed to revoke this model."
      );
      return;
    }

    setError("");
    setMessage("");
    setRevoking(true);

    try {
      const tx = await revokeModel(
        model.modelName,
        model.version,
        trimmedReason
      );

      setMessage(
        "Revocation transaction submitted. Waiting for confirmation..."
      );

      await tx.wait();

      /*
       * Reload the record so the revoked state and
       * revocation reason are shown from blockchain data.
       */
      const updatedModel = await getModel(
        model.modelName,
        model.version
      );

      setModel(updatedModel);
      setReason("");

      setMessage(
        "Model successfully revoked. The registry record remains available."
      );
    } catch (err) {
      console.error("REVOKE MODEL ERROR:", err);

      setError(
        formatRegistryError(
          err,
          "Revocation failed. Confirm that the original Publisher account and Hardhat Local network are selected."
        )
      );
    } finally {
      setRevoking(false);
    }
  };

  const handleClear = () => {
    setModelName("");
    setVersion("");
    setModel(null);
    setWalletAddress("");
    setReason("");
    setError("");
    setMessage("");
    setCanRevoke(false);
  };

  return (
    <section
      className="panel details"
      aria-labelledby="details-title"
    >
      <p className="section-label">Registry record</p>

      <h2 id="details-title">Model details</h2>

      <p className="muted">
        Load a registered model to inspect its blockchain
        record and, when authorized, revoke the release.
      </p>

      <div className="details-form">
        <label>
          Model name
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. TestModel"
            disabled={loading || revoking}
          />
        </label>

        <label>
          Version
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0"
            disabled={loading || revoking}
          />
        </label>

        <div className="details-actions">
          <button
            type="button"
            onClick={handleLoadModel}
            disabled={
              loading ||
              revoking ||
              !modelName.trim() ||
              !version.trim()
            }
          >
            {loading ? "Loading..." : "Load Model"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading || revoking}
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="status status-error" role="alert">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="status status-success" role="status">
          {message}
        </div>
      )}

      {model && (
        <div className="model-record">
          <div className="record-header">
            <div>
              <p className="section-label">Blockchain record</p>
              <h3>
                {model.modelName} — {model.version}
              </h3>
            </div>

            <span
              className={
                model.revoked
                  ? "record-status revoked"
                  : "record-status active"
              }
            >
              {model.revoked ? "Revoked" : "Active"}
            </span>
          </div>

          <div className="record-grid">
            <div>
              <span>Model Name</span>
              <strong>{model.modelName}</strong>
            </div>

            <div>
              <span>Version</span>
              <strong>{model.version}</strong>
            </div>

            <div>
              <span>Model Hash</span>
              <code>{model.modelHash}</code>
            </div>

            <div>
              <span>Provenance Hash</span>
              <code>{model.provenanceHash}</code>
            </div>

            <div>
              <span>Metadata URI</span>
              <strong>
                {model.metadataURI || "—"}
              </strong>
            </div>

            <div>
              <span>Publisher</span>
              <code>
                {model.publisher}
              </code>
            </div>

            <div>
              <span>Registered At</span>
              <strong>
                {formatTimestamp(model.registeredAt)}
              </strong>
            </div>

            <div>
              <span>Current Wallet</span>
              <code>
                {walletAddress
                  ? shortenAddress(walletAddress)
                  : "Not connected"}
              </code>
            </div>
          </div>

          {model.revoked && (
            <div className="revocation-box">
              <p className="section-label">
                Revocation information
              </p>

              <p>
                <strong>Status:</strong> This model release
                has been revoked.
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {model.revocationReason || "—"}
              </p>
            </div>
          )}

          {!model.revoked && canRevoke && (
            <div className="revoke-box">
              <p className="section-label">
                Authorized action
              </p>

              <h3>Revoke model</h3>

              <p className="muted">
                Your connected wallet is authorized to revoke
                this model. Revocation is permanent and the
                record will remain visible on-chain.
              </p>

              <label>
                Revocation reason
                <textarea
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  placeholder="Explain why this model release is being revoked."
                  rows={4}
                  disabled={revoking}
                />
              </label>

              <button
                type="button"
                onClick={handleRevoke}
                disabled={
                  revoking ||
                  !reason.trim()
                }
              >
                {revoking
                  ? "Revoking..."
                  : "Revoke Model"}
              </button>
            </div>
          )}

          {!model.revoked &&
            walletAddress &&
            !canRevoke && (
              <div className="status status-info">
                The connected wallet is not the original
                publisher and does not have administrator
                permission, so the revoke action is hidden.
              </div>
            )}
        </div>
      )}
    </section>
  );
}
