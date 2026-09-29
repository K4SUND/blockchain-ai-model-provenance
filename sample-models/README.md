# Demonstration model artifacts

The team must not claim to have trained an externally sourced model. It is only an artifact for demonstrating integrity and provenance verification.

## Selected model (DOC-01)

| Field | Value |
|---|---|
| Model | MNIST handwritten-digit classifier (`mnist-12.onnx`) |
| Registered as | `DemoClassifier` version `1.0.0` |
| Original creator | Microsoft CNTK tutorial model, published in the ONNX Model Zoo |
| Source page | https://github.com/onnx/models/tree/main/validated/vision/classification/mnist |
| Direct download | https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-12.onnx |
| Licence | MIT (stated in the model's README in the ONNX Model Zoo) |
| Format | ONNX, opset 12 |
| Size | 26,143 bytes |
| Input / output | `1x1x28x28` greyscale image / `1x10` class scores |

It was chosen because it is tiny (hashes instantly in the browser), has a permissive licence, and is a real, well-known ONNX artifact.

## Demonstration files

| File | Committed? | SHA-256 |
|---|---|---|
| `mnist-12-original.onnx` | No (binary, download it) | `0x5c688690f8bacf667d4c2074af5ad0646ca328d7ab03eccf944a65b320171bdd` |
| `mnist-12-modified.onnx` | No (generate it) | `0x3b18a736ad8af386be07eb9df87b5d75e659efccc4fc178afd52b4edfd648f8f` |
| `mnist-12-manifest.json` | Yes | `0xa8dea1e117fdaca553263b0862f7f17b8230d98e319e4ea98ca026ce81dc6d6d` |

The modified copy flips the lowest bit of 4 bytes (byte offsets 13000–13003, inside the stored weight data). The file is still a structurally valid ONNX model, representing a quietly tampered release, but its hash is completely different.

`.gitattributes` disables line-ending conversion for these files. If the manifest is edited, its hash changes: recompute it and update this table before registering.

## Recreate the files

From the repository root (Git Bash):

```bash
curl -L -o sample-models/mnist-12-original.onnx \
  https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-12.onnx

cp sample-models/mnist-12-original.onnx sample-models/mnist-12-modified.onnx
node -e "const fs=require('fs');const f='sample-models/mnist-12-modified.onnx';const b=fs.readFileSync(f);for(const o of [13000,13001,13002,13003])b[o]^=1;fs.writeFileSync(f,b)"

sha256sum sample-models/mnist-12-*.onnx sample-models/mnist-12-manifest.json
```

PowerShell alternative for hashing: `Get-FileHash sample-models\mnist-12-original.onnx -Algorithm SHA256`.

The printed hashes must match the table above. The browser's SHA-256 (`hashFile.js`) must produce the same values with a `0x` prefix.
