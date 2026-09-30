import { useCallback, useEffect, useState } from "react";
import { id } from "ethers";
import { describeError } from "../components/errorMessages.js";
import {
  CONFIG,
  connectWallet,
  getRegistryAddress,
  hasRole,
  hasWallet,
  switchToConfiguredNetwork,
} from "../services/modelRegistry.js";

export const PUBLISHER_ROLE = id("PUBLISHER_ROLE");
export const DEFAULT_ADMIN_ROLE = "0x" + "0".repeat(64);

const NO_ROLES = { checked: false, isAdmin: false, isPublisher: false };

/**
 * Shared wallet state for every panel: detected wallet, connected account,
 * network, registry deployment, and the account's contract roles.
 * Follows MetaMask account and network switches without a page reload.
 */
export default function useWallet() {
  const [detected] = useState(hasWallet);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(null);
  const [registryAddress, setRegistryAddress] = useState(null);
  const [registryReady, setRegistryReady] = useState(null);
  const [roles, setRoles] = useState(NO_ROLES);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const wrongNetwork = chainId !== null && chainId !== CONFIG.chainId;

  useEffect(() => {
    getRegistryAddress().then(
      (value) => {
        setRegistryAddress(value);
        setRegistryReady(true);
      },
      () => setRegistryReady(false),
    );
  }, []);

  useEffect(() => {
    if (!detected) return undefined;
    const ethereum = window.ethereum;

    // eth_accounts and eth_chainId never open a MetaMask prompt.
    ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => setAddress(accounts[0] ?? ""))
      .catch(() => {});
    ethereum
      .request({ method: "eth_chainId" })
      .then((hex) => setChainId(parseInt(hex, 16)))
      .catch(() => {});

    const onAccountsChanged = (accounts) => setAddress(accounts[0] ?? "");
    const onChainChanged = (hex) => setChainId(parseInt(hex, 16));

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged", onChainChanged);
    return () => {
      ethereum.removeListener("accountsChanged", onAccountsChanged);
      ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [detected]);

  useEffect(() => {
    setRoles(NO_ROLES);
    if (!address || wrongNetwork || !registryReady) return undefined;

    let cancelled = false;
    Promise.all([
      hasRole(DEFAULT_ADMIN_ROLE, address),
      hasRole(PUBLISHER_ROLE, address),
    ])
      .then(([isAdmin, isPublisher]) => {
        if (cancelled) return;
        setRoles({ checked: true, isAdmin, isPublisher });
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("ROLE CHECK ERROR:", err);
        setError(describeError(err, "Couldn't read this wallet's role."));
      });

    return () => {
      cancelled = true;
    };
  }, [address, chainId, wrongNetwork, registryReady]);

  const connect = useCallback(async () => {
    setError("");
    setConnecting(true);
    try {
      const result = await connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
    } catch (err) {
      console.error("CONNECT ERROR:", err);
      setError(describeError(err, "Couldn't connect the wallet."));
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    setError("");
    try {
      await switchToConfiguredNetwork();
    } catch (err) {
      console.error("SWITCH NETWORK ERROR:", err);
      setError(describeError(err, "Couldn't switch the network."));
    }
  }, []);

  return {
    detected,
    address,
    chainId,
    expectedChainId: CONFIG.chainId,
    wrongNetwork,
    registryAddress,
    registryReady,
    roles,
    connecting,
    error,
    connect,
    switchNetwork,
    /** Reading the registry needs MetaMask on the right network and a deployment. */
    canRead: detected && !wrongNetwork && registryReady === true,
  };
}
