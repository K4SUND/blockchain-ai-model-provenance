/**
 * Transaction progress and outcome (UI-03), shared by registration and
 * revocation so both show the same stages and wording.
 */

export const TX_PHASE = {
  IDLE: "idle",
  PREPARING: "preparing",
  SIGNING: "signing",
  PENDING: "pending",
  SUCCESS: "success",
  REJECTED: "rejected",
  FAILED: "failed",
};

export const BUSY_PHASES = [TX_PHASE.PREPARING, TX_PHASE.SIGNING, TX_PHASE.PENDING];

const STEPS = [
  { phase: TX_PHASE.PREPARING, label: "Prepare" },
  { phase: TX_PHASE.SIGNING, label: "Confirm in MetaMask" },
  { phase: TX_PHASE.PENDING, label: "Wait for block" },
  { phase: TX_PHASE.SUCCESS, label: "Confirmed" },
];

const DEFAULT_TEXT = {
  [TX_PHASE.PREPARING]: "Preparing the transaction…",
  [TX_PHASE.SIGNING]:
    "Confirm the transaction in MetaMask. If no window appears, click the MetaMask icon in the browser toolbar.",
  [TX_PHASE.PENDING]: "Transaction sent. Waiting for it to be included in a block…",
  [TX_PHASE.SUCCESS]: "Transaction confirmed.",
  [TX_PHASE.REJECTED]:
    "You cancelled the transaction in MetaMask. Nothing was changed on the blockchain.",
  [TX_PHASE.FAILED]: "The transaction failed.",
};

/**
 * @param {object} props
 * @param {string} props.phase one of TX_PHASE
 * @param {string} [props.txHash]
 * @param {number} [props.blockNumber]
 * @param {Partial<Record<string, string>>} [props.text] wording overrides per phase
 */
export default function TransactionStatus({ phase, txHash, blockNumber, text = {} }) {
  if (!phase || phase === TX_PHASE.IDLE) return null;

  const message = text[phase] || DEFAULT_TEXT[phase];
  const ended = phase === TX_PHASE.REJECTED || phase === TX_PHASE.FAILED;
  const current = STEPS.findIndex((step) => step.phase === phase);

  return (
    <div
      className={`tx-status tx-${phase}`}
      role={phase === TX_PHASE.FAILED ? "alert" : "status"}
    >
      {!ended && (
        <ol className="tx-steps" aria-label="Transaction progress">
          {STEPS.map((step, index) => {
            const done = index < current || phase === TX_PHASE.SUCCESS;
            const active = index === current && phase !== TX_PHASE.SUCCESS;
            return (
              <li
                key={step.phase}
                className={done ? "is-done" : active ? "is-current" : undefined}
                aria-current={active ? "step" : undefined}
              >
                <span className="tx-dot" aria-hidden="true">
                  {done ? "✓" : index + 1}
                </span>
                {step.label}
                {done && <span className="visually-hidden"> (done)</span>}
              </li>
            );
          })}
        </ol>
      )}

      <p className="tx-message">
        {ended && (
          <strong>
            {phase === TX_PHASE.REJECTED ? "Cancelled. " : "Failed. "}
          </strong>
        )}
        {message}
      </p>

      {txHash && (
        <p className="tx-meta">
          Transaction <code className="hash">{txHash}</code>
          {blockNumber != null && <> · block {blockNumber}</>}
        </p>
      )}
    </div>
  );
}
