// /**
//  * TODO(FE-05): Public, read-only verification flow.
//  *
//  * Calculate the selected file's SHA-256 hash, fetch the name/version record,
//  * then present exactly one state: verified, mismatch, revoked, or not found.
//  */
// export default function VerifyModel() {
//   return (
//     <section className="card" aria-labelledby="verify-title">
//       <p className="section-label">Public action</p>
//       <h2 id="verify-title">Verify a model</h2>
//       <p>
//         Verifiers will compare a local model fingerprint with its registered
//         blockchain record here.
//       </p>
//       <ul className="todo-list">
//         <li>Select model name and version</li>
//         <li>Hash a local file without uploading it</li>
//         <li>Display a clear verification result</li>
//       </ul>
//     </section>
//   );
// }

import { useState } from "react";
import {
  modelExists,
  getModel,
} from "../services/modelRegistry";

export default function VerifyModel() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");

  const [exists, setExists] = useState(null);
  const [model, setModel] = useState(null);

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  const canSearch =
    modelName.trim() !== "" &&
    version.trim() !== "" &&
    !loading;

  async function handleCheckModel() {
    if (!canSearch) return;

    setLoading(true);
    setAction("check");
    setError("");
    setExists(null);
    setModel(null);

    try {
      const result = await modelExists(
        modelName.trim(),
        version.trim()
      );

      setExists(result);
    } catch (err) {
      setError(
        err?.shortMessage ||
        err?.reason ||
        err?.message ||
        "Unable to check the model."
      );
    } finally {
      setLoading(false);
      setAction("");
    }
  }

  async function handleGetModel() {
  if (!canSearch) return;

  setLoading(true);
  setAction("get");
  setError("");
  setModel(null);
  setExists(null);

  try {
    // First check whether the record exists.
    const exists = await modelExists(
      modelName.trim(),
      version.trim()
    );

    if (!exists) {
      setError(
        `No model record found for "${modelName.trim()}" version "${version.trim()}".`
      );
      return;
    }

    // Only call getModel() when the record exists.
    const result = await getModel(
      modelName.trim(),
      version.trim()
    );

    setModel(result);
  } catch (err) {
    setError(
      err?.shortMessage ||
      err?.reason ||
      "Unable to retrieve the model record."
    );
  } finally {
    setLoading(false);
    setAction("");
  }
}
  function handleClear() {
    setModelName("");
    setVersion("");
    setExists(null);
    setModel(null);
    setError("");
  }

  return (
    <>
      <style>{`
        .verify-form {
          margin-top: 20px;
        }

        .verify-field {
          margin-bottom: 18px;
        }

        .verify-field label {
          display: block;
          margin-bottom: 7px;
          font-weight: 600;
        }

        .verify-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }

        .verify-field input:focus {
          border-color: #555;
        }

        .verify-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .verify-buttons button {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .verify-buttons button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .verify-hint {
          margin-top: 12px;
          font-size: 13px;
          color: #666;
        }

        .verify-result {
          margin-top: 24px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .verify-result h3 {
          margin-top: 0;
          margin-bottom: 12px;
        }

        .verify-success {
          border-left: 4px solid #2e7d32;
        }

        .verify-not-found {
          border-left: 4px solid #c62828;
        }

        .model-record {
          margin-top: 24px;
          padding: 18px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .model-record h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }

        .model-row {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          overflow-wrap: anywhere;
        }

        .model-row:last-child {
          border-bottom: none;
        }

        .model-row strong {
          font-weight: 600;
        }

        .verify-error {
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #d32f2f;
          border-radius: 8px;
          color: #b71c1c;
        }

        .verify-error p {
          margin: 6px 0 0;
        }

        @media (max-width: 600px) {
          .model-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>

      <section
        className="card"
        aria-labelledby="verify-title"
      >
        <p className="section-label">
          Public action
        </p>

        <h2 id="verify-title">
          Verify a model
        </h2>

        <p className="muted">
          Search the blockchain registry using a model
          name and version. No model file is uploaded.
        </p>

        <div className="verify-form">

          <div className="verify-field">
            <label htmlFor="model-name">
              Model name
            </label>

            <input
              id="model-name"
              type="text"
              value={modelName}
              onChange={(e) => {
                setModelName(e.target.value);
                setExists(null);
                setModel(null);
                setError("");
              }}
              placeholder="Example: TestModel"
            />
          </div>

          <div className="verify-field">
            <label htmlFor="model-version">
              Version
            </label>

            <input
              id="model-version"
              type="text"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setExists(null);
                setModel(null);
                setError("");
              }}
              placeholder="Example: 1.0"
            />
          </div>

          <div className="verify-buttons">

            <button
              type="button"
              onClick={handleCheckModel}
              disabled={!canSearch}
            >
              {action === "check"
                ? "Checking..."
                : "Check Model"}
            </button>

            <button
              type="button"
              onClick={handleGetModel}
              disabled={!canSearch}
            >
              {action === "get"
                ? "Loading..."
                : "Get Model"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>

          </div>

          {(!modelName.trim() ||
            !version.trim()) && (
            <p className="verify-hint">
              Enter both the model name and version
              to enable the buttons.
            </p>
          )}

        </div>

        {exists !== null && (
          <div
            className={
              exists
                ? "verify-result verify-success"
                : "verify-result verify-not-found"
            }
          >
            <h3>Registry Check</h3>

            {exists ? (
              <p>
                <strong>Model found</strong>
                <br />
                This model version exists in the
                blockchain registry.
              </p>
            ) : (
              <p>
                <strong>Model not found</strong>
                <br />
                No record exists for this model name
                and version.
              </p>
            )}
          </div>
        )}

        {model && (
          <div className="model-record">
            <h3>Model Record</h3>

            <div className="model-row">
              <strong>Name</strong>
              <span>{model.modelName}</span>
            </div>

            <div className="model-row">
              <strong>Version</strong>
              <span>{model.version}</span>
            </div>

            <div className="model-row">
              <strong>Model Hash</strong>
              <span>{model.modelHash}</span>
            </div>

            <div className="model-row">
              <strong>Provenance Hash</strong>
              <span>{model.provenanceHash}</span>
            </div>

            <div className="model-row">
              <strong>Metadata URI</strong>
              <span>{model.metadataURI}</span>
            </div>

            <div className="model-row">
              <strong>Publisher</strong>
              <span>{model.publisher}</span>
            </div>

            <div className="model-row">
              <strong>Registered At</strong>
              <span>
                {model.registeredAt?.toString()}
              </span>
            </div>

            <div className="model-row">
              <strong>Status</strong>
              <span>
                {model.revoked
                  ? "Revoked"
                  : "Active"}
              </span>
            </div>

            {model.revoked &&
              model.revocationReason && (
                <div className="model-row">
                  <strong>
                    Revocation Reason
                  </strong>

                  <span>
                    {model.revocationReason}
                  </span>
                </div>
              )}
          </div>
        )}

        {error && (
          <div
            className="verify-error"
            role="alert"
          >
            <strong>Request failed</strong>

            <p>{error}</p>
          </div>
        )}
      </section>
    </>
  );
}