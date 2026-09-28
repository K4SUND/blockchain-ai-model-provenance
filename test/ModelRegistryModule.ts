import { expect } from "chai";
import { network } from "hardhat";

import ModelRegistryModule from "../ignition/modules/ModelRegistry.js";
import localParameters from "../ignition/parameters/localhost.json" with { type: "json" };

const { ethers, ignition } = await network.create();

/**
 * Deployment-module tests (DEP-01, DEP-02).
 *
 * These deploy through the same Ignition module used by `npm run deploy:local`,
 * so a broken module or parameter file fails `npm run test`.
 */
describe("ModelRegistryModule", function () {
  it("deploys with the configured initial administrator", async function () {
    const [, configuredAdmin] = await ethers.getSigners();

    const { modelRegistry } = await ignition.deploy(ModelRegistryModule, {
      parameters: { ModelRegistryModule: { initialAdmin: configuredAdmin.address } },
    });

    expect(
      await modelRegistry.hasRole(
        await modelRegistry.DEFAULT_ADMIN_ROLE(),
        configuredAdmin.address,
      ),
    ).to.equal(true);
    expect(
      await modelRegistry.hasRole(
        await modelRegistry.PUBLISHER_ROLE(),
        configuredAdmin.address,
      ),
    ).to.equal(true);
  });

  it("does not grant roles to the deploying account when another admin is configured", async function () {
    const [deployer, configuredAdmin] = await ethers.getSigners();

    const { modelRegistry } = await ignition.deploy(ModelRegistryModule, {
      parameters: { ModelRegistryModule: { initialAdmin: configuredAdmin.address } },
      defaultSender: deployer.address,
    });

    expect(
      await modelRegistry.hasRole(await modelRegistry.DEFAULT_ADMIN_ROLE(), deployer.address),
    ).to.equal(false);
    expect(
      await modelRegistry.hasRole(await modelRegistry.PUBLISHER_ROLE(), deployer.address),
    ).to.equal(false);
  });

  it("refuses to deploy without an initialAdmin parameter", async function () {
    let error: unknown;
    try {
      await ignition.deploy(ModelRegistryModule);
    } catch (caught) {
      error = caught;
    }

    expect(String(error)).to.match(/initialAdmin/);
  });

  it("uses Hardhat account 0 in the local parameters file", async function () {
    const [account0] = await ethers.getSigners();

    expect(localParameters.ModelRegistryModule.initialAdmin).to.equal(account0.address);
  });
});
