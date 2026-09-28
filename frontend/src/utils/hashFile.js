/**
 * Convert binary bytes into the 0x-prefixed hexadecimal format expected by a
 * Solidity bytes32 value.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
  return (
    "0x" +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Calculate the SHA-256 digest of a browser File without uploading it.
 *
 * @param {File} file Model or provenance-manifest file selected by the user
 * @returns {Promise<string>} 0x-prefixed 32-byte hexadecimal digest
 */
export async function hashFile(file) {
  if (!(file instanceof File)) {
    throw new TypeError("A valid File must be provided.");
  }

  const bytes = await file.arrayBuffer();

  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return bytesToHex(new Uint8Array(digest));
}
