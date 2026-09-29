import { shortenAddress } from "./format.js";

/**
 * Explains why a panel is disabled and what the user should do next.
 * Returns null when the panel is ready to use.
 *
 * @param {object} props
 * @param {ReturnType<import("../hooks/useWallet.js").default>} props.wallet
 * @param {string} props.action what the panel does, e.g. "register models"
 * @param {boolean} [props.needsAccount=false] a connected account is required
 * @param {boolean} [props.needsPublisher=false] PUBLISHER_ROLE is required
 */
export default function WalletNotice({
  wallet,
  action,
  needsAccount = false,
  needsPublisher = false,
}) {
  let tone = "info";
  let message = null;

  if (!wallet.detected) {
    message = `Install the MetaMask browser extension to ${action}. ModelGuard reads the blockchain through your wallet.`;
  } else if (wallet.registryReady === false) {
    tone = "warning";
    message =
      "The registry contract isn't deployed. Start the local node (npm run node), run npm run deploy:local, then reload this page.";
  } else if (wallet.wrongNetwork) {
    tone = "warning";
    message = `MetaMask is on the wrong network. Switch to Hardhat Local (chain ${wallet.expectedChainId}) using the button at the top of the page.`;
  } else if (needsAccount && !wallet.address) {
    message = `Connect a wallet at the top of the page to ${action}.`;
  } else if (needsPublisher && wallet.roles.checked && !wallet.roles.isPublisher) {
    tone = "warning";
    message = `The connected wallet (${shortenAddress(wallet.address)}) is not an authorized publisher. Switch to a publisher account in MetaMask to ${action}. Anyone can still verify models.`;
  }

  if (!message) return null;
  return (
    <p className={`notice notice-${tone}`} role="status">
      {message}
    </p>
  );
}
