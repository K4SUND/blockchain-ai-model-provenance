import ModelDetails from "./components/ModelDetails.jsx";
import RegisterModel from "./components/RegisterModel.jsx";
import VerifyModel from "./components/VerifyModel.jsx";
import WalletPanel from "./components/WalletPanel.jsx";
import useWallet from "./hooks/useWallet.js";

/**
 * Page layout. Wallet state is held once here and passed to every panel,
 * so switching accounts in MetaMask updates all of them together.
 */
export default function App() {
  const wallet = useWallet();

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">AI supply-chain integrity</p>
        <h1>ModelGuard</h1>
        <p>
          Register, inspect, and verify AI model artifacts using immutable
          blockchain records.
        </p>
      </header>

      <WalletPanel wallet={wallet} />

      <div className="workspace-grid">
        <RegisterModel wallet={wallet} />
        <VerifyModel wallet={wallet} />
      </div>

      <ModelDetails wallet={wallet} />
    </main>
  );
}
