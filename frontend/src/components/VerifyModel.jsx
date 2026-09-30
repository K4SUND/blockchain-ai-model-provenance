/**
 * FE-05 / UI-01 / UI-02: public, read-only verification.
 *
 * Hashes the selected file locally, reads the name/version record, and
 * shows exactly one outcome: verified, mismatch, revoked, or not found.
 * No transaction or gas is needed.
 */

import { useRef, useState } from "react";
import { getModel, modelExists } from "../services/modelRegistry.js";
import { VERIFICATION_STATUS } from "../utils/appState.js";
import { hashFile } from "../utils/hashFile.js";
import { describeError } from "./errorMessages.js";
import FormField from "./FormField.jsx";
import { sameHash } from "./format.js";
import {
  focusFirstInvalid,
  hasErrors,
  MAX_NAME_LENGTH,
  validateFile,
  validateLookupVersion,
  validateModelName,
} from "./formValidation.js";
import VerificationResult from "./VerificationResult.jsx";
import WalletNotice from "./WalletNotice.jsx";

const IDLE = { status: VERIFICATION_STATUS.IDLE };

export default function VerifyModel({ wallet }) {
  const formRef = useRef(null);
  const [formKey, setFormKey] = useState(0);
  const [modelName, setModelName] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [outcome, setOutcome] = useState(IDLE);

  const checking = outcome.status === VERIFICATION_STATUS.CHECKING;

  // A result describes the inputs it was computed from; editing any input
  // clears it so a stale "Verified" is never shown next to a new file.
  function edited(name) {
    setErrors((current) => ({ ...current, [name]: "" }));
    if (!checking) setOutcome(IDLE);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      modelName: validateModelName(modelName),
      version: validateLookupVersion(version),
      file: validateFile(file, "model file"),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    const query = { modelName: modelName.trim(), version: version.trim() };
    setOutcome({ status: VERIFICATION_STATUS.CHECKING });

    try {
      // 1. Hash locally. The file is never uploaded.
      const localHash = await hashFile(file);

      // 2. Read the registry record.
      if (!(await modelExists(query.modelName, query.version))) {
        setOutcome({ status: VERIFICATION_STATUS.NOT_FOUND, query, localHash });
        return;
      }
      const record = await getModel(query.modelName, query.version);

      // 3. Revocation outranks a match: a revoked release must not be used.
      let status = VERIFICATION_STATUS.MISMATCH;
      if (record.revoked) status = VERIFICATION_STATUS.REVOKED;
      else if (sameHash(localHash, record.modelHash)) status = VERIFICATION_STATUS.VERIFIED;

      setOutcome({ status, query, localHash, record });
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      setOutcome({
        status: VERIFICATION_STATUS.FAILED,
        error: describeError(err, "Unable to verify the model."),
      });
    }
  }

  function handleClear() {
    setModelName("");
    setVersion("");
    setFile(null);
    setErrors({});
    setOutcome(IDLE);
    setFormKey((key) => key + 1);
  }

  return (
    <section className="card" aria-labelledby="verify-title">
      <p className="section-label">Public action</p>
      <h2 id="verify-title">Verify a model</h2>
      <p className="muted">
        Check that a downloaded model is byte-for-byte identical to the
        registered release. No transaction or gas is needed.
      </p>

      <WalletNotice wallet={wallet} action="verify models" />

      <form key={formKey} ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!wallet.canRead || checking}>
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
                edited("modelName");
              }}
            />
            <FormField
              label="Version"
              hint="e.g. 1.0.0"
              error={errors.version}
              name="version"
              type="text"
              autoComplete="off"
              required
              value={version}
              onChange={(event) => {
                setVersion(event.target.value);
                edited("version");
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
              edited("file");
            }}
          />

          <div className="actions">
            <button type="submit">{checking ? "Verifying…" : "Verify file"}</button>
            <button type="button" className="button-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </fieldset>
      </form>

      {checking && (
        <p className="notice notice-info" role="status">
          <span className="spinner" aria-hidden="true" /> Hashing the file and
          reading the registry…
        </p>
      )}

      {outcome.status === VERIFICATION_STATUS.FAILED && (
        <p className="notice notice-error" role="alert">
          <strong>Verification couldn't finish.</strong> {outcome.error}
        </p>
      )}

      <VerificationResult
        status={outcome.status}
        query={outcome.query}
        localHash={outcome.localHash}
        record={outcome.record}
      />
    </section>
  );
}
