/**
 * FE-04 / UI-01 / UI-03: publisher-only registration.
 *
 * Both files are hashed locally with SHA-256; only the hashes and metadata
 * are sent to the smart contract. The files are never uploaded.
 */

import { useRef, useState } from "react";
import { modelExists, registerModel } from "../services/modelRegistry.js";
import { hashFile } from "../utils/hashFile.js";
import { describeError, isUserRejection } from "./errorMessages.js";
import FormField from "./FormField.jsx";
import {
  focusFirstInvalid,
  hasErrors,
  MAX_NAME_LENGTH,
  validateFile,
  validateManifest,
  validateMetadataUri,
  validateModelName,
  validateVersion,
} from "./formValidation.js";
import TransactionStatus, { BUSY_PHASES, TX_PHASE } from "./TransactionStatus.jsx";
import WalletNotice from "./WalletNotice.jsx";

const EMPTY_FIELDS = { modelName: "", version: "", metadataURI: "" };
const IDLE_TX = { phase: TX_PHASE.IDLE };

export default function RegisterModel({ wallet }) {
  const formRef = useRef(null);
  const [formKey, setFormKey] = useState(0);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [modelFile, setModelFile] = useState(null);
  const [manifestFile, setManifestFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [hashes, setHashes] = useState(null);
  const [tx, setTx] = useState(IDLE_TX);

  const busy = BUSY_PHASES.includes(tx.phase);
  const ready =
    wallet.canRead && Boolean(wallet.address) && wallet.roles.isPublisher;

  function resetOutcome() {
    if (!busy) {
      setHashes(null);
      setTx(IDLE_TX);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    resetOutcome();
  }

  function chooseFile(setter, name) {
    return (event) => {
      setter(event.target.files?.[0] ?? null);
      setErrors((current) => ({ ...current, [name]: "" }));
      resetOutcome();
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      modelName: validateModelName(fields.modelName),
      version: validateVersion(fields.version),
      modelFile: validateFile(modelFile, "model file"),
      manifestFile: validateManifest(manifestFile),
      metadataURI: validateMetadataUri(fields.metadataURI),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    const modelName = fields.modelName.trim();
    const version = fields.version.trim();

    try {
      setTx({ phase: TX_PHASE.PREPARING });

      // Hash both files locally. The files are never uploaded.
      const modelHash = await hashFile(modelFile);
      const provenanceHash = await hashFile(manifestFile);
      setHashes({ modelHash, provenanceHash });

      // Catch duplicates before asking the user to sign anything.
      if (await modelExists(modelName, version)) {
        setTx({
          phase: TX_PHASE.FAILED,
          error: `${modelName} ${version} is already registered. Records can't be overwritten, so use a new version number.`,
        });
        return;
      }

      setTx({ phase: TX_PHASE.SIGNING });
      const sent = await registerModel({
        modelName,
        version,
        modelHash,
        provenanceHash,
        metadataURI: fields.metadataURI.trim(),
      });

      setTx({ phase: TX_PHASE.PENDING, txHash: sent.hash });
      const receipt = await sent.wait();

      setTx({
        phase: TX_PHASE.SUCCESS,
        txHash: sent.hash,
        blockNumber: receipt?.blockNumber,
        release: `${modelName} ${version}`,
      });
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setTx((current) => ({
        ...current,
        phase: isUserRejection(err) ? TX_PHASE.REJECTED : TX_PHASE.FAILED,
        error: describeError(err, "Failed to register the model."),
      }));
    }
  }

  function handleClear() {
    setFields(EMPTY_FIELDS);
    setModelFile(null);
    setManifestFile(null);
    setErrors({});
    setHashes(null);
    setTx(IDLE_TX);
    // Remounting the form is the only way to clear file inputs.
    setFormKey((key) => key + 1);
  }

  return (
    <section className="card" aria-labelledby="register-title">
      <p className="section-label">Publisher action</p>
      <h2 id="register-title">Register a model</h2>
      <p className="muted">
        Create a permanent blockchain record for a new model version. Files are
        hashed in your browser and are never uploaded.
      </p>

      <WalletNotice wallet={wallet} action="register models" needsAccount needsPublisher />

      <form key={formKey} ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!ready || busy}>
          <legend className="visually-hidden">Model release details</legend>

          <div className="field-row">
            <FormField
              label="Model name"
              hint="Case-sensitive, e.g. DemoClassifier"
              error={errors.modelName}
              name="modelName"
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME_LENGTH}
              required
              value={fields.modelName}
              onChange={updateField}
            />
            <FormField
              label="Version"
              hint="Semantic version, e.g. 1.0.0"
              error={errors.version}
              name="version"
              type="text"
              autoComplete="off"
              required
              value={fields.version}
              onChange={updateField}
            />
          </div>

          <FormField
            label="Model file"
            hint="The exact artifact to publish (ONNX, TFLite, PyTorch…)"
            error={errors.modelFile}
            name="modelFile"
            type="file"
            required
            onChange={chooseFile(setModelFile, "modelFile")}
          />

          <FormField
            label="Provenance manifest"
            hint="JSON file describing source, licence, and dataset"
            error={errors.manifestFile}
            name="manifestFile"
            type="file"
            accept=".json,application/json"
            required
            onChange={chooseFile(setManifestFile, "manifestFile")}
          />

          <FormField
            label="Metadata URI"
            optional
            hint="Public link to release notes or the manifest"
            error={errors.metadataURI}
            name="metadataURI"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://… or ipfs://…"
            value={fields.metadataURI}
            onChange={updateField}
          />

          <div className="actions">
            <button type="submit">
              {busy ? "Registering…" : "Hash files and register"}
            </button>
            <button type="button" className="button-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </fieldset>
      </form>

      {hashes && (
        <dl className="hash-compare">
          <div>
            <dt>Model SHA-256</dt>
            <dd>
              <code className="hash">{hashes.modelHash}</code>
            </dd>
          </div>
          <div>
            <dt>Provenance manifest SHA-256</dt>
            <dd>
              <code className="hash">{hashes.provenanceHash}</code>
            </dd>
          </div>
        </dl>
      )}

      <TransactionStatus
        phase={tx.phase}
        txHash={tx.txHash}
        blockNumber={tx.blockNumber}
        text={{
          [TX_PHASE.PREPARING]: "Hashing both files in your browser…",
          [TX_PHASE.SUCCESS]: tx.release
            ? `${tx.release} is registered. Anyone can now verify it in the Verify panel.`
            : undefined,
          [TX_PHASE.FAILED]: tx.error,
        }}
      />
    </section>
  );
}
