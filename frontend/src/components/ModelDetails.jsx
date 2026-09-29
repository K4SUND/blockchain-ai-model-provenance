/**
 * FE-06 / UI-01 / UI-03: record lookup and revocation.
 *
 * Anyone can load a record. The revoke form appears only for the original
 * publisher or an administrator; the contract enforces the same rule.
 */

import { useRef, useState } from "react";
import { getModel, modelExists, revokeModel } from "../services/modelRegistry.js";
import { describeError, isUserRejection } from "./errorMessages.js";
import FormField from "./FormField.jsx";
import {
  focusFirstInvalid,
  hasErrors,
  MAX_NAME_LENGTH,
  MAX_REASON_LENGTH,
  validateLookupVersion,
  validateModelName,
  validateReason,
} from "./formValidation.js";
import RecordDetails from "./RecordDetails.jsx";
import TransactionStatus, { BUSY_PHASES, TX_PHASE } from "./TransactionStatus.jsx";
import WalletNotice from "./WalletNotice.jsx";

const IDLE_LOOKUP = { state: "idle" };
const IDLE_TX = { phase: TX_PHASE.IDLE };

export default function ModelDetails({ wallet }) {
  const lookupRef = useRef(null);
  const revokeRef = useRef(null);
  const [query, setQuery] = useState({ modelName: "", version: "" });
  const [lookup, setLookup] = useState(IDLE_LOOKUP);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [tx, setTx] = useState(IDLE_TX);

  const record = lookup.state === "loaded" ? lookup.record : null;
  const revoking = BUSY_PHASES.includes(tx.phase);
  const loading = lookup.state === "loading";

  const isRecordPublisher =
    Boolean(record && wallet.address) &&
    wallet.address.toLowerCase() === String(record.publisher).toLowerCase();
  const canRevoke =
    Boolean(record) &&
    !record.revoked &&
    Boolean(wallet.address) &&
    !wallet.wrongNetwork &&
    (isRecordPublisher || wallet.roles.isAdmin);

  function updateQuery(event) {
    const { name, value } = event.target;
    setQuery((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function loadRecord(modelName, version) {
    setLookup({ state: "loading" });
    try {
      if (!(await modelExists(modelName, version))) {
        setLookup({ state: "not-found", modelName, version });
        return;
      }
      setLookup({ state: "loaded", record: await getModel(modelName, version) });
    } catch (err) {
      console.error("LOAD MODEL ERROR:", err);
      setLookup({ state: "error", error: describeError(err, "Failed to load the record.") });
    }
  }

  async function handleLookup(event) {
    event.preventDefault();
    const nextErrors = {
      modelName: validateModelName(query.modelName),
      version: validateLookupVersion(query.version),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(lookupRef.current));
      return;
    }

    setReason("");
    setConfirmed(false);
    setTx(IDLE_TX);
    await loadRecord(query.modelName.trim(), query.version.trim());
  }

  async function handleRevoke(event) {
    event.preventDefault();
    const nextErrors = {
      reason: validateReason(reason),
      confirmed: confirmed ? "" : "Tick the box to confirm that revocation is permanent.",
    };
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => focusFirstInvalid(revokeRef.current));
      return;
    }

    const { modelName, version } = record;
    try {
      setTx({ phase: TX_PHASE.SIGNING });
      const sent = await revokeModel(modelName, version, reason.trim());

      setTx({ phase: TX_PHASE.PENDING, txHash: sent.hash });
      const receipt = await sent.wait();

      setTx({
        phase: TX_PHASE.SUCCESS,
        txHash: sent.hash,
        blockNumber: receipt?.blockNumber,
        release: `${modelName} ${version}`,
      });
      setReason("");
      setConfirmed(false);

      // Reload so the revoked status and reason come from the chain itself.
      await loadRecord(modelName, version);
    } catch (err) {
      console.error("REVOKE MODEL ERROR:", err);
      setTx((current) => ({
        ...current,
        phase: isUserRejection(err) ? TX_PHASE.REJECTED : TX_PHASE.FAILED,
        error: describeError(err, "Failed to revoke the model."),
      }));
    }
  }

  function handleClear() {
    setQuery({ modelName: "", version: "" });
    setLookup(IDLE_LOOKUP);
    setReason("");
    setConfirmed(false);
    setErrors({});
    setTx(IDLE_TX);
  }

  return (
    <section className="card details" aria-labelledby="details-title">
      <p className="section-label">Registry record</p>
      <h2 id="details-title">Model details</h2>
      <p className="muted">
        Look up a registered version to see its publisher, hashes,
        registration time, and revocation status.
      </p>

      <WalletNotice wallet={wallet} action="look up records" />

      <form ref={lookupRef} className="form form-lookup" onSubmit={handleLookup} noValidate>
        <fieldset disabled={!wallet.canRead || loading || revoking}>
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
            required
            value={query.version}
            onChange={updateQuery}
          />
          <div className="actions">
            <button type="submit">{loading ? "Loading…" : "Look up record"}</button>
            <button type="button" className="button-secondary" onClick={handleClear}>
              Clear
            </button>
          </div>
        </fieldset>
      </form>

      <div aria-live="polite">
        {lookup.state === "idle" && (
          <p className="empty-state">
            No record loaded yet. Enter a model name and version above.
          </p>
        )}
        {loading && (
          <p className="notice notice-info">
            <span className="spinner" aria-hidden="true" /> Reading the registry…
          </p>
        )}
        {lookup.state === "not-found" && (
          <p className="empty-state">
            No record exists for “{lookup.modelName}” version “{lookup.version}”.
            Names and versions are case-sensitive.
          </p>
        )}
        {lookup.state === "error" && (
          <p className="notice notice-error" role="alert">
            {lookup.error}
          </p>
        )}
        {record && <RecordDetails record={record} />}
      </div>

      {canRevoke && (
        <form ref={revokeRef} className="form revoke-form" onSubmit={handleRevoke} noValidate>
          <fieldset disabled={revoking}>
            <legend>Revoke this version</legend>
            <p className="field-hint">
              Your wallet is {isRecordPublisher ? "the original publisher" : "an administrator"}.
              Revocation is permanent: the record stays visible but is marked as no
              longer trusted.
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
            <div className={`checkbox${errors.confirmed ? " field-invalid" : ""}`}>
              <input
                id="revoke-confirm"
                type="checkbox"
                checked={confirmed}
                aria-invalid={errors.confirmed ? "true" : "false"}
                aria-describedby={errors.confirmed ? "revoke-confirm-error" : undefined}
                onChange={(event) => {
                  setConfirmed(event.target.checked);
                  setErrors((current) => ({ ...current, confirmed: "" }));
                }}
              />
              <label htmlFor="revoke-confirm">
                I understand that {record.modelName} {record.version} will be
                permanently marked as revoked.
              </label>
            </div>
            {errors.confirmed && (
              <p id="revoke-confirm-error" className="field-error">
                {errors.confirmed}
              </p>
            )}
            <div className="actions">
              <button type="submit" className="button-danger">
                {revoking ? "Revoking…" : "Revoke version"}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {record && !record.revoked && !canRevoke && tx.phase === TX_PHASE.IDLE && (
        <p className="notice notice-info">
          {wallet.address
            ? "The connected wallet is neither this version's publisher nor an administrator, so it can't revoke it."
            : "To revoke this version, connect the wallet that registered it or an administrator wallet."}
        </p>
      )}

      <TransactionStatus
        phase={tx.phase}
        txHash={tx.txHash}
        blockNumber={tx.blockNumber}
        text={{
          [TX_PHASE.SUCCESS]: tx.release
            ? `${tx.release} is now revoked. Its record stays on-chain for auditing.`
            : undefined,
          [TX_PHASE.FAILED]: tx.error,
        }}
      />
    </section>
  );
}
