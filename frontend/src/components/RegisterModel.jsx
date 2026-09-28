// /**
//  * TODO(FE-04): Publisher-only registration form.
//  *
//  * Required fields:
//  * - model name and semantic version;
//  * - local model file;
//  * - local provenance-manifest JSON file; and
//  * - optional public metadata URI.
//  *
//  * Hash both files locally before sending only their hashes and metadata to the
//  * smart contract. Never upload a selected model as part of this component.
//  */
// export default function RegisterModel() {
//   return (
//     <section className="card" aria-labelledby="register-title">
//       <p className="section-label">Publisher action</p>
//       <h2 id="register-title">Register a model</h2>
//       <p>
//         Authorized publishers will create immutable records for new model
//         versions here.
//       </p>
//       <ul className="todo-list">
//         <li>Collect release metadata</li>
//         <li>Hash model and manifest locally</li>
//         <li>Confirm and submit the transaction</li>
//       </ul>
//     </section>
//   );
// }


import { useState } from "react";
import { registerModel } from "../services/modelRegistry";

export default function RegisterModel() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [modelHash, setModelHash] = useState("");
  const [provenanceHash, setProvenanceHash] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const tx = await registerModel({
        modelName: modelName.trim(),
        version: version.trim(),
        modelHash: modelHash.trim(),
        provenanceHash: provenanceHash.trim(),
        metadataURI: metadataURI.trim(),
      });

      setMessage(
        `Transaction submitted: ${tx.hash}`
      );

      await tx.wait();

      setMessage(
        `Model registered successfully. Transaction: ${tx.hash}`
      );
    } catch (err) {
  console.error("REGISTER ERROR:", err);
  console.error("ERROR DATA:", err?.data);
  console.error("ERROR INFO:", err?.info);
  console.error("ERROR RECEIPT:", err?.receipt);

  setError(
    err?.shortMessage ||
    err?.reason ||
    err?.message ||
    "Failed to register the model."
  );
} finally {
      setLoading(false);
    }
  }

  const canRegister =
    modelName.trim() &&
    version.trim() &&
    modelHash.trim() &&
    provenanceHash.trim() &&
    !loading;

  return (
    <>
      <style>{`
        .register-form {
          margin-top: 20px;
        }

        .register-field {
          margin-bottom: 18px;
        }

        .register-field label {
          display: block;
          margin-bottom: 7px;
          font-weight: 600;
        }

        .register-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 13px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
        }

        .register-field small {
          display: block;
          margin-top: 5px;
          color: #666;
        }

        .register-button {
          margin-top: 5px;
          padding: 11px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .register-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .register-message {
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #2e7d32;
          border-radius: 8px;
          overflow-wrap: anywhere;
        }

        .register-error {
          margin-top: 20px;
          padding: 14px;
          border: 1px solid #d32f2f;
          border-radius: 8px;
          color: #b71c1c;
          overflow-wrap: anywhere;
        }
      `}</style>

      <section
        className="card"
        aria-labelledby="register-title"
      >
        <p className="section-label">
          Publisher action
        </p>

        <h2 id="register-title">
          Register a model
        </h2>

        <p className="muted">
          Create an immutable blockchain record for a
          new AI model version.
        </p>

        <div className="register-form">

          <div className="register-field">
            <label htmlFor="register-model-name">
              Model name
            </label>

            <input
              id="register-model-name"
              type="text"
              value={modelName}
              onChange={(e) =>
                setModelName(e.target.value)
              }
              placeholder="Example: TestModel"
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-version">
              Version
            </label>

            <input
              id="register-version"
              type="text"
              value={version}
              onChange={(e) =>
                setVersion(e.target.value)
              }
              placeholder="Example: 1.0"
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-model-hash">
              Model hash
            </label>

            <input
              id="register-model-hash"
              type="text"
              value={modelHash}
              onChange={(e) =>
                setModelHash(e.target.value)
              }
              placeholder="0x + 64 hexadecimal characters"
            />

            <small>
              32-byte SHA-256 hash of the model.
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="register-provenance-hash">
              Provenance hash
            </label>

            <input
              id="register-provenance-hash"
              type="text"
              value={provenanceHash}
              onChange={(e) =>
                setProvenanceHash(e.target.value)
              }
              placeholder="0x + 64 hexadecimal characters"
            />

            <small>
              32-byte hash representing the model
              provenance/manifest.
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="register-metadata">
              Metadata URI
            </label>

            <input
              id="register-metadata"
              type="text"
              value={metadataURI}
              onChange={(e) =>
                setMetadataURI(e.target.value)
              }
              placeholder="ipfs://... or https://..."
            />
          </div>

          <button
            className="register-button"
            type="button"
            onClick={handleRegister}
            disabled={!canRegister}
          >
            {loading
              ? "Registering..."
              : "Register Model"}
          </button>

          {message && (
            <div className="register-message">
              {message}
            </div>
          )}

          {error && (
            <div
              className="register-error"
              role="alert"
            >
              <strong>Registration failed</strong>
              <br />
              {error}
            </div>
          )}

        </div>
      </section>
    </>
  );
}
