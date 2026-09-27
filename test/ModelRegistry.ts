import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

/**
 * Contract-test scaffold.
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

  describe("initial scaffold", function () {
    it("grants administrator and publisher roles to the initial administrator", async function () {
      const { registry, admin } = await deployRegistryFixture();
      const adminRole = await registry.DEFAULT_ADMIN_ROLE();
      const publisherRole = await registry.PUBLISHER_ROLE();

      expect(await registry.hasRole(adminRole, admin.address)).to.equal(true);
      expect(await registry.hasRole(publisherRole, admin.address)).to.equal(true);
    });

    it("creates a deterministic ID for a model name and version", async function () {
      const { ethers, registry } = await deployRegistryFixture();
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
  });

  // TODO(TEST-02): Replace each skipped item with a complete test while the
  // corresponding contract task is implemented.
  describe.skip("registration", function () {
    it("allows an authorized publisher to register a unique model version");
    it("rejects an unauthorized publisher");
    it("rejects empty names, empty versions, and zero hashes");
    it("rejects a duplicate model name and version");
    it("allows two distinct versions of the same model");
    it("emits ModelRegistered with the expected indexed values");
  });

  describe.skip("lookup", function () {
    it("returns the complete stored record");
    it("returns true from modelExists for a registered record");
    it("rejects getModel for an unknown record");
  });

  describe.skip("revocation", function () {
    it("allows the original publisher to revoke its model");
    it("allows an administrator to revoke a model");
    it("rejects an unrelated wallet");
    it("rejects a second revocation");
    it("retains the original record and stores the reason");
    it("emits ModelRevoked");
  });
});

