import { useRef, useState } from "react";
import FormField from "./FormField.jsx";
import {
  focusFirstInvalid,
  hasErrors,
  MAX_NAME_LENGTH,
  MAX_REASON_LENGTH,
  validateModelName,
  validateReason,
  validateVersion,
} from "./formValidation.js";

/**
 * Record lookup and revocation forms (UI-01).
 *
 * The integration layer (FE-06) supplies `onLookup({ modelName, version })`
 * and renders the loaded record through `record`. The revoke form is shown
 * only when `canRevoke` is true (original publisher or administrator), and
 * calls `onRevoke({ modelName, version, reason })`.
 *
 * @param {object} props
 * @param {(query: object) => void} [props.onLookup]
 * @param {(input: object) => void} [props.onRevoke]
 * @param {boolean} [props.canRevoke=false]
 * @param {boolean} [props.busy=false]
 * @param {import("react").ReactNode} [props.record] rendered record details
 */
export default function ModelDetails({
  onLookup,
  onRevoke,
  canRevoke = false,
  busy = false,
  record,
}) {
  const lookupRef = useRef(null);
  const revokeRef = useRef(null);
  const [query, setQuery] = useState({ modelName: "", version: "" });
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

  const isConnected = typeof onLookup === "function";

  function updateQuery(event) {
    const { name, value } = event.target;
    setQuery((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validatedQuery() {
    const nextErrors = {
      modelName: validateModelName(query.modelName),
      version: validateVersion(query.version),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(lookupRef.current));
      return null;
    }
    return { modelName: query.modelName.trim(), version: query.version.trim() };
  }

  function handleLookup(event) {
    event.preventDefault();
    const valid = validatedQuery();
    if (valid) onLookup(valid);
  }

  function handleRevoke(event) {
    event.preventDefault();
    const valid = validatedQuery();
    const reasonError = validateReason(reason);
    setErrors((current) => ({ ...current, reason: reasonError }));
    if (reasonError) {
      requestAnimationFrame(() => focusFirstInvalid(revokeRef.current));
    }
    if (!valid || reasonError) return;
    onRevoke({ ...valid, reason: reason.trim() });
  }

  return (
    <section className="panel details" aria-labelledby="details-title">
      <p className="section-label">Registry record</p>
      <h2 id="details-title">Model details</h2>
      <p className="muted">
        Look up a registered version to see its publisher, hashes, registration
        time, and revocation status.
      </p>

      <form
        ref={lookupRef}
        className="form form-inline"
        onSubmit={handleLookup}
        noValidate
      >
        <fieldset disabled={!isConnected || busy}>
          <legend className="visually-hidden">Find a model version</legend>
          <FormField
            label="Model name"
            error={errors.modelName}
            name="modelName"
            type="text"
            autoComplete="off"
            maxLength={MAX_NAME_LENGTH}
            required
            value={query.modelName}
            onChange={updateQuery}
          />
          <FormField
            label="Version"
            error={errors.version}
            name="version"
            type="text"
            autoComplete="off"
            inputMode="decimal"
            required
            value={query.version}
            onChange={updateQuery}
          />
          <button type="submit">{busy ? "Loading..." : "Look up record"}</button>
        </fieldset>
      </form>

      <div aria-live="polite">
        {record ?? (
          <p className="empty-state">
            No record loaded yet. Enter a model name and version above.
          </p>
        )}
      </div>

      {canRevoke && typeof onRevoke === "function" && (
        <form
          ref={revokeRef}
          className="form revoke-form"
          onSubmit={handleRevoke}
          noValidate
        >
          <fieldset disabled={busy}>
            <legend>Revoke this version</legend>
            <p className="field-hint">
              Revocation is permanent. The record stays visible but is marked as
              no longer trusted.
            </p>
            <FormField
              label="Reason"
              hint="Stored publicly on-chain, e.g. Weights found to be compromised"
              error={errors.reason}
            >
              {(controlProps) => (
                <textarea
                  {...controlProps}
                  name="reason"
                  rows={3}
                  maxLength={MAX_REASON_LENGTH}
                  required
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setErrors((current) => ({ ...current, reason: "" }));
                  }}
                />
              )}
            </FormField>
            <button type="submit" className="button-danger">
              {busy ? "Revoking..." : "Revoke version"}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
