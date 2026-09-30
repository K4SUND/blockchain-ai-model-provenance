/** Display helpers shared by the record and result components. */

export function formatTimestamp(timestamp) {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  return new Date(seconds * 1000).toLocaleString();
}

export function shortenAddress(address) {
  if (!address) return "—";
  const text = String(address);
  return `${text.slice(0, 6)}…${text.slice(-4)}`;
}

export function sameHash(a, b) {
  return Boolean(a && b) && String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Metadata URIs are publisher-supplied and untrusted. Only plain http(s)
 * addresses become links; anything else (ipfs://, javascript:, ...) is
 * shown as text.
 */
export function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}
