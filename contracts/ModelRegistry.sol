// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ModelRegistry
 * @notice Stores immutable registration records for AI model artifacts.
 * @dev Model files and provenance manifests remain off-chain. Their SHA-256
 *      digests are supplied by the client and stored as bytes32 values.
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
    error InvalidRevocationReason();
    error ModelAlreadyExists(bytes32 modelId);
    error ModelNotFound(bytes32 modelId);
    error ModelAlreadyRevoked(bytes32 modelId);
    error NotPublisherOrAdministrator(address caller);

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
     * @dev The name/version pair is unique and can never be overwritten.
     *      The caller must hold PUBLISHER_ROLE.
     * @param modelName Human-readable model family name; comparison is exact
     *        and case-sensitive.
     * @param version Human-readable release version, preferably SemVer.
     * @param modelHash SHA-256 digest of the exact model artifact bytes.
     * @param provenanceHash SHA-256 digest of the provenance manifest bytes.
     * @param metadataURI Optional public location for release metadata.
     */
    function registerModel(
        string calldata modelName,
        string calldata version,
        bytes32 modelHash,
        bytes32 provenanceHash,
        string calldata metadataURI
    ) external onlyRole(PUBLISHER_ROLE) {
        if (bytes(modelName).length == 0) {
            revert InvalidModelName();
        }
        if (bytes(version).length == 0) {
            revert InvalidVersion();
        }
        if (modelHash == bytes32(0)) {
            revert InvalidModelHash();
        }
        if (provenanceHash == bytes32(0)) {
            revert InvalidProvenanceHash();
        }

        bytes32 modelId = computeModelId(modelName, version);
        if (_models[modelId].publisher != address(0)) {
            revert ModelAlreadyExists(modelId);
        }

        _models[modelId] = ModelRecord({
            modelName: modelName,
            version: version,
            modelHash: modelHash,
            provenanceHash: provenanceHash,
            metadataURI: metadataURI,
            publisher: msg.sender,
            registeredAt: block.timestamp,
            revoked: false,
            revocationReason: ""
        });

        emit ModelRegistered(
            modelId,
            modelName,
            version,
            modelHash,
            msg.sender
        );
    }

    /**
     * @notice Revokes a release while retaining its registration history.
     * @dev Revocation is permanent. It can be performed by the original
     *      publisher or an account with DEFAULT_ADMIN_ROLE. The publisher may
     *      revoke its own historical release even if its publisher role was
     *      later removed, because revocation can only reduce trust.
     * @param modelName Exact registered model family name.
     * @param version Exact registered release version.
     * @param reason Non-empty public explanation retained on-chain.
     */
    function revokeModel(
        string calldata modelName,
        string calldata version,
        string calldata reason
    ) external {
        bytes32 modelId = computeModelId(modelName, version);
        ModelRecord storage record = _models[modelId];

        if (record.publisher == address(0)) {
            revert ModelNotFound(modelId);
        }
        if (record.revoked) {
            revert ModelAlreadyRevoked(modelId);
        }
        if (
            msg.sender != record.publisher &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) {
            revert NotPublisherOrAdministrator(msg.sender);
        }
        if (bytes(reason).length == 0) {
            revert InvalidRevocationReason();
        }

        record.revoked = true;
        record.revocationReason = reason;

        emit ModelRevoked(modelId, msg.sender, reason);
    }

    /**
     * @notice Returns a registered model release.
     * @dev Reverts instead of returning an empty record when no matching
     *      name/version pair exists.
     * @param modelName Exact registered model family name.
     * @param version Exact registered release version.
     * @return record Complete active or revoked registration record.
     */
    function getModel(
        string calldata modelName,
        string calldata version
    ) external view returns (ModelRecord memory record) {
        bytes32 modelId = computeModelId(modelName, version);
        record = _models[modelId];

        if (record.publisher == address(0)) {
            revert ModelNotFound(modelId);
        }
    }

    /**
     * @notice Checks whether a model name/version pair has been registered.
     * @dev A publisher address is always present for a valid record and can
     *      never be the zero address because transactions cannot originate
     *      from it. Revoked records still exist and therefore return true.
     * @param modelName Exact model family name to check.
     * @param version Exact release version to check.
     * @return True for both active and revoked registered records.
     */
    function modelExists(
        string calldata modelName,
        string calldata version
    ) external view returns (bool) {
        bytes32 modelId = computeModelId(modelName, version);
        return _models[modelId].publisher != address(0);
    }
}

