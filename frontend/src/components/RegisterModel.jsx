import { useRef, useState } from "react";
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

const EMPTY_FIELDS = { modelName: "", version: "", metadataURI: "" };

/**
 * Publisher-only registration form (UI-01).
 *
 * This component only collects and validates input. Hashing and the
 * transaction belong to the integration layer (FE-04), which passes
 * `onSubmit({ modelName, version, modelFile, manifestFile, metadataURI })`.
 * Never upload a selected model as part of this component.
 *
 * @param {object} props
 * @param {(input: object) => void} [props.onSubmit] registration handler; the
 *        form is disabled until one is supplied
 * @param {boolean} [props.canPublish=true] false when the wallet lacks PUBLISHER_ROLE
 * @param {boolean} [props.busy=false] true while hashing or a transaction is pending
 */
export default function RegisterModel({
  onSubmit,
  canPublish = true,
  busy = false,
}) {
  const formRef = useRef(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [modelFile, setModelFile] = useState(null);
  const [manifestFile, setManifestFile] = useState(null);
  const [errors, setErrors] = useState({});

  const isConnected = typeof onSubmit === "function";
  const disabled = !isConnected || !canPublish || busy;

  function updateField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
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
      // Wait for React to render aria-invalid before moving focus.
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    onSubmit({
      modelName: fields.modelName.trim(),
      version: fields.version.trim(),
      modelFile,
      manifestFile,
      metadataURI: fields.metadataURI.trim(),
    });
  }

  return (
    <section className="card" aria-labelledby="register-title">
      <p className="section-label">Publisher action</p>
      <h2 id="register-title">Register a model</h2>
      <p>
        Create a permanent blockchain record for a new model version. Files are
        hashed in your browser and are never uploaded.
      </p>

      {!isConnected && (
        <p className="notice" role="status">
          Registration becomes available once the wallet integration is
          connected.
        </p>
      )}
      {isConnected && !canPublish && (
        <p className="notice notice-warning" role="status">
          The connected wallet is not an authorized publisher. Switch to a
          publisher wallet to register models.
        </p>
      )}

      <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={disabled}>
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
              inputMode="decimal"
              required
              value={fields.version}
              onChange={updateField}
            />
          </div>

          <FormField
            label="Model file"
            hint="The exact artifact to publish (ONNX, TFLite, PyTorch...)"
            error={errors.modelFile}
            name="modelFile"
            type="file"
            required
            onChange={(event) => {
              setModelFile(event.target.files?.[0] ?? null);
              setErrors((current) => ({ ...current, modelFile: "" }));
            }}
          />

          <FormField
            label="Provenance manifest"
            hint="JSON file describing source, licence, and dataset"
            error={errors.manifestFile}
            name="manifestFile"
            type="file"
            accept=".json,application/json"
            required
            onChange={(event) => {
              setManifestFile(event.target.files?.[0] ?? null);
              setErrors((current) => ({ ...current, manifestFile: "" }));
            }}
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
            placeholder="https://..."
            value={fields.metadataURI}
            onChange={updateField}
          />

          <button type="submit">
            {busy ? "Registering..." : "Hash files and register"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
