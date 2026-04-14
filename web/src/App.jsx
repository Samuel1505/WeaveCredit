import React, { useState, useEffect } from 'react'
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { encodeFunctionData, parseUnits } from "viem";

const LENDING_POOL_ADDR = "0xDD5046E98B7D911E8c033589008974B601C5caD7";

// ABI for LendingPool
const lendingPoolABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "uint256", "name": "collateralValue", "type": "uint256" }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

function App() {
  const { initiaAddress, username, openConnect, openWallet, openBridge, autoSign, requestTxBlock } = useInterwovenKit();
  const [toast, setToast] = useState(null);
  const [hasRequestedAutoSign, setHasRequestedAutoSign] = useState(false);
  const chainId = "weavecredit-1";

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  const displayName = username ? username : shortenAddress(initiaAddress);
  const isAutoSignEnabled = autoSign?.isEnabledByChain[chainId];

  const handleEnableAutoSign = async () => {
    try {
      await autoSign?.enable(chainId, { permissions: ["/minievm.evm.v1.MsgCall"] });
    } catch (e) {
      console.error("Auto-sign enablement failed:", e);
    }
  };

  const showToast = (msg, time = 6000) => {
    setToast(msg);
    setTimeout(() => setToast(null), time);
  };

  const handleBorrow = async () => {
    if (!initiaAddress) return;
    try {
      const data = encodeFunctionData({
        abi: lendingPoolABI,
        functionName: "borrow",
        args: [parseUnits("5000", 18), 0n]
      });

      await requestTxBlock({
        chainId,
        autoSign: true,
        feeDenom: "GAS",
        messages: [
          {
            typeUrl: "/minievm.evm.v1.MsgCall",
            value: {
              sender: initiaAddress.toLowerCase(),
              contractAddr: LENDING_POOL_ADDR,
              input: data,
              value: "0",
              accessList: [],
              authList: []
            }
          }
        ]
      });

      showToast(
        <span>
          ✅ Loan of 5,000 iUSD issued at 82% LTV<br />
          Repayment due in 30 days • Interest: 4.2% APR
        </span>
      );
    } catch (e) {
      console.error(e);
      if (e.message?.includes("authorization not found")) {
        handleEnableAutoSign();
      } else {
        showToast(`❌ Failed: ${e.message}`);
      }
    }
  };

  const handleBridge = async () => {
    if (!initiaAddress) return;
    try {
      openBridge({ srcChainId: "weavecredit-1" });

      // For demo purposes, we will queue the success toast to appear 
      // shortly after the bridge modal flow is presumably completed.
      setTimeout(() => {
        showToast(
          <span>
            ✅ 5,000 iUSD arrived on Trading Minitia<br />
            You can now trade / provide liquidity there instantly
          </span>
        );
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepay = async () => {
    if (!initiaAddress) return;
    try {
      const data = encodeFunctionData({
        abi: lendingPoolABI,
        functionName: "repay"
      });

      await requestTxBlock({
        chainId,
        autoSign: true,
        feeDenom: "GAS",
        messages: [
          {
            typeUrl: "/minievm.evm.v1.MsgCall",
            value: {
              sender: initiaAddress.toLowerCase(),
              contractAddr: LENDING_POOL_ADDR,
              input: data,
              value: "0",
              accessList: [],
              authList: []
            }
          }
        ]
      });
      showToast("✅ Loan repaid successfully.");
    } catch (e) {
      console.error(e);
      if (e.message?.includes("authorization not found")) {
        handleEnableAutoSign();
      } else {
        showToast(`❌ Repay Failed: ${e.message}`);
      }
    }
  };

  // Automatically request session approval when wallet connects
  useEffect(() => {
    if (!initiaAddress) {
      setHasRequestedAutoSign(false);
    } else if (autoSign && !isAutoSignEnabled && !hasRequestedAutoSign) {
      setHasRequestedAutoSign(true);
      handleEnableAutoSign();
    }
  }, [initiaAddress, isAutoSignEnabled, autoSign, hasRequestedAutoSign]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
      <header style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: '#4f46e5', letterSpacing: '-0.02em' }}>WeaveCredit</h1>

        {!initiaAddress ? (
          <button onClick={openConnect} style={{ padding: '0.6rem 1.2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s' }}>
            Connect with .init
          </button>
        ) : (
          <button onClick={openWallet} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1.2rem', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '100px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#10b981', fontSize: '1.2rem', lineHeight: '1' }}>●</span>
            {displayName}
          </button>
        )}
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: '700px', padding: '2rem 1rem' }}>
        {initiaAddress ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '2rem', marginTop: 0, marginBottom: '0.5rem', color: '#0f172a', fontWeight: 800 }}>
                Welcome, {username || "alice.init"}
              </h2>
              <div style={{ fontSize: '1.15rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                <p style={{ margin: 0 }}>Your ecosystem reputation: <strong style={{ color: '#4f46e5' }}>87/100 (Elite tier)</strong></p>
                <p style={{ margin: 0 }}>Eligible for <strong style={{ color: '#0f172a' }}>82% LTV with zero collateral</strong></p>
              </div>

              {!isAutoSignEnabled && (
                <div style={{ padding: '1rem 1.2rem', background: '#fffbeb', color: '#b45309', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span> Please approve your session to enable gasless UI.
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <button
                  onClick={handleBorrow}
                  disabled={!isAutoSignEnabled}
                  style={{ width: '100%', padding: '1rem 1.5rem', background: isAutoSignEnabled ? '#4f46e5' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '14px', cursor: isAutoSignEnabled ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: isAutoSignEnabled ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none' }}
                >
                  Borrow 5,000 iUSD
                </button>
                <button
                  onClick={handleRepay}
                  disabled={!isAutoSignEnabled}
                  style={{ width: '100%', padding: '1rem 1.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '14px', cursor: isAutoSignEnabled ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s' }}
                >
                  Repay Loan
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#0f172a' }}>Cross-Rollup Liquidity</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>Seamlessly route your borrowed funds to other execution layers without extra signatures.</p>
              <button
                onClick={handleBridge}
                style={{ width: '100%', padding: '1rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
              >
                Bridge to Trading Rollup
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: '1.2' }}>The Future of <span style={{ color: '#4f46e5' }}>Credit</span><br />is Interwoven.</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px' }}>Connect your .init identity to access zero-collateral loans across the Minitswap ecosystem.</p>
            <button onClick={openConnect} style={{ marginTop: '1rem', padding: '1rem 2rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>
              Connect Wallet
            </button>
          </div>
        )}
      </main>

      {/* Toast Notification Container */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#0f172a',
          color: 'white',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          lineHeight: '1.5',
          fontSize: '1rem',
          borderLeft: '4px solid #10b981'
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(150%) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
export default App
