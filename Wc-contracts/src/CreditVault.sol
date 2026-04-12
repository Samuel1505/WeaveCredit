// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CreditVault
 * @author WeaveCredit
 * @notice Holds the protocol's liquidity buffer and manages liquidations.
 * This contract is designed to be RWA/extension ready to secure undercollateralized positions.
 */
contract CreditVault is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    
    IERC20 public immutable asset;
    address public lendingPool;

    event Liquidated(address indexed user, uint256 amountClaimed, address indexed liquidator);
    event BufferDeposited(address indexed provider, uint256 amount);

    constructor(address _admin, address _asset) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        asset = IERC20(_asset);
    }

    function setLendingPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lendingPool = _pool;
    }

    /**
     * @notice Allows liquidity providers to deposit into the protocol buffer.
     * @param amount The amount to deposit
     */
    function depositBuffer(uint256 amount) external {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        emit BufferDeposited(msg.sender, amount);
    }

    /**
     * @notice Handle liquidations for defaulted or underwater loans.
     * @dev In an interwoven rollup, this can be triggered by cross-chain price oracle signals.
     * @param user The address of the borrower to liquidate
     * @param amount The amount to recover from the vault buffer or collateral
     */
    function liquidate(address user, uint256 amount) external onlyRole(LIQUIDATOR_ROLE) {
        require(asset.balanceOf(address(this)) >= amount, "Insufficient vault buffer");
        
        // Logical recovery from the pool would happen here
        // asset.safeTransfer(msg.sender, amount); 

        emit Liquidated(user, amount, msg.sender);
    }

    /**
     * @notice Emergency withdrawal for the admin.
     */
    function emergencyWithdraw(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        asset.safeTransfer(msg.sender, amount);
    }
}
