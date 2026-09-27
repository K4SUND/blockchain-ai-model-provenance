/**
 * TODO(FE-02):
 * - Detect an EIP-1193 browser wallet.
 * - Connect with ethers.BrowserProvider.
 * - Display the address, chain ID, and authorization role.
 * - Warn when the selected network is not configured.
 */
export default function WalletPanel() {
  return (
    <section className="panel" aria-labelledby="wallet-title">
      <div>
        <p className="section-label">Connection</p>
        <h2 id="wallet-title">Wallet and network</h2>
        <p className="muted">Wallet integration is ready to be implemented.</p>
      </div>
      <button type="button" disabled>
        Connect wallet
      </button>
    </section>
  );
}

