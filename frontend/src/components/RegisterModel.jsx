/**
 * FE-04: Publisher-only registration form.
 *
 * Required fields:
 * - model name and version;
 * - local model file;
 * - local provenance-manifest JSON file; and
 * - optional public metadata URI.
 *
 * Both files are hashed locally using SHA-256.
 * Only the hashes and metadata are sent to the smart contract.
 *
 * The selected files are never uploaded by this component.
 */

import { useState } from "react";
import { registerModel } from "../services/modelRegistry.js";
import { hashFile } from "../utils/hashFile.js";
import { formatRegistryError } from "../utils/registryError.js";

export default function RegisterModel() {
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");

  const [modelFile, setModelFile] = useState(null);
  const [provenanceFile, setProvenanceFile] = useState(null);

  const [metadataURI, setMetadataURI] = useState("");

  const [modelHash, setModelHash] = useState("");
  const [provenanceHash, setProvenanceHash] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!modelName.trim()) {
        throw new Error("Model name is required.");
      }

      if (!version.trim()) {
        throw new Error("Version is required.");
      }

      if (!modelFile) {
        throw new Error("Please select the model file.");
      }

      if (!provenanceFile) {
        throw new Error(
          "Please select the provenance-manifest JSON file."
        );
      }

      if (
        provenanceFile.type !== "application/json" &&
        !provenanceFile.name.toLowerCase().endsWith(".json")
      ) {
        throw new Error(
          "The provenance file must be a JSON file."
        );
      }

      // Hash both files locally.
      // The files are never uploaded.
      const calculatedModelHash = await hashFile(modelFile);

      const calculatedProvenanceHash =
        await hashFile(provenanceFile);

      setModelHash(calculatedModelHash);
      setProvenanceHash(calculatedProvenanceHash);

      setMessage(
        "Files hashed locally. Waiting for wallet confirmation..."
      );

      // Send only hashes and metadata to the smart contract.
      const tx = await registerModel({
        modelName: modelName.trim(),
        version: version.trim(),
        modelHash: calculatedModelHash,
        provenanceHash: calculatedProvenanceHash,
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

      setMessage("");

      setError(
        formatRegistryError(
          err,
          "Registration failed. Confirm that the Publisher account and Hardhat Local network are selected."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setModelName("");
    setVersion("");
    setModelFile(null);
    setProvenanceFile(null);
    setMetadataURI("");
    setModelHash("");
    setProvenanceHash("");
    setMessage("");
    setError("");

    const modelInput = document.getElementById(
      "register-model-file"
    );

    const provenanceInput = document.getElementById(
      "register-provenance-file"
    );

    if (modelInput) {
      modelInput.value = "";
    }

    if (provenanceInput) {
      provenanceInput.value = "";
    }
  }

  const canRegister =
    modelName.trim() &&
    version.trim() &&
    modelFile &&
    provenanceFile &&
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

        .register-field input[type="file"] {
          padding: 9px;
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

        .register-clear-button {
          margin-left: 10px;
          padding: 11px 20px;
          border: 1px solid #ccc;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          background: transparent;
        }

        .register-clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .register-hash {
          margin-top: 10px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.03);
          overflow-wrap: anywhere;
        }

        .register-hash code {
          display: block;
          margin-top: 5px;
          word-break: break-all;
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-model-file">
              Model file
            </label>

            <input
              id="register-model-file"
              type="file"
              onChange={(e) =>
                setModelFile(
                  e.target.files?.[0] || null
                )
              }
              disabled={loading}
            />

            <small>
              The model is hashed locally in your browser.
              It is not uploaded.
            </small>

            {modelFile && (
              <small>
                Selected: {modelFile.name}
              </small>
            )}
          </div>

          <div className="register-field">
            <label htmlFor="register-provenance-file">
              Provenance manifest JSON
            </label>

            <input
              id="register-provenance-file"
              type="file"
              accept=".json,application/json"
              onChange={(e) =>
                setProvenanceFile(
                  e.target.files?.[0] || null
                )
              }
              disabled={loading}
            />

            <small>
              The provenance manifest is hashed locally.
              It is not uploaded.
            </small>

            {provenanceFile && (
              <small>
                Selected: {provenanceFile.name}
              </small>
            )}
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
              disabled={loading}
            />

            <small>
              Optional public metadata location.
            </small>
          </div>

          {modelHash && (
            <div className="register-hash">
              <strong>Model SHA-256 hash</strong>
              <code>{modelHash}</code>
            </div>
          )}

          {provenanceHash && (
            <div className="register-hash">
              <strong>Provenance SHA-256 hash</strong>
              <code>{provenanceHash}</code>
            </div>
          )}

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

          <button
            className="register-clear-button"
            type="button"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
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
              <strong>
                Registration failed
              </strong>
              <br />
              {error}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
