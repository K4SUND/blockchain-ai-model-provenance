// /**
//  * TODO(FE-02):
//  * - Detect an EIP-1193 browser wallet.
//  * - Connect with ethers.BrowserProvider.
//  * - Display the address, chain ID, and authorization role.
//  * - Warn when the selected network is not configured.
//  */
// export default function WalletPanel() {
//   return (
//     <section className="panel" aria-labelledby="wallet-title">
//       <div>
//         <p className="section-label">Connection</p>
//         <h2 id="wallet-title">Wallet and network</h2>
//         <p className="muted">Wallet integration is ready to be implemented.</p>
//       </div>
//       <button type="button" disabled>
//         Connect wallet
//       </button>
//     </section>
//   );
// }

import { useEffect, useState } from "react";
import {
  hasWallet,
  connectWallet,
  switchToConfiguredNetwork,
  CONFIG,
} from "../services/modelRegistry";

export default function WalletPanel() {
  const [walletDetected, setWalletDetected] = useState(false);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!hasWallet()) {
      setWalletDetected(false);
      return;
    }

    setWalletDetected(true);

    const updateWalletState = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        setAddress(accounts[0] || "");
        setChainId(parseInt(currentChainId, 16));
      } catch (err) {
        setError(err.message || "Unable to read wallet state.");
      }
    };

    updateWalletState();

    const handleAccountsChanged = (accounts) => {
      setAddress(accounts[0] || "");
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  async function handleConnect() {
    setError("");
    setConnecting(true);

    try {
      const result = await connectWallet();

      setAddress(result.address);
      setChainId(result.chainId);
    } catch (err) {
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSwitchNetwork() {
    setError("");

    try {
      await switchToConfiguredNetwork();

      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setChainId(parseInt(currentChainId, 16));
    } catch (err) {
      setError(err.message || "Failed to switch network.");
    }
  }

  const wrongNetwork =
    chainId !== null && chainId !== CONFIG.chainId;

  return (
    <section className="panel" aria-labelledby="wallet-title">
      <div>
        <p className="section-label">Connection</p>

        <h2 id="wallet-title">Wallet and network</h2>

        {!walletDetected && (
          <p className="muted">
            MetaMask was not detected. Please install MetaMask.
          </p>
        )}

        {walletDetected && !address && (
          <p className="muted">
            MetaMask detected. Connect your wallet to continue.
          </p>
        )}

        {address && (
          <div>
            <p>
              <strong>Address:</strong> {address}
            </p>

            <p>
              <strong>Chain ID:</strong> {chainId}
            </p>

            {wrongNetwork ? (
              <div>
                <p className="error">
                  Wrong network. Expected Hardhat Local
                  (Chain ID {CONFIG.chainId}).
                </p>

                <button
                  type="button"
                  onClick={handleSwitchNetwork}
                >
                  Switch to Hardhat
                </button>
              </div>
            ) : (
              <p>
                <strong>Network:</strong> Hardhat Local
              </p>
            )}
          </div>
        )}
      </div>

      {!address && (
        <button
          type="button"
          disabled={!walletDetected || connecting}
          onClick={handleConnect}
        >
          {connecting ? "Connecting..." : "Connect wallet"}
        </button>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}