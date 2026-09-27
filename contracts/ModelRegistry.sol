// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ModelRegistry
 * @notice Stores immutable registration records for AI model artifacts.
 * @dev This initial scaffold deliberately leaves the core write/read methods
 *      unimplemented. See workplan.md tasks SC-02 through SC-04.
 *
 * Security boundary:
 * - The contract proves that a hash was registered by an authorized address.
 * - The contract does not inspect a model file or judge model quality.
 * - Model files and provenance manifests remain off-chain.
 */
contract ModelRegistry is AccessControl {
    /// @notice Role allowed to register and revoke model versions.
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");

    /**
     * @notice One immutable AI model release record.
     * @param modelName Human-readable model family name.
     * @param version Version supplied by the publisher, preferably SemVer.
     * @param modelHash SHA-256 fingerprint calculated off-chain.
     * @param provenanceHash SHA-256 fingerprint of an off-chain JSON manifest.
     * @param metadataURI Optional location of public release metadata.
     * @param publisher Wallet that created the record.
     * @param registeredAt Block timestamp of registration.
     * @param revoked True when the publisher or administrator has withdrawn it.
     * @param revocationReason Human-readable reason retained for the audit trail.
     */
    struct ModelRecord {
        string modelName;
        string version;
        bytes32 modelHash;
        bytes32 provenanceHash;
        string metadataURI;
        address publisher;
        uint256 registeredAt;
        bool revoked;
        string revocationReason;
    }

    /// @dev Records are keyed by keccak256(abi.encode(modelName, version)).
    mapping(bytes32 modelId => ModelRecord record) private _models;

    error InvalidAdministrator();
    error InvalidModelName();
    error InvalidVersion();
    error InvalidModelHash();
    error InvalidProvenanceHash();
    error ModelAlreadyExists(bytes32 modelId);
    error ModelNotFound(bytes32 modelId);
    error ModelAlreadyRevoked(bytes32 modelId);
    error NotPublisherOrAdministrator(address caller);
    error NotImplemented();

    event ModelRegistered(
        bytes32 indexed modelId,
        string modelName,
        string version,
        bytes32 modelHash,
        address indexed publisher
    );

    event ModelRevoked(
        bytes32 indexed modelId,
        address indexed revokedBy,
        string reason
    );

    /**
     * @param initialAdmin First administrator and authorized publisher.
     */
    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) {
            revert InvalidAdministrator();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(PUBLISHER_ROLE, initialAdmin);
    }

    /**
     * @notice Produces the stable key used for a model name/version pair.
     * @dev abi.encode is used instead of abi.encodePacked for unambiguous
     *      encoding of two variable-length strings.
     */
    function computeModelId(
        string memory modelName,
        string memory version
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(modelName, version));
    }

    /**
     * @notice Registers a new model release.
     * @dev TODO(SC-02): validate inputs, reject duplicates, store the record,
     *      and emit ModelRegistered. Never allow an existing record overwrite.
     */
    function registerModel(
        string calldata modelName,
        string calldata version,
        bytes32 modelHash,
        bytes32 provenanceHash,
        string calldata metadataURI
    ) external onlyRole(PUBLISHER_ROLE) {
        modelName;
        version;
        modelHash;
        provenanceHash;
        metadataURI;
        revert NotImplemented();
    }

    /**
     * @notice Revokes a release while retaining its registration history.
     * @dev TODO(SC-03): allow only the original publisher or an administrator;
     *      reject missing/already-revoked records; emit ModelRevoked.
     */
    function revokeModel(
        string calldata modelName,
        string calldata version,
        string calldata reason
    ) external {
        modelName;
        version;
        reason;
        revert NotImplemented();
    }

    /**
     * @notice Returns a registered model release.
     * @dev TODO(SC-04): reject missing records with ModelNotFound and return
     *      the stored struct for existing records.
     */
    function getModel(
        string calldata modelName,
        string calldata version
    ) external view returns (ModelRecord memory) {
        modelName;
        version;
        revert NotImplemented();
    }

    /**
     * @notice Checks whether a model name/version pair has been registered.
     * @dev Registration timestamp is non-zero for every valid stored record.
     */
    function modelExists(
        string calldata modelName,
        string calldata version
    ) external view returns (bool) {
        bytes32 modelId = computeModelId(modelName, version);
        return _models[modelId].registeredAt != 0;
    }
}

