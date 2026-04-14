// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";

/**
 * @title SimulateActivity
 * @notice Simulates user bridge activity to boost their reputation score.
 */
contract SimulateActivity is Script {
    function run() external {
        // Contract addresses from deployment
        address oracleAddr = 0x6c76161E9314ED9Bb1644847F1290f7Edd59Aa55;
        
        // Let's simulate for a test user
        address user = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Standard Foundry test user
        bytes32 usernameHash = keccak256(".init/user1");
        
        vm.startBroadcast();

        ReputationOracle oracle = ReputationOracle(oracleAddr);

        console2.log("--- Simulating Activity for:", user, "---");

        // 1. Initial bridging activity
        console2.log("Updating reputation for first bridge event...");
        oracle.updateReputation(user, usernameHash, 500 * 10**18); // 500 tokens bridged

        // 2. High volume activity
        console2.log("Updating reputation for high volume bridge...");
        oracle.updateReputation(user, usernameHash, 5000 * 10**18); // 5000 tokens bridged

        // 3. Check final score
        (uint8 score, uint256 ltv) = oracle.getCreditScore(user);
        console2.log("Final Credit Score:", score);
        console2.log("Applicable LTV (%):", ltv);

        vm.stopBroadcast();
    }
}
