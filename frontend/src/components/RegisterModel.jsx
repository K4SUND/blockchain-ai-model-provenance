/**
 * TODO(FE-04): Publisher-only registration form.
 *
 * Required fields:
 * - model name and semantic version;
 * - local model file;
 * - local provenance-manifest JSON file; and
 * - optional public metadata URI.
 *
 * Hash both files locally before sending only their hashes and metadata to the
 * smart contract. Never upload a selected model as part of this component.
 */
export default function RegisterModel() {
  return (
    <section className="card" aria-labelledby="register-title">
      <p className="section-label">Publisher action</p>
      <h2 id="register-title">Register a model</h2>
      <p>
        Authorized publishers will create immutable records for new model
        versions here.
      </p>
      <ul className="todo-list">
        <li>Collect release metadata</li>
        <li>Hash model and manifest locally</li>
        <li>Confirm and submit the transaction</li>
      </ul>
    </section>
  );
}

