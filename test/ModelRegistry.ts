import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

// Stand-ins for client-calculated SHA-256 digests. The contract only sees
// bytes32 values, so hashing arbitrary labels is enough for contract tests.
const MODEL_NAME = "DemoClassifier";
const VERSION = "1.0.0";
const MODEL_HASH = ethers.sha256(ethers.toUtf8Bytes("model-v1.onnx bytes"));
const PROVENANCE_HASH = ethers.sha256(ethers.toUtf8Bytes("provenance-v1.json bytes"));
const METADATA_URI = "ipfs://example-metadata";
const REVOCATION_REASON = "Training data licence withdrawn";

/**
 * Contract tests.
 *
 * Keep every permission and failure-path test at the contract layer even when
 * the frontend also performs validation. The blockchain is the final security
 * boundary and must reject invalid direct calls.
 */
describe("ModelRegistry", function () {
  async function deployRegistryFixture() {
    const [admin, publisher, stranger] = await ethers.getSigners();
    const registry = await ethers.deployContract("ModelRegistry", [admin.address]);
    await registry.waitForDeployment();

    return { ethers, registry, admin, publisher, stranger };
  }

  /** Deploys, authorizes a second publisher, and registers one model from it. */
  async function registeredModelFixture() {
    const fixture = await deployRegistryFixture();
    const { registry, publisher } = fixture;

    await registry.grantRole(await registry.PUBLISHER_ROLE(), publisher.address);
    await registry
      .connect(publisher)
      .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI);

    return {
      ...fixture,
      modelId: await registry.computeModelId(MODEL_NAME, VERSION),
    };
  }

  describe("initial scaffold", function () {
    it("grants administrator and publisher roles to the initial administrator", async function () {
      const { registry, admin } = await networkHelpers.loadFixture(deployRegistryFixture);
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      const publisherRole = await registry.PUBLISHER_ROLE();

      expect(await registry.hasRole(adminRole, admin.address)).to.equal(true);
      expect(await registry.hasRole(publisherRole, admin.address)).to.equal(true);
    });

    it("creates a deterministic ID for a model name and version", async function () {
      const { ethers, registry } = await networkHelpers.loadFixture(deployRegistryFixture);
      const expected = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "string"],
          ["DemoClassifier", "1.0.0"],
        ),
      );

      expect(
        await registry.computeModelId("DemoClassifier", "1.0.0"),
      ).to.equal(expected);
    });

    it("rejects the zero address as initial administrator", async function () {
      const registry = await ethers.getContractFactory("ModelRegistry");

      await expect(
        ethers.deployContract("ModelRegistry", [ethers.ZeroAddress]),
      ).to.be.revertedWithCustomError(registry, "InvalidAdministrator");
    });

    it("does not grant roles to other accounts", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(deployRegistryFixture);

      expect(
        await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), publisher.address),
      ).to.equal(false);
      expect(
        await registry.hasRole(await registry.PUBLISHER_ROLE(), publisher.address),
      ).to.equal(false);
    });

    it("keeps IDs distinct when name and version boundaries shift", async function () {
      const { registry } = await networkHelpers.loadFixture(deployRegistryFixture);

      // abi.encodePacked would make these two pairs collide.
      expect(await registry.computeModelId("Demo", "1.0")).to.not.equal(
        await registry.computeModelId("Demo1", ".0"),
      );
    });
  });

  describe("registration", function () {
    it("allows an authorized publisher to register a unique model version", async function () {
      const { registry, admin } = await networkHelpers.loadFixture(deployRegistryFixture);

      await expect(
        registry.registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      ).to.not.revert(ethers);

      const record = await registry.getModel(MODEL_NAME, VERSION);
      expect(record.publisher).to.equal(admin.address);
      expect(record.modelHash).to.equal(MODEL_HASH);
    });

    it("allows a publisher granted by the administrator to register", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(deployRegistryFixture);
      await registry.grantRole(await registry.PUBLISHER_ROLE(), publisher.address);

      await registry
        .connect(publisher)
        .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI);

      expect((await registry.getModel(MODEL_NAME, VERSION)).publisher).to.equal(
        publisher.address,
      );
    });

    it("accepts an empty metadata URI", async function () {
      const { registry } = await networkHelpers.loadFixture(deployRegistryFixture);

      await registry.registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, "");

      expect((await registry.getModel(MODEL_NAME, VERSION)).metadataURI).to.equal("");
    });

    it("rejects an unauthorized publisher", async function () {
      const { registry, stranger } = await networkHelpers.loadFixture(deployRegistryFixture);

      await expect(
        registry
          .connect(stranger)
          .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      )
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await registry.PUBLISHER_ROLE());

      expect(await registry.modelExists(MODEL_NAME, VERSION)).to.equal(false);
    });

    it("rejects a publisher whose role was removed", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(deployRegistryFixture);
      const publisherRole = await registry.PUBLISHER_ROLE();
      await registry.grantRole(publisherRole, publisher.address);
      await registry.revokeRole(publisherRole, publisher.address);

      await expect(
        registry
          .connect(publisher)
          .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      )
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(publisher.address, publisherRole);
    });

    it("rejects role grants from a non-administrator", async function () {
      const { registry, stranger } = await networkHelpers.loadFixture(deployRegistryFixture);

      await expect(
        registry
          .connect(stranger)
          .grantRole(await registry.PUBLISHER_ROLE(), stranger.address),
      )
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, await registry.DEFAULT_ADMIN_ROLE());
    });

    it("rejects empty names, empty versions, and zero hashes", async function () {
      const { registry } = await networkHelpers.loadFixture(deployRegistryFixture);
      const zero = ethers.ZeroHash;

      await expect(
        registry.registerModel("", VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      ).to.be.revertedWithCustomError(registry, "InvalidModelName");
      await expect(
        registry.registerModel(MODEL_NAME, "", MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      ).to.be.revertedWithCustomError(registry, "InvalidVersion");
      await expect(
        registry.registerModel(MODEL_NAME, VERSION, zero, PROVENANCE_HASH, METADATA_URI),
      ).to.be.revertedWithCustomError(registry, "InvalidModelHash");
      await expect(
        registry.registerModel(MODEL_NAME, VERSION, MODEL_HASH, zero, METADATA_URI),
      ).to.be.revertedWithCustomError(registry, "InvalidProvenanceHash");

      expect(await registry.modelExists(MODEL_NAME, VERSION)).to.equal(false);
    });

    it("rejects a duplicate model name and version", async function () {
      const { registry, admin, modelId } =
        await networkHelpers.loadFixture(registeredModelFixture);
      const otherHash = ethers.sha256(ethers.toUtf8Bytes("tampered bytes"));

      // Neither the original publisher's peer (admin) nor different hashes may
      // overwrite an existing name/version pair.
      await expect(
        registry
          .connect(admin)
          .registerModel(MODEL_NAME, VERSION, otherHash, otherHash, "ipfs://other"),
      )
        .to.be.revertedWithCustomError(registry, "ModelAlreadyExists")
        .withArgs(modelId);

      expect((await registry.getModel(MODEL_NAME, VERSION)).modelHash).to.equal(MODEL_HASH);
    });

    it("rejects re-registering a revoked version", async function () {
      const { registry, publisher, modelId } =
        await networkHelpers.loadFixture(registeredModelFixture);
      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      await expect(
        registry
          .connect(publisher)
          .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI),
      )
        .to.be.revertedWithCustomError(registry, "ModelAlreadyExists")
        .withArgs(modelId);
    });

    it("allows two distinct versions of the same model", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      const v2Hash = ethers.sha256(ethers.toUtf8Bytes("model-v2.onnx bytes"));

      await registry
        .connect(publisher)
        .registerModel(MODEL_NAME, "1.1.0", v2Hash, PROVENANCE_HASH, METADATA_URI);

      expect((await registry.getModel(MODEL_NAME, VERSION)).modelHash).to.equal(MODEL_HASH);
      expect((await registry.getModel(MODEL_NAME, "1.1.0")).modelHash).to.equal(v2Hash);
    });

    it("treats names as case-sensitive", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);

      await registry
        .connect(publisher)
        .registerModel(MODEL_NAME.toLowerCase(), VERSION, MODEL_HASH, PROVENANCE_HASH, "");

      expect(await registry.modelExists(MODEL_NAME.toLowerCase(), VERSION)).to.equal(true);
    });

    it("emits ModelRegistered with the expected indexed values", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(deployRegistryFixture);
      await registry.grantRole(await registry.PUBLISHER_ROLE(), publisher.address);
      const modelId = await registry.computeModelId(MODEL_NAME, VERSION);

      const tx = registry
        .connect(publisher)
        .registerModel(MODEL_NAME, VERSION, MODEL_HASH, PROVENANCE_HASH, METADATA_URI);

      await expect(tx)
        .to.emit(registry, "ModelRegistered")
        .withArgs(modelId, MODEL_NAME, VERSION, MODEL_HASH, publisher.address);

      // The frontend builds version history by filtering on the indexed topics.
      // Filter arguments are positional; non-indexed parameters must be null.
      const byModel = await registry.queryFilter(
        registry.filters.ModelRegistered(modelId),
      );
      const byPublisher = await registry.queryFilter(
        registry.filters.ModelRegistered(null, null, null, null, publisher.address),
      );
      expect(byModel).to.have.lengthOf(1);
      expect(byPublisher).to.have.lengthOf(1);
    });
  });

  describe("lookup", function () {
    it("returns the complete stored record", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      const registeredAt = await networkHelpers.time.latest();

      const record = await registry.getModel(MODEL_NAME, VERSION);

      expect(record.modelName).to.equal(MODEL_NAME);
      expect(record.version).to.equal(VERSION);
      expect(record.modelHash).to.equal(MODEL_HASH);
      expect(record.provenanceHash).to.equal(PROVENANCE_HASH);
      expect(record.metadataURI).to.equal(METADATA_URI);
      expect(record.publisher).to.equal(publisher.address);
      expect(record.registeredAt).to.equal(BigInt(registeredAt));
      expect(record.revoked).to.equal(false);
      expect(record.revocationReason).to.equal("");
    });

    it("returns true from modelExists for a registered record", async function () {
      const { registry } = await networkHelpers.loadFixture(registeredModelFixture);

      expect(await registry.modelExists(MODEL_NAME, VERSION)).to.equal(true);
    });

    it("returns false from modelExists for unknown names and versions", async function () {
      const { registry } = await networkHelpers.loadFixture(registeredModelFixture);

      expect(await registry.modelExists(MODEL_NAME, "9.9.9")).to.equal(false);
      expect(await registry.modelExists("UnknownModel", VERSION)).to.equal(false);
    });

    it("returns true from modelExists for a revoked record", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      expect(await registry.modelExists(MODEL_NAME, VERSION)).to.equal(true);
    });

    it("rejects getModel for an unknown record", async function () {
      const { registry } = await networkHelpers.loadFixture(registeredModelFixture);
      const missingId = await registry.computeModelId(MODEL_NAME, "9.9.9");

      await expect(registry.getModel(MODEL_NAME, "9.9.9"))
        .to.be.revertedWithCustomError(registry, "ModelNotFound")
        .withArgs(missingId);
    });

    it("keeps each version's record independent", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      const v2Hash = ethers.sha256(ethers.toUtf8Bytes("model-v2.onnx bytes"));
      await registry
        .connect(publisher)
        .registerModel(MODEL_NAME, "2.0.0", v2Hash, PROVENANCE_HASH, "");
      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      const v1 = await registry.getModel(MODEL_NAME, VERSION);
      const v2 = await registry.getModel(MODEL_NAME, "2.0.0");
      expect(v1.revoked).to.equal(true);
      expect(v2.revoked).to.equal(false);
      expect(v2.modelHash).to.equal(v2Hash);
      expect(v2.registeredAt).to.be.greaterThanOrEqual(v1.registeredAt);
    });
  });

  describe("revocation", function () {
    it("allows the original publisher to revoke its model", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);

      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      expect((await registry.getModel(MODEL_NAME, VERSION)).revoked).to.equal(true);
    });

    it("allows the original publisher to revoke after losing its publisher role", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      await registry.revokeRole(await registry.PUBLISHER_ROLE(), publisher.address);

      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      expect((await registry.getModel(MODEL_NAME, VERSION)).revoked).to.equal(true);
    });

    it("allows an administrator to revoke a model", async function () {
      const { registry, admin } = await networkHelpers.loadFixture(registeredModelFixture);

      await registry.connect(admin).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      expect((await registry.getModel(MODEL_NAME, VERSION)).revoked).to.equal(true);
    });

    it("rejects an unrelated wallet", async function () {
      const { registry, stranger } = await networkHelpers.loadFixture(registeredModelFixture);

      await expect(
        registry.connect(stranger).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON),
      )
        .to.be.revertedWithCustomError(registry, "NotPublisherOrAdministrator")
        .withArgs(stranger.address);

      expect((await registry.getModel(MODEL_NAME, VERSION)).revoked).to.equal(false);
    });

    it("rejects a different publisher that did not register the model", async function () {
      const { registry, stranger } = await networkHelpers.loadFixture(registeredModelFixture);
      await registry.grantRole(await registry.PUBLISHER_ROLE(), stranger.address);

      await expect(
        registry.connect(stranger).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON),
      )
        .to.be.revertedWithCustomError(registry, "NotPublisherOrAdministrator")
        .withArgs(stranger.address);
    });

    it("rejects an empty revocation reason", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);

      await expect(
        registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, ""),
      ).to.be.revertedWithCustomError(registry, "InvalidRevocationReason");
    });

    it("rejects revoking an unknown record", async function () {
      const { registry, admin } = await networkHelpers.loadFixture(registeredModelFixture);
      const missingId = await registry.computeModelId(MODEL_NAME, "9.9.9");

      await expect(
        registry.connect(admin).revokeModel(MODEL_NAME, "9.9.9", REVOCATION_REASON),
      )
        .to.be.revertedWithCustomError(registry, "ModelNotFound")
        .withArgs(missingId);
    });

    it("rejects a second revocation", async function () {
      const { registry, admin, publisher, modelId } =
        await networkHelpers.loadFixture(registeredModelFixture);
      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);

      await expect(
        registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, "Second reason"),
      )
        .to.be.revertedWithCustomError(registry, "ModelAlreadyRevoked")
        .withArgs(modelId);
      await expect(
        registry.connect(admin).revokeModel(MODEL_NAME, VERSION, "Admin reason"),
      )
        .to.be.revertedWithCustomError(registry, "ModelAlreadyRevoked")
        .withArgs(modelId);

      expect((await registry.getModel(MODEL_NAME, VERSION)).revocationReason).to.equal(
        REVOCATION_REASON,
      );
    });

    it("retains the original record and stores the reason", async function () {
      const { registry, publisher } = await networkHelpers.loadFixture(registeredModelFixture);
      const before = await registry.getModel(MODEL_NAME, VERSION);

      await registry.connect(publisher).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON);
      const after = await registry.getModel(MODEL_NAME, VERSION);

      expect(after.modelName).to.equal(before.modelName);
      expect(after.version).to.equal(before.version);
      expect(after.modelHash).to.equal(before.modelHash);
      expect(after.provenanceHash).to.equal(before.provenanceHash);
      expect(after.metadataURI).to.equal(before.metadataURI);
      expect(after.publisher).to.equal(before.publisher);
      expect(after.registeredAt).to.equal(before.registeredAt);
      expect(after.revoked).to.equal(true);
      expect(after.revocationReason).to.equal(REVOCATION_REASON);
    });

    it("emits ModelRevoked", async function () {
      const { registry, admin, modelId } =
        await networkHelpers.loadFixture(registeredModelFixture);

      await expect(registry.connect(admin).revokeModel(MODEL_NAME, VERSION, REVOCATION_REASON))
        .to.emit(registry, "ModelRevoked")
        .withArgs(modelId, admin.address, REVOCATION_REASON);
    });
  });
});
