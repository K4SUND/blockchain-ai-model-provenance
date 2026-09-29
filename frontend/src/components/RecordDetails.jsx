import { formatTimestamp, safeHttpUrl } from "./format.js";

/**
 * Read-only view of one registry record: hashes, publisher, time, and
 * active/revoked status with the revocation reason.
 */
export default function RecordDetails({ record }) {
  const metadataLink = record.metadataURI ? safeHttpUrl(record.metadataURI) : null;

  return (
    <div className="record">
      <div className="record-header">
        <div>
          <p className="section-label">Blockchain record</p>
          <h3>
            {record.modelName} <span className="muted">v{record.version}</span>
          </h3>
        </div>
        <span className={`badge ${record.revoked ? "badge-revoked" : "badge-active"}`}>
          {record.revoked ? "Revoked" : "Active"}
        </span>
      </div>

      <dl className="record-grid">
        <div className="record-wide">
          <dt>Model hash (SHA-256)</dt>
          <dd>
            <code className="hash">{record.modelHash}</code>
          </dd>
        </div>
        <div className="record-wide">
          <dt>Provenance hash (SHA-256)</dt>
          <dd>
            <code className="hash">{record.provenanceHash}</code>
          </dd>
        </div>
        <div>
          <dt>Publisher</dt>
          <dd>
            <code className="hash">{record.publisher}</code>
          </dd>
        </div>
        <div>
          <dt>Registered</dt>
          <dd>{formatTimestamp(record.registeredAt)}</dd>
        </div>
        <div className="record-wide">
          <dt>Metadata URI</dt>
          <dd>
            {!record.metadataURI && "None provided"}
            {record.metadataURI && metadataLink && (
              <a href={metadataLink} target="_blank" rel="noopener noreferrer">
                {record.metadataURI}
              </a>
            )}
            {record.metadataURI && !metadataLink && record.metadataURI}
          </dd>
        </div>
        {record.revoked && (
          <div className="record-wide record-revoked">
            <dt>Revocation reason</dt>
            <dd>{record.revocationReason || "—"}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
