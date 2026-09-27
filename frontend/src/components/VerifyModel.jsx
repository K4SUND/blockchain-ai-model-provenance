/**
 * TODO(FE-05): Public, read-only verification flow.
 *
 * Calculate the selected file's SHA-256 hash, fetch the name/version record,
 * then present exactly one state: verified, mismatch, revoked, or not found.
 */
export default function VerifyModel() {
  return (
    <section className="card" aria-labelledby="verify-title">
      <p className="section-label">Public action</p>
      <h2 id="verify-title">Verify a model</h2>
      <p>
        Verifiers will compare a local model fingerprint with its registered
        blockchain record here.
      </p>
      <ul className="todo-list">
        <li>Select model name and version</li>
        <li>Hash a local file without uploading it</li>
        <li>Display a clear verification result</li>
      </ul>
    </section>
  );
}

