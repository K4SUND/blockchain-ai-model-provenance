import { shortenAddress } from "./format.js";

function roleLabel(roles) {
  if (!roles.checked) return "Checking role…";
  if (roles.isAdmin && roles.isPublisher) return "Administrator · Publisher";
  if (roles.isAdmin) return "Administrator";
  if (roles.isPublisher) return "Publisher";
  return "Verifier (no special role)";
}

/**
 * Wallet, network, role, and registry status. The state itself lives in
 * useWallet so every panel sees the same account.
 *
 * @param {object} props
 * @param {ReturnType<import("../hooks/useWallet.js").default>} props.wallet
 */
export default function WalletPanel({ wallet }) {
  const connected = Boolean(wallet.address);

  return (
    <section className="panel wallet" aria-labelledby="wallet-title">
      <div className="wallet-summary">
        <p className="section-label">Connection</p>
        <h2 id="wallet-title">Wallet and network</h2>

        {!wallet.detected && (
          <p className="muted">
            MetaMask was not detected.{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
              Install MetaMask
            </a>{" "}
            and reload this page.
          </p>
        )}

        {wallet.detected && !connected && (
          <p className="muted">
            Verifying needs no account. Connect a wallet to register or revoke
            models.
          </p>
        )}

        {connected && (
          <dl className="wallet-facts">
            <div>
              <dt>Account</dt>
              <dd>
                <code className="hash" title={wallet.address}>
                  {shortenAddress(wallet.address)}
                </code>
              </dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>
                {wallet.wrongNetwork ? (
                  <span className="badge badge-warning">
                    Wrong network (chain {wallet.chainId})
                  </span>
                ) : (
                  <span className="badge badge-active">
                    Hardhat Local ({wallet.chainId})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <span className="badge badge-role">
                  {wallet.wrongNetwork ? "Unknown" : roleLabel(wallet.roles)}
                </span>
              </dd>
            </div>
          </dl>
        )}

        {wallet.registryReady === false && (
          <p className="notice notice-warning" role="status">
            Registry contract not deployed. Run npm run deploy:local, then
            reload.
          </p>
        )}
        {wallet.registryReady && (
          <p className="wallet-registry">
            Registry contract{" "}
            <code className="hash" title={wallet.registryAddress}>
              {shortenAddress(wallet.registryAddress)}
            </code>
          </p>
        )}

        {wallet.error && (
          <p className="notice notice-error" role="alert">
            {wallet.error}
          </p>
        )}
      </div>

      <div className="wallet-actions">
        {wallet.detected && !connected && (
          <button type="button" onClick={wallet.connect} disabled={wallet.connecting}>
            {wallet.connecting ? "Check MetaMask…" : "Connect wallet"}
          </button>
        )}
        {wallet.detected && wallet.wrongNetwork && (
          <button type="button" onClick={wallet.switchNetwork}>
            Switch to Hardhat Local
          </button>
        )}
      </div>
    </section>
  );
}
