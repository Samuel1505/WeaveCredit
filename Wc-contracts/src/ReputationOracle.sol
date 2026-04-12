// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReputationOracle
 * @author WeaveCredit
 * @notice Maintains cross-rollup credit scores for users based on activity bridged via Interwoven Bridge.
 */
contract ReputationOracle is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    struct ActivityProof {
        bytes32 initUsernameHash;
        uint256 bridgedTxCount;      // Number of bridge events
        uint256 totalVolume;         // Aggregated volume in base units
        uint256 lastActivityBlock;
        uint8 creditScore;           // Normalized score 0-100
    }

    // Mapping from user address to their activity data
    mapping(address => ActivityProof) public userActivity;
    
    // Mapping from .init username hash to address
    mapping(bytes32 => address) public usernameToAddress;

    event ReputationUpdated(address indexed user, bytes32 indexed usernameHash, uint8 score, uint256 volume);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /**
     * @notice Updates the reputation of a user.
     * @dev In MVP, this is triggered by the Gas Station or frontend after bridge verification.
     * @param user The address of the user
     * @param usernameHash The hash of the .init username
     * @param volume The volume of the recent activity
     */
    function updateReputation(
        address user,
        bytes32 usernameHash,
        uint256 volume
    ) external onlyRole(ORACLE_ROLE) {
        ActivityProof storage proof = userActivity[user];
        
        if (proof.initUsernameHash == bytes32(0)) {
            proof.initUsernameHash = usernameHash;
            usernameToAddress[usernameHash] = user;
        }

        proof.bridgedTxCount += 1;
        proof.totalVolume += volume;
        proof.lastActivityBlock = block.number;

        // Simple scoring algorithm: base 50 + tx bonus + volume bonus
        // Maxes out at 100
        uint256 newScore = 50 + (proof.bridgedTxCount * 2) + (volume / 10**18 / 100); 
        if (newScore > 100) newScore = 100;
        
        proof.creditScore = uint8(newScore);

        emit ReputationUpdated(user, usernameHash, proof.creditScore, volume);
    }

    /**
     * @notice Returns the credit score and applicable LTV for a user.
     * @param user The address to check
     * @return score The 0-100 credit score
     * @return ltv The LTV percentage (e.g., 90 for 90%)
     */
    function getCreditScore(address user) external view returns (uint8 score, uint256 ltv) {
        score = userActivity[user].creditScore;
        
        // If no activity, return a default minimum score
        if (score == 0) {
            score = 20; 
        }

        // LTV Logic:
        // score >= 90: 90% LTV
        // score >= 70: 80% LTV
        // score >= 50: 70% LTV
        // else: 50% LTV (standard overcollateralized)
        if (score >= 90) ltv = 90;
        else if (score >= 70) ltv = 80;
        else if (score >= 50) ltv = 70;
        else ltv = 50;
    }
}
