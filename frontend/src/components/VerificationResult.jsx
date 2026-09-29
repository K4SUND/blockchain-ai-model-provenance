import { VERIFICATION_STATUS } from "../utils/appState.js";
import { formatTimestamp, sameHash, shortenAddress } from "./format.js";

/**
 * The single verification outcome (UI-02). Each state differs in colour,
 * icon, and heading text, so it never relies on colour alone.
 */

const STATES = {
  [VERIFICATION_STATUS.VERIFIED]: {
    tone: "verified",
    icon: "✓",
    title: "Verified — active registered model",
  },
  [VERIFICATION_STATUS.MISMATCH]: {
    tone: "mismatch",
    icon: "✕",
    title: "Hash mismatch — file may have been modified",
  },
  [VERIFICATION_STATUS.REVOKED]: {
    tone: "revoked",
    icon: "!",
    title: "Revoked — this version must not be used",
  },
  [VERIFICATION_STATUS.NOT_FOUND]: {
    tone: "not-found",
    icon: "?",
    title: "Not registered — no matching model and version",
  },
};

function explanation(status, query, record, hashMatches) {
  const release = `${query.modelName} ${query.version}`;
  switch (status) {
    case VERIFICATION_STATUS.VERIFIED:
      return `This file is byte-for-byte identical to ${release}, registered by ${shortenAddress(record.publisher)} on ${formatTimestamp(record.registeredAt)}.`;
    case VERIFICATION_STATUS.MISMATCH:
      return `This file is not the registered ${release}. Even a one-byte change produces a different fingerprint. Do not use this file.`;
    case VERIFICATION_STATUS.REVOKED:
      return hashMatches
        ? `The file matches the registered ${release}, but the publisher has revoked this version.`
        : `This version has been revoked, and the file doesn't match the registered release either.`;
    case VERIFICATION_STATUS.NOT_FOUND:
      return `No record exists for "${query.modelName}" version "${query.version}". Names and versions are case-sensitive, so check both exactly as the publisher registered them.`;
    default:
      return "";
  }
}

/**
 * @param {object} props
 * @param {string} props.status one of VERIFICATION_STATUS
 * @param {{modelName: string, version: string}} props.query
 * @param {string} props.localHash SHA-256 of the selected file
 * @param {object} [props.record] registry record, absent when not found
 */
export default function VerificationResult({ status, query, localHash, record }) {
  const state = STATES[status];
  if (!state) return null;

  const hashMatches = record ? sameHash(localHash, record.modelHash) : false;

  return (
    <div className={`result result-${state.tone}`} role="status">
      <div className="result-heading">
        <span className="result-icon" aria-hidden="true">
          {state.icon}
        </span>
        <h3>{state.title}</h3>
      </div>

      <p>{explanation(status, query, record, hashMatches)}</p>

      {status === VERIFICATION_STATUS.REVOKED && record?.revocationReason && (
        <p>
          <strong>Reason given:</strong> {record.revocationReason}
        </p>
      )}

      <dl className="hash-compare">
        <div>
          <dt>Your file (SHA-256)</dt>
          <dd>
            <code className="hash">{localHash}</code>
          </dd>
        </div>
        {record && (
          <div>
            <dt>Registered on-chain</dt>
            <dd>
              <code className="hash">{record.modelHash}</code>
            </dd>
          </div>
        )}
      </dl>

      {record && (
        <p className="result-match">
          {hashMatches ? "✓ Fingerprints match" : "✕ Fingerprints differ"}
        </p>
      )}
    </div>
  );
}
