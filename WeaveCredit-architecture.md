# WeaveCredit: Technical Architecture
Reputation-Powered Undercollateralized Lending on a Sovereign Initia EVM Minitia
This document details the full-stack architecture for WeaveCredit, optimized for the INITIATE Hackathon (Season 1) DeFi track. It is built as a sovereign EVM rollup (Minitia) on Initia testnet (initiation-2), leveraging the Interwoven Stack for instant cross-rollup liquidity, native identity, and frictionless UX.
The design maximizes the 30% Technical Execution & Initia Integration scoring weight by deeply using mandatory native features: .init usernames, Interwoven Bridge, and Auto-signing/Session UX via @initia/interwovenkit-react.

1. High-Level System Overview
┌─────────────────────────────────────────────────────────────┐
│                    Initia L1 (initiation-2)                 │
│  - Enshrined liquidity & MEV                                │
│  - Oracle price feeds (enabled at genesis)                  │
│  - IBC + OPinit modules                                     │
└───────────────▲───────────────────────▲─────────────────────┘
                │                       │
   IBC/OPinit   │                       │   Interwoven Bridge
                │                       │
┌───────────────▼───────────────────────▼─────────────────────┐
│                  WeaveCredit Minitia (EVM Rollup)           │
│  Chain ID: weavecredit-1 (example)                          │
│  VM: EVM (Solidity + Foundry)                               │
│  Block time: ~100ms                                         │
│  Gas denom: umin                                            │
│                                                             │
│  ┌──────────────────────┐   ┌─────────────────────────────┐ │
│  │ Reputation Oracle    │   │ LendingPool + CreditVault   │ │
│  │ (on-chain verifier)  │◄──►│ (undercollateralized loans) │ │
│  └──────────────────────┘   └─────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────┐                                   │
│  │ Gas Station Account  │ (developer-controlled relayer)    │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
                │
       @initia/interwovenkit-react (Frontend)
                │
   Auto-sign Session + .init username + Bridge UI


Core thesis: The Minitia owns 100% of its economics (no sequencer/gas tax leakage). Reputation is computed from ecosystem-wide activity bridged via OPinit/IBC, enabling 70–90% LTV loans.

Smart Contract Architecture (Solidity on EVM Minitia)
Built with Foundry (recommended in docs). Three core contracts: 

1. ReputationOracle.sol 

contract ReputationOracle {
    struct ActivityProof {
        bytes32 initUsernameHash;
        uint256 bridgedTxCount;      // from Interwoven Bridge events
        uint256 totalVolume;         // aggregated via oracle + IBC proofs
        uint256 lastActivityBlock;
        bytes32 merkleRoot;          // cross-rollup activity proof
    }

    mapping(bytes32 => ActivityProof) public creditScores; // keyed by .init hash

    // Called by frontend via session-signed tx or Gas Station
    function updateReputation(
        bytes32 usernameHash,
        bytes calldata bridgeProof,     // OPinit deposit/finalize proof
        uint256 volume
    ) external {
        // Verify proof via Initia L1 oracle + bridged IBC data
        // Score formula: base 50 + (txCount * 2) + (volume * 0.01) + bonuses
        // Max 100, decays if inactive
    }

    function getCreditScore(address user) external view returns (uint8 score, uint256 ltv);
}


LendingPool.sol

contract LendingPool {
    using SafeERC20 for IERC20; // iUSD or INIT as base

    struct Loan {
        uint256 principal;
        uint256 collateral;      // 0 for high-score users
        uint8 ltvTier;           // 70/80/90 based on score
        uint256 startBlock;
    }

    mapping(address => Loan) public loans;

    function borrow(uint256 amount, uint8 expectedLTV) external {
        uint8 score = reputationOracle.getCreditScore(msg.sender);
        require(score >= minScoreForLTV[expectedLTV]);

        // Zero-collateral for score ≥ 85
        // Flash-loan helper for instant cross-rollup routing
    }

    function repay(uint256 loanId) external;
}


CreditVault.sol (RWA/extension ready)
Holds over-collateralized buffer for low-score users + liquidation logic using enshrined oracle prices.
Deployment flow:

forge script to deploy via Gas Station key.
Verify on Minitia explorer (auto-provided post-weave)


Reputation Oracle Mechanism (Cross-Rollup)
How it achieves ecosystem-wide credit:

.init username is resolved on L1 (via Initia Usernames module) and hashed on Minitia.
Activity aggregation:
User bridges assets via Interwoven Bridge → OPinit FinalizeTokenDeposit event emitted on Minitia.
Oracle contract listens to these events + L1 oracle price feeds.
MVP simplification: Frontend calls updateReputation after a successful bridge (proof passed as calldata).

Scoring formula (on-chain, deterministic):text

