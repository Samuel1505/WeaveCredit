// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {ReputationOracle} from "../src/ReputationOracle.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock INIT", "INIT") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}

contract WeaveCreditTest is Test {
    ReputationOracle public oracle;
    LendingPool public pool;
    MockToken public asset;

    address public admin = address(1);
    address public user = address(2);
    bytes32 public usernameHash = keccak256(".init/user");

    function setUp() public {
        vm.startPrank(admin);
        oracle = new ReputationOracle(admin);
        asset = new MockToken();
        pool = new LendingPool(address(oracle), address(asset));
        
        // Fund the pool
        asset.transfer(address(pool), 100000 * 10**18);
        vm.stopPrank();
    }

    function testReputationUpdate() public {
        vm.prank(admin);
        oracle.updateReputation(user, usernameHash, 1000 * 10**18);

        (uint8 score, uint256 ltv) = oracle.getCreditScore(user);
        assertEq(score, 62); // 50 + 2 + 10
        assertEq(ltv, 70);
    }

    function testBorrowWithReputation() public {
        // 1. Update reputation to get high LTV
        vm.startPrank(admin);
        // Multi-tx bonus
        oracle.updateReputation(user, usernameHash, 5000 * 10**18);
        oracle.updateReputation(user, usernameHash, 5000 * 10**18);
        oracle.updateReputation(user, usernameHash, 5000 * 10**18);
        vm.stopPrank();

        (uint8 score, uint256 ltv) = oracle.getCreditScore(user);
        console2.log("User Score:", score);
        console2.log("User LTV:", ltv);

        // 2. Borrow
        vm.startPrank(user);
        uint256 borrowAmount = 100 * 10**18;
        // User score is ~86, LTV 80
        pool.borrow(borrowAmount, 200 * 10**18); 
        
        assertEq(asset.balanceOf(user), borrowAmount);
        vm.stopPrank();
    }

    function testZeroCollateralBorrow() public {
        // Get score to 90+
        vm.startPrank(admin);
        for(uint i=0; i<25; i++) {
            oracle.updateReputation(user, usernameHash, 1000 * 10**18);
        }
        vm.stopPrank();

        (uint8 score, uint256 ltv) = oracle.getCreditScore(user);
        assertGe(score, 85);

        // Borrow with 0 collateral
        vm.prank(user);
        pool.borrow(500 * 10**18, 0);
        
        assertEq(asset.balanceOf(user), 500 * 10**18);
    }
}
