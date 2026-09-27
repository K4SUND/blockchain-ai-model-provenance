import ModelDetails from "./components/ModelDetails.jsx";
import RegisterModel from "./components/RegisterModel.jsx";
import VerifyModel from "./components/VerifyModel.jsx";
import WalletPanel from "./components/WalletPanel.jsx";

/**
 * Initial collaboration shell. Components show their intended responsibilities
 * and can be implemented independently on separate feature branches.
 */
export default function App() {
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

      <WalletPanel />

      <div className="workspace-grid">
        <RegisterModel />
        <VerifyModel />
      </div>

      <ModelDetails />
    </main>
  );
}

