import { useRef, useState } from "react";
import FormField from "./FormField.jsx";
import {
  focusFirstInvalid,
  hasErrors,
  MAX_NAME_LENGTH,
  validateFile,
  validateModelName,
  validateVersion,
} from "./formValidation.js";

/**
 * Public, read-only verification form (UI-01).
 *
 * The integration layer (FE-05) supplies `onVerify({ modelName, version, file })`,
 * which hashes the file locally, reads the record, and reports exactly one
 * state: verified, mismatch, revoked, or not found. Result display is UI-02.
 *
 * @param {object} props
 * @param {(input: object) => void} [props.onVerify] verification handler; the
 *        form is disabled until one is supplied
 * @param {boolean} [props.busy=false] true while hashing or reading the chain
 * @param {import("react").ReactNode} [props.result] rendered result (UI-02)
 */
export default function VerifyModel({ onVerify, busy = false, result }) {
  const formRef = useRef(null);
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  const isConnected = typeof onVerify === "function";

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {
      modelName: validateModelName(modelName),
      version: validateVersion(version),
      file: validateFile(file, "model file"),
    };
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    onVerify({ modelName: modelName.trim(), version: version.trim(), file });
  }

  return (
    <section className="card" aria-labelledby="verify-title">
      <p className="section-label">Public action</p>
      <h2 id="verify-title">Verify a model</h2>
      <p>
        Check that a downloaded model is byte-for-byte identical to the
        registered release. No wallet transaction or gas is needed.
      </p>

      {!isConnected && (
        <p className="notice" role="status">
          Verification becomes available once the registry connection is
          configured.
        </p>
      )}

      <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!isConnected || busy}>
          <legend className="visually-hidden">Model to verify</legend>

          <div className="field-row">
            <FormField
              label="Model name"
              hint="Exactly as registered"
              error={errors.modelName}
              name="modelName"
              type="text"
              autoComplete="off"
              maxLength={MAX_NAME_LENGTH}
              required
              value={modelName}
              onChange={(event) => {
                setModelName(event.target.value);
                setErrors((current) => ({ ...current, modelName: "" }));
              }}
            />
            <FormField
              label="Version"
              hint="e.g. 1.0.0"
              error={errors.version}
              name="version"
              type="text"
              autoComplete="off"
              inputMode="decimal"
              required
              value={version}
              onChange={(event) => {
                setVersion(event.target.value);
                setErrors((current) => ({ ...current, version: "" }));
              }}
            />
          </div>

          <FormField
            label="Model file to check"
            hint="Hashed locally with SHA-256; the file never leaves your device"
            error={errors.file}
            name="file"
            type="file"
            required
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setErrors((current) => ({ ...current, file: "" }));
            }}
          />

          <button type="submit">{busy ? "Verifying..." : "Verify file"}</button>
        </fieldset>
      </form>

      <div aria-live="polite">{result}</div>
    </section>
  );
}
