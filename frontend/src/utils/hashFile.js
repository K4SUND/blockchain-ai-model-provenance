/**
 * Convert binary bytes into the 0x-prefixed hexadecimal format expected by a
 * Solidity bytes32 value.
 *
 * TODO(FE-03): Implement this helper and add unit tests before using it for
 * registrations. The same helper must be used by registration and verification.
 */
function bytesToHex(_bytes) {
  throw new Error("TODO(FE-03): implement bytesToHex");
}

/**
 * Calculate the SHA-256 digest of a browser File without uploading it.
 *
 * @param {File} _file model or provenance-manifest file selected by the user
 * @returns {Promise<string>} 0x-prefixed 32-byte hexadecimal digest
 */
export async function hashFile(_file) {
  // Intended implementation:
  // 1. validate that a File was supplied;
  // 2. await file.arrayBuffer();
  // 3. await crypto.subtle.digest("SHA-256", bytes);
  // 4. return bytesToHex(new Uint8Array(digest)).
  bytesToHex(new Uint8Array());
  throw new Error("TODO(FE-03): implement hashFile");
}

