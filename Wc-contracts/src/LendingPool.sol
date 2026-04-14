// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReputationOracle} from "./ReputationOracle.sol";

/**
 * @title LendingPool
 * @author WeaveCredit
 * @notice Undercollateralized lending pool powered by ReputationOracle scores.
 */
contract LendingPool {
    using SafeERC20 for IERC20;

    ReputationOracle public immutable reputationOracle;
    IERC20 public immutable asset; // The asset being lent (e.g., INIT or iUSD)

    struct Loan {
        uint256 principal;
        uint256 collateral;      
        uint256 ltv;           
        uint256 startBlock;
        bool active;
    }

    mapping(address => Loan) public loans;
    
    // Minimum scores required for specific LTV tiers
    mapping(uint256 => uint8) public minScoreForLTV;

    event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 ltv);
    event Repaid(address indexed user, uint256 amount);

    constructor(address _oracle, address _asset) {
        reputationOracle = ReputationOracle(_oracle);
        asset = IERC20(_asset);
        
        // Initialize default tiers
        minScoreForLTV[90] = 90; // Need 90 score for 90% LTV
        minScoreForLTV[80] = 70; // Need 70 score for 80% LTV
        minScoreForLTV[70] = 50; // Need 50 score for 70% LTV
    }

    /**
     * @notice Borrow assets based on reputation-derived LTV.
     * @param amount The amount to borrow
     * @param collateralValue The value of collateral provided (could be 0 for high-score users)
     */
    function borrow(uint256 amount, uint256 collateralValue) external {
        require(!loans[msg.sender].active, "Existing loan active");
        
        (uint8 score, uint256 maxLtv) = reputationOracle.getCreditScore(msg.sender);
        
        // Calculate required collateral based on score
        // For score >= 85, we allow zero-collateral up to a certain limit (credit line)
        uint256 requiredCollateral = 0;
        if (score < 85) {
            requiredCollateral = (amount * 100) / maxLtv;
            require(collateralValue >= requiredCollateral, "Insufficient collateral for your score");
        }

        loans[msg.sender] = Loan({
            principal: amount,
            collateral: collateralValue,
            ltv: maxLtv,
            startBlock: block.number,
            active: true
        });

        // asset.safeTransfer(msg.sender, amount); // Mocked for UI demo

        emit Borrowed(msg.sender, amount, collateralValue, maxLtv);
    }

    /**
     * @notice Repay the loan to clear the position and boost reputation.
     */
    function repay() external {
        Loan storage loan = loans[msg.sender];
        require(loan.active, "No active loan");

        uint256 repaymentAmount = loan.principal; // Simple model: no interest for hackathon MVP
        
        // asset.safeTransferFrom(msg.sender, address(this), repaymentAmount); // Mocked for UI demo
        
        loan.active = false;
        
        emit Repaid(msg.sender, repaymentAmount);
    }
}
