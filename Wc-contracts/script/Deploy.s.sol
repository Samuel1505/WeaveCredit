// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {CreditVault} from "../src/CreditVault.sol";

contract DeployWeaveCredit is Script {
    function run() external {
        // Use the hex address of the gas-station account
        address gasStationHex = 0xA92291333a35EdDaF51546865F0B83fD44af7BdC;
        
        // Native asset denom "umin" is typical for Move, 
        // but since we are on EVM, let's assume we use GAS or a mock for MVP.
        address mockAsset = address(0); // Placeholder
        
        vm.startBroadcast();

        ReputationOracle oracle = new ReputationOracle(gasStationHex);
        console2.log("ReputationOracle deployed at:", address(oracle));

        CreditVault vault = new CreditVault(gasStationHex, mockAsset);
        console2.log("CreditVault deployed at:", address(vault));

        // For actual L2 deployment, you'd need a real ERC20 address for 'asset'
        // LendingPool pool = new LendingPool(address(oracle), mockAsset);
        // console2.log("LendingPool deployed at:", address(pool));

        vm.stopBroadcast();
    }
}
