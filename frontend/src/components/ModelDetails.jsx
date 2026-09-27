/**
 * TODO(FE-06): Show the complete registry record and audit information.
 * Add the revoke action only when the connected signer is allowed to use it.
 */
export default function ModelDetails() {
  return (
    <section className="panel details" aria-labelledby="details-title">
      <p className="section-label">Registry record</p>
      <h2 id="details-title">Model details</h2>
      <p className="muted">
        Search results, publisher information, hashes, timestamps, and
        revocation history will appear here.
      </p>
    </section>
  );
}

