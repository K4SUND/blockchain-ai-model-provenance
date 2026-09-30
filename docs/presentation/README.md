# ModelGuard three-minute presentation and demo guide

This guide is the single plan for producing the final three-minute team video. The presentation and demonstration should be one continuous video: use the slides to explain the problem and design, then switch to a short pre-recorded screen demonstration to prove that the system works.

## 1. Target outcome

The audience should understand four points by the end of the video:

1. An AI model file can be replaced, mislabeled, or used after it has been revoked.
2. ModelGuard calculates a local SHA-256 fingerprint and stores the trusted record in a smart contract.
3. The application detects both a matching file and a modified file, and it displays revocation.
4. Blockchain provides an authorized, permanent, auditable history; it does not prove model accuracy, fairness, or safety.

Aim for **2 minutes 55 seconds to 2 minutes 58 seconds**. This leaves a small export or playback margin below the three-minute limit.

## 2. Changes needed in `docs/ModelGuard.pdf`

The current deck has a strong visual style and a clear story, but it contains too much material for a three-minute video. Make the following changes before recording.

| Current slide | Keep/change | Required improvement |
|---|---|---|
| 1 — Title | Keep | Keep all names and registration numbers here. Team members do not need four separate spoken introductions. |
| 2 — Problem | Keep | Use it for the first 15 seconds. Do not read every label separately. |
| 3 — Fingerprint | Change | Replace “One changed byte” with **“Four flipped bits, a completely different fingerprint”** or **“A tiny change, a completely different fingerprint.”** The demo file changes four bits, not one byte. Enlarge the hashes or show only shortened hashes. |
| 4 — Technology stack | Appendix | It is too dense to narrate. Keep it after the closing slide for questions, or reduce it to a small footer containing Solidity, Hardhat, React, and ethers. |
| 5 — Workflow | Keep | This is the main explanation slide. State that files are hashed locally and are never stored on-chain. Also state that this prototype uses a local Hardhat EVM network and can be deployed to an Ethereum-compatible public network. |
| 6 — Five steps | Correct or remove | The third row is incorrect. Replace “Ordinary verifier — Revoke 1.0.0” with **“Ordinary verifier — Verify modified file”**, giving the result **“Hash mismatch.”** Do not show this slide in the main video if the real demo already shows these steps. |
| 7–8 — Screenshots | Replace in main video | The screenshots are too small to read in a video. Use the full-screen application recording described below. Keep these slides only as backup or appendix material. |
| 9 — Blockchain value | Keep and improve | Add **“37 automated contract and deployment tests passing.”** Add the boundary: **“Integrity and registered provenance, not model quality.”** |
| 10 — Thank you | Keep | Show it for the final two or three seconds. |

### Recommended main-video slide order

1. Title
2. Problem
3. SHA-256 fingerprint
4. How ModelGuard works
5. Full-screen application demonstration
6. Results, blockchain value, and limitation
7. Thank you

The technology stack, five-step table, and static UI screenshots can remain after the closing slide as appendix slides, but they should not consume time in the submitted video.

## 3. Team responsibilities

| Member | Speaking section | Production responsibility |
|---|---|---|
| **Imalsha** | Problem and fingerprint | Update the slides, assemble the final video, and add captions |
| **Kasun** | Architecture and smart contract | Check all technical claims and review the final slide wording |
| **Oshani** | Application demonstration | Prepare the application, record the screen, and narrate the demo |
| **Ninada** | Test evidence, value, limitation, and conclusion | Confirm the test count, control timing, and perform the final submission check |

Everyone should record in a quiet room using the same microphone distance. Imalsha should normalize the four recordings so the volume does not change between speakers.

## 4. Exact timed script

The words in square brackets are production directions and should not be spoken.

### 0:00–0:35 — Imalsha: problem and fingerprint

> AI models are distributed as files, so an official release can be replaced, mislabeled, backdoored, or used after withdrawal. ModelGuard addresses this by treating the model's SHA-256 hash as a digital fingerprint. For our demo, we use the existing 26-kilobyte MNIST ONNX model; we did not train it. Flipping only four bits changes its hash completely, making tampering immediately detectable.

**Visual:** Show the title briefly, then the problem and fingerprint slides.

### 0:35–1:10 — Kasun: architecture and blockchain

> Files are hashed locally, so they never leave the user's computer. An authorized publisher signs a transaction to our Solidity ModelRegistry contract. The contract rejects unauthorized publishers, invalid hashes, and duplicate name-version pairs, while preserving registration and revocation history. Verification is read-only: anyone retrieves the registered hash and compares it with a selected file without gas. Our prototype runs on a local Hardhat EVM network and can be deployed to an Ethereum-compatible public network.

**Visual:** Show the workflow diagram. Highlight publisher registration, the smart contract record, and verifier comparison in that order.

### 1:10–2:25 — Oshani: application demonstration

> Here, the publisher wallet registers DemoClassifier version 1.0.0 using the original model and provenance manifest. The browser calculates both SHA-256 hashes, and only those hashes and metadata are sent on-chain. [Click Register Model and confirm the prepared transaction.] The confirmed transaction creates the record. Now, as a verifier, I select the original file. Its calculated hash matches the blockchain record, so ModelGuard reports Verified. Next, I select the modified copy. Just four flipped bits produce a different fingerprint, so the result is Hash mismatch. Finally, the publisher revokes version 1.0.0 with a public reason. Rechecking the release shows Revoked, so this registered version must no longer be used.

**Visual:** Use a full-screen recording of the real application. Cut only waiting time, not the results.

### 2:25–2:57 — Ninada: evidence, value, and limitation

> The final system passed 37 automated contract and deployment tests covering permissions, duplicates, versions, and revocation. Blockchain adds tamper detection, authorized publishing, permanent history, and visible revocation. ModelGuard proves that a file matches an authorized registered release; it does not prove that the model is accurate, fair, or safe. It provides an auditable trust layer for distributing AI models.

**Visual:** Show the results slide with “37 tests passing” and the limitation clearly visible.

### 2:57–3:00 — Closing

Show the Thank You slide. No additional speech is necessary; alternatively, Ninada may say only, “Thank you.”

## 5. Demo preparation

Use three terminals from the repository root:

```bash
# Terminal 1 — local blockchain
npm run node

# Terminal 2 — deploy the contract and export its frontend configuration
npm run deploy:local

# Terminal 3 — frontend
npm run frontend:dev
```

Before recording:

- connect the publisher wallet to the local Hardhat network with chain ID `31337`;
- keep `mnist-12-original.onnx`, `mnist-12-modified.onnx`, and `mnist-12-manifest.json` ready;
- use `DemoClassifier` and version `1.0.0` consistently;
- prepare a short revocation reason such as `Model weights found to be compromised`;
- use browser zoom between 110% and 125% so results remain readable in the video;
- close unrelated tabs, notifications, wallet history, and personal information; and
- never show a seed phrase or private key.

If a rehearsal has already registered the same model and version, restart the local Hardhat node and deploy a fresh contract before making the final recording.

## 6. Demo recording shot list

Record the demo as a separate clip and insert it into the presentation. This is still a real system demonstration and avoids losing time to unpredictable transaction confirmation or window switching.

1. Begin on the completed registration form. Keep the calculated model and provenance hashes visible.
2. Click **Register Model**, confirm with MetaMask, and show the successful record. Remove only dead waiting time in editing.
3. Open **Verify Model**, select the original file, and show **Verified**.
4. Select the modified file and show **Hash mismatch**.
5. Open the record details as the publisher, enter the revocation reason, revoke it, and show the confirmation.
6. Verify the original file again and show **Revoked**.
7. End the clip on the revoked record for half a second before returning to the results slide.

One person should control and narrate the entire demo. Do not switch speakers in the middle of the screen recording.

## 7. Recording and editing rules

- Export at 1920×1080 resolution and use a 16:9 layout.
- Prefer 30 frames per second; the UI does not require a higher frame rate.
- Record each narration section separately, then assemble it around the demo clip.
- Use short crossfades only. Avoid animated transitions that consume time or distract from the application.
- Add captions for technical terms such as SHA-256, smart contract, Verified, Hash mismatch, and Revoked.
- Keep background music absent or very quiet so every speaker remains understandable.
- Do not speed up speech to fit. Shorten pauses or trim words instead.
- Do not claim that the model file or training data is stored on-chain. ModelGuard stores fingerprints and metadata.
- Do not claim that ModelGuard proves model quality or detects every malicious model.

## 8. Rehearsal checklist

Run at least two full rehearsals and record the second one.

- [ ] Total duration is no more than 3:00 and preferably between 2:55 and 2:58.
- [ ] Every member speaks once and the speaker order matches this guide.
- [ ] The title slide has the correct names and registration numbers.
- [ ] Slide 3 no longer says that one byte was changed.
- [ ] Slide 6 is corrected or removed from the main video.
- [ ] The registration transaction succeeds on a fresh deployment.
- [ ] Original file displays **Verified**.
- [ ] Modified file displays **Hash mismatch**.
- [ ] Original file after revocation displays **Revoked**.
- [ ] All UI text can be read on a normal laptop screen.
- [ ] No private key, seed phrase, or personal browser data appears.
- [ ] Audio levels are consistent and speech is clear.
- [ ] The final exported video plays from beginning to end without network access.

## 9. Backup plan

Keep the successful demo clip as a separate local file and in the shared team folder. If the application or wallet fails during final assembly, reuse that real recorded clip. The static screenshots in the current PDF are a last-resort backup because their text is difficult to read in a three-minute video.

Before submission, watch the exported video once on a different device and confirm its duration, sound, resolution, and filename against the module instructions.
