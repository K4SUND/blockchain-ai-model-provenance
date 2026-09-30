# ModelGuard manual end-to-end testing guide

This guide lets one person test ModelGuard from beginning to end with two local MetaMask accounts. It covers registration, authorization, record lookup, verification, tamper detection, revocation, and version history.

All testing in this guide uses the local Hardhat blockchain. The accounts and test ETH have no real-world value.

## 1. Understand the two users

ModelGuard does not have usernames or application login accounts. The connected **wallet address is the user identity**.

| Test identity | Local wallet | Permissions |
|---|---|---|
| **Publisher/Admin** | Hardhat account 0 | Register models, read/verify records, and revoke models |
| **Ordinary verifier** | Hardhat account 1 or any other account | Read and verify records, but cannot register or revoke |

For the standard local deployment, `ignition/parameters/localhost.json` assigns the Publisher/Admin role to this address:

```text
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

This is normally the first account printed by `npm run node`. Import the private key printed beside that address into MetaMask only for local testing.

> Never send real cryptocurrency to a Hardhat account. Never use a Hardhat private key or seed phrase on a public network.

## 2. What “history” means in the current application

The current frontend does **not** have a page that lists every model or every transaction chronologically.

The blockchain audit history is demonstrated in two ways:

1. Revoking a model does not delete it. The same name and version can still be loaded, showing its publisher, registration time, revoked status, and permanent revocation reason.
2. Different versions are separate permanent records. For example, `DemoClassifier` version `1.0.0` can remain revoked while version `1.1.0` remains active. Load each version separately to inspect it.

The contract also emits registration and revocation events, but the current UI does not contain an event-history browser.

## 3. One-time project setup

Install the root and frontend dependencies from the repository root:

```bash
npm ci
npm --prefix frontend ci
```

Validate the project:

```bash
npm run check
```

The complete automated suite should report **37 passing tests**, followed by a successful frontend build.

## 4. Prepare the model files

The provenance manifest is already present:

```text
sample-models/mnist-12-manifest.json
```

The two ONNX files are intentionally not committed. In Windows PowerShell, run these commands from the repository root:

```powershell
Invoke-WebRequest -Uri "https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-12.onnx" -OutFile "sample-models\mnist-12-original.onnx"

Copy-Item "sample-models\mnist-12-original.onnx" "sample-models\mnist-12-modified.onnx"

node -e "const fs=require('fs');const f='sample-models/mnist-12-modified.onnx';const b=fs.readFileSync(f);for(const o of [13000,13001,13002,13003])b[o]^=1;fs.writeFileSync(f,b)"
```

Check the files:

```powershell
Get-FileHash "sample-models\mnist-12-original.onnx" -Algorithm SHA256
Get-FileHash "sample-models\mnist-12-modified.onnx" -Algorithm SHA256
Get-FileHash "sample-models\mnist-12-manifest.json" -Algorithm SHA256
```

Expected hashes:

| File | Expected SHA-256 |
|---|---|
| Original model | `5C688690F8BACF667D4C2074AF5AD0646CA328D7AB03ECCF944A65B320171BDD` |
| Modified model | `3B18A736AD8AF386BE07EB9DF87B5D75E659EFCCC4FC178AFD52B4EDFD648F8F` |
| Manifest | `A8DEA1E117FDACA553263B0862F7F17B8230D98E319E4EA98CA026CE81DC6D6D` |

If a hash differs, do not use that file for the expected-result tests until you understand why. Editing the manifest, including its whitespace or line endings, changes its hash.

## 5. Start a clean local session

Use three terminals. Keep terminals 1 and 3 running throughout the test.

### Terminal 1 — start the blockchain

```bash
npm run node
```

The terminal prints several temporary addresses and private keys. Keep it open and do not restart it during the test, because restarting clears the local blockchain state.

### Terminal 2 — deploy the contract

```bash
npm run deploy:local
```

Wait for the deployment and frontend export to complete. The command writes the live contract address to `frontend/src/contracts/deployment.json`; the current frontend reads that generated file automatically.

### Terminal 3 — start the frontend

```bash
npm run frontend:dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173
```

If the frontend was already running before deployment, restart it so it loads the newly exported contract record.

## 6. Configure MetaMask

### 6.0 Fix “MetaMask was not detected” first

Section 6 assumes that the **MetaMask browser extension is installed and enabled in the same desktop browser that opens ModelGuard**. The MetaMask mobile application by itself cannot inject a wallet into a normal desktop browser.

If ModelGuard displays:

```text
MetaMask was not detected. Please install MetaMask.
```

follow these steps before adding the Hardhat network:

1. Open ModelGuard in a normal desktop Chrome, Edge, Firefox, Brave, or Opera window. Do not use an editor's embedded preview browser or a private/incognito window.
2. Visit the official download page: <https://metamask.io/download/>.
3. Select your browser and install MetaMask from the official browser extension store. Avoid search advertisements and unofficial downloads.
4. Enable the extension and pin it to the browser toolbar.
5. Open MetaMask and complete its initial setup. For this local exercise, create a new empty development wallet; you do not need to buy or transfer real cryptocurrency.
6. Store its recovery information safely even though this is a development wallet. Never enter a real wallet's recovery phrase into ModelGuard or share it with anyone.
7. Unlock MetaMask and leave the extension enabled.
8. Return to the direct Vite URL, normally `http://localhost:5173`, and refresh the page.

ModelGuard should now display **MetaMask detected. Connect your wallet to continue** and enable the **Connect wallet** button. Only then continue with sections 6.1 and 6.2.

If MetaMask is already installed but ModelGuard still cannot detect it:

- confirm that you installed it in the same browser and browser profile containing the ModelGuard tab;
- open the browser's extensions page and confirm MetaMask is enabled;
- use a normal window, because extensions are commonly disabled in private/incognito windows;
- open `http://localhost:5173` directly instead of an embedded preview inside an editor or another application;
- close and reopen the ModelGuard tab after installing the extension;
- disable another wallet extension temporarily if it is taking control of `window.ethereum`; and
- in Brave, change the default Ethereum wallet setting so MetaMask can provide the page wallet, then restart Brave.

Do not continue to network setup while the page still says MetaMask was not detected. Network configuration is performed inside MetaMask, so the extension must be detected first.

### 6.1 Add the local network

**Do not select Avalanche, Ethereum Mainnet, or another public network for this test.** ModelGuard's contract is running only on the temporary blockchain created by terminal 1.

In MetaMask, open **Networks**, choose **Add a custom network**, and enter exactly:

```text
Network name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency symbol: ETH
Block explorer URL: leave blank
```

Save the network and select **Hardhat Local**. Alternatively, after connecting MetaMask to ModelGuard, use the application's **Switch to Hardhat** button and approve the request.

If MetaMask cannot validate the RPC URL or chain ID, confirm that terminal 1 is still running `npm run node`. Avalanche and Hardhat Local are different blockchains even though MetaMask can display both.

### 6.2 Import the two users

The network and the account have different purposes:

- **Hardhat Local** tells MetaMask which blockchain to contact.
- **The imported account** tells the smart contract which user is acting.

The contract gave publisher permission to Hardhat account 0 during deployment. A normal account created by MetaMask does not have that permission, which is why the temporary Hardhat account must be imported.

#### Import the Publisher/Admin account

1. Keep terminal 1, running `npm run node`, open.
2. Near the beginning of its output, find **Account #0**.
3. Confirm that its address is:

   ```text
   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

4. Directly below that account, find the line labelled **Private Key**. Copy that complete hexadecimal value, beginning with `0x`. Copy the key belonging to account 0, not its address.
5. Open the MetaMask extension.
6. Click the account selector at the top.
7. Select **Add wallet**.
8. Select **Import an account**. Do not choose **Import a wallet**, because that option asks for a recovery phrase.
9. Choose **Private key** if MetaMask displays an import-type selector.
10. Paste the account 0 private key into the private-key field.
11. Click **Import**.
12. After import, confirm that MetaMask displays the full address `0xf39F...2266` above.
13. Rename it `ModelGuard Publisher` if account naming is available.

#### Import the ordinary Verifier account

Repeat the same procedure using the **Private Key printed directly below Account #1** in terminal 1. Rename that imported account `ModelGuard Verifier`.

Do not use MetaMask's automatically created account as the publisher. It has a different address and was never granted the contract's publisher role. It may be kept as another unauthorized-user test account.

#### Confirm the import

1. Select **Hardhat Local**, not Avalanche.
2. Select `ModelGuard Publisher` in MetaMask.
3. The publisher should show a large balance of local test ETH.
4. Open ModelGuard and click **Connect wallet**.
5. Approve the site connection for the publisher account.
6. Confirm that ModelGuard shows chain ID `31337` and address `0xf39F...2266`.

Then switch to `ModelGuard Verifier` and confirm that ModelGuard changes to the account 1 address. These two addresses are the two users used by the remaining tests.

The imported Hardhat private keys are intentionally public development keys. Anyone can control them. Never send real ETH, AVAX, tokens, or NFTs to these addresses, and never use them on Avalanche, Ethereum Mainnet, or any other public network.

In summary, import these two keys from terminal 1:

- account 0, whose address must be `0xf39F...2266`;
- account 1, which will be the ordinary verifier.

## 7. How to change users correctly

To change the active ModelGuard user:

1. Open MetaMask.
2. Open the account selector.
3. Select `ModelGuard Publisher` or `ModelGuard Verifier`.
4. Confirm that the selected account is permitted to connect to `localhost:5173`. MetaMask may call this setting **Connected sites**, **Connections**, or **Account permissions**.
5. Return to ModelGuard and check the address in **Wallet and network**.
6. If the old address remains, refresh the page, click **Connect wallet**, and approve the newly selected account.

Always compare the address displayed by ModelGuard, not only the account name shown in MetaMask.

### Important behavior after switching

- **Register Model** uses whichever wallet is active when you click the button.
- **Verify Model** is read-only and does not request a transaction or spend gas.
- **Model Details** checks revoke permission when you click **Load Model**. If you switch accounts after loading a record, click **Load Model again** before looking for the revoke button.

## 8. Test 1 — model not found

Start with the ordinary verifier selected.

In **Verify a model**, enter:

```text
Model name: DemoClassifier
Version: 9.9.9
Model file: mnist-12-original.onnx
```

Click **Verify Model**.

Expected result:

```text
Model not found
```

This proves that the application does not treat an unregistered name/version pair as trusted.

## 9. Test 2 — unauthorized registration

Keep the ordinary verifier selected. In **Register a model**, enter:

```text
Model name: UnauthorizedModel
Version: 1.0.0
Model file: mnist-12-original.onnx
Provenance manifest: mnist-12-manifest.json
Metadata URI: leave blank
```

Click **Register Model**.

Expected result:

- the registration fails with an authorization or `AccessControl` error; or
- MetaMask warns that the transaction is likely to fail before submission.

The registration form is visible to all users, but the smart contract—not the UI—enforces the publisher permission. Do not confirm an obviously failing transaction if MetaMask warns about it; the authorization test has already succeeded.

## 10. Test 3 — successful publisher registration

Switch to `ModelGuard Publisher` and confirm that ModelGuard displays:

```text
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

In **Register a model**, enter:

```text
Model name: DemoClassifier
Version: 1.0.0
Model file: mnist-12-original.onnx
Provenance manifest: mnist-12-manifest.json
Metadata URI: https://github.com/onnx/models/tree/main/validated/vision/classification/mnist
```

Then:

1. Click **Register Model**.
2. Review the MetaMask transaction.
3. Confirm the transaction.
4. Wait for **Model registered successfully**.
5. Check that the displayed model hash begins with `0x5c688690...`.

Only the hashes and small metadata are sent to the contract. The ONNX file and JSON file remain on your computer.

## 11. Test 4 — duplicate registration rejection

While still using the publisher, submit exactly the same `DemoClassifier` and `1.0.0` registration again.

Expected result:

- the transaction is rejected with `ModelAlreadyExists`, or MetaMask predicts that it will fail.

The existing record must not be overwritten. A new release must use a different version.

## 12. Test 5 — inspect the active record

There are two useful read-only checks.

### Verify panel

Enter `DemoClassifier` and `1.0.0`, then:

- click **Check Model** to confirm that the record exists;
- click **Get Model** to view the complete record.

### Model Details panel

Enter the same name and version and click **Load Model**.

Expected values include:

- status: **Active**;
- publisher: the `0xf39F...2266` address;
- model and provenance hashes;
- registration date and time; and
- the metadata URI.

## 13. Test 6 — original file verification

Switch to `ModelGuard Verifier`. Confirm the new address in the Wallet panel.

In **Verify a model**, enter:

```text
Model name: DemoClassifier
Version: 1.0.0
Model file: mnist-12-original.onnx
```

Click **Verify Model**.

Expected result:

```text
Model verified
```

The local hash should match the registered `0x5c688690...` hash. No MetaMask confirmation should appear because verification is a read-only call.

## 14. Test 7 — modified file detection

Keep the verifier selected. Use the same name and version, but select:

```text
mnist-12-modified.onnx
```

Click **Verify Model**.

Expected result:

```text
Model mismatch
```

The local hash should begin with `0x3b18a736...`, which differs from the registered hash. This proves that a small file change is detectable.

## 15. Test 8 — unauthorized revocation

Keep the verifier selected. In **Model Details**:

1. Enter `DemoClassifier` and `1.0.0`.
2. Click **Load Model**.
3. Check **Current Wallet**.

Expected result:

- the record is readable;
- an information message says the connected wallet is not the publisher or administrator; and
- the **Revoke Model** action is hidden.

This is the UI-level authorization check. The contract also rejects a direct revocation call from this wallet, which is covered by the automated contract tests.

## 16. Test 9 — successful publisher revocation

1. Switch to `ModelGuard Publisher`.
2. Confirm the publisher address in the Wallet panel.
3. In **Model Details**, click **Load Model again** so permissions are recalculated for the new wallet.
4. Confirm that the **Revoke model** section now appears.
5. Enter this reason:

```text
Model weights found to be compromised
```

6. Click **Revoke Model**.
7. Confirm the MetaMask transaction.
8. Wait for **Model successfully revoked**.

Expected result:

- status changes to **Revoked**;
- the public reason remains visible; and
- the original registration record is still displayed rather than deleted.

Revocation is permanent. The same `DemoClassifier` version `1.0.0` cannot be made active again or registered again.

## 17. Test 10 — verify a revoked release

Switch back to `ModelGuard Verifier`. In **Verify a model**, use:

```text
Model name: DemoClassifier
Version: 1.0.0
Model file: mnist-12-original.onnx
```

Click **Verify Model**.

Expected result:

```text
Model revoked
```

The current frontend prioritizes the on-chain revocation status. Once it sees that the release is revoked, it stops before hashing and comparing the selected file. Therefore, the correct interpretation is **“this registered version must not be used,”** regardless of which local file was selected.

## 18. Test 11 — permanent version history

Create a second manifest by copying `mnist-12-manifest.json` and changing its version field to `1.1.0`. Save it as:

```text
sample-models/mnist-12-manifest-v1.1.0.json
```

Then:

1. Switch to `ModelGuard Publisher`.
2. Register `DemoClassifier` version `1.1.0` using the original ONNX file and the new manifest.
3. Load `DemoClassifier` version `1.0.0` in **Model Details**. It should still exist and show **Revoked** with its reason.
4. Load `DemoClassifier` version `1.1.0`. It should show **Active** as a separate record.
5. Switch to the verifier and verify version `1.1.0` with the original file. It should show **Model verified**.

This is how the current UI demonstrates version history: both version records remain independently searchable, and creating `1.1.0` does not overwrite `1.0.0`.

## 19. Optional wallet-rejection test

To test cancellation handling:

1. Use the publisher and prepare a registration with a new unique version such as `2.0.0`.
2. Click **Register Model**.
3. Reject the request in MetaMask.

Expected result:

```text
Transaction rejected by the wallet.
```

No blockchain record should be created.

## 20. Expected-results checklist

| Scenario | Active wallet | Expected result |
|---|---|---|
| Unknown version | Verifier | Model not found |
| Register a model | Verifier | Authorization failure |
| Register `1.0.0` | Publisher | Success |
| Register duplicate `1.0.0` | Publisher | `ModelAlreadyExists` failure |
| Inspect `1.0.0` before revocation | Either | Active record visible |
| Verify original `1.0.0` | Verifier | Model verified |
| Verify modified `1.0.0` | Verifier | Model mismatch |
| Load revoke action | Verifier | Action hidden |
| Revoke `1.0.0` | Publisher | Success; record retained |
| Verify revoked `1.0.0` | Verifier | Model revoked |
| Register `1.1.0` | Publisher | Success as separate version |
| Load `1.0.0` and `1.1.0` | Either | Revoked and active records both visible |

### Exact error messages for the demonstration

The frontend converts wallet and Solidity errors into the following stable messages. Raw text such as `execution reverted (unknown custom error)` should no longer be displayed.

| Scenario | Expected UI message or state |
|---|---|
| Verifier attempts registration | **Connected wallet is not an authorized publisher. Switch to the ModelGuard Publisher account and try again.** |
| Publisher repeats the same name/version | **This model name and version is already registered. Existing records cannot be overwritten; use a new version.** |
| User rejects a MetaMask transaction | **Transaction was rejected in MetaMask. No blockchain change was made.** |
| Wrong network selected | **Wrong network. Switch MetaMask to Hardhat Local (chain ID 31337).** |
| Unknown model/version verification | **Model not found** |
| Original active file | **Model verified** |
| Modified active file | **Model mismatch** |
| Revoked version | **Model revoked** |
| Verifier loads Model Details | Revoke action is hidden and an authorization explanation is shown |
| Unauthorized direct/stale revocation attempt | **Connected wallet cannot revoke this model. Switch to the original publisher or administrator account.** |
| Repeated revocation attempt | **This model version has already been revoked. Revocation is permanent.** |

After pulling or applying these changes, restart `npm run frontend:dev` and refresh the browser before rehearsing the messages.

## 21. Troubleshooting

### Publisher registration is unauthorized

Check the full address in ModelGuard. The local Publisher/Admin must be:

```text
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

If it differs, switch MetaMask accounts and reconnect the site.

### Revoke button is missing after switching to the publisher

Wallet permission is calculated when the record is loaded. Click **Load Model again** after switching accounts. If necessary, refresh the page and reconnect the publisher.

### The Wallet panel still shows the old address

Open MetaMask's connected-site/account-permission view, allow the new account for `localhost:5173`, refresh ModelGuard, and click **Connect wallet** again.

### Wrong network

Switch to Hardhat Local with chain ID `31337`. Confirm that terminal 1 is still running at `http://127.0.0.1:8545`.

### ModelRegistry is not configured

Run `npm run deploy:local` while the local node is running, then restart the frontend. Confirm that `frontend/src/contracts/deployment.json` contains a non-empty address.

### Calls worked earlier but now fail

The local node was probably restarted. Its old models and contract disappeared with the temporary chain. Deploy again and restart the frontend. You will need to repeat registrations.

### Model is reported as not found unexpectedly

Names and versions are exact and case-sensitive. `DemoClassifier` differs from `democlassifier`, and `1.0.0` differs from `1.0`.

### MetaMask has incorrect nonce or balance after restarting Hardhat

Make sure the Hardhat Local network points to the current node. If MetaMask still caches old local activity, use its account-activity reset/clear option for this disposable development account, then reconnect. Never reset a real funded account merely to fix local testing.

## 22. Finish or start again

When testing is complete, stop the frontend and local node with `Ctrl+C` in their terminals. The local blockchain state is temporary and will be lost when the node stops.

For a clean rehearsal, start the node, deploy the contract, start the frontend, and repeat this guide from the beginning.
