import { Buffer } from 'buffer'
window.Buffer = Buffer
window.process = { env: { NODE_ENV: 'development' } }

import React from 'react'
import ReactDOM from 'react-dom/client'
import "@initia/interwovenkit-react/styles.css";
import { injectStyles, InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.jsx'
import './index.css'

// Inject styles for the widget
injectStyles(InterwovenKitStyles);

const queryClient = new QueryClient();
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

// Custom Appchain Configuration
// This is REQUIRED for local rollups to be recognized by InterwovenKit.
// Set VITE_NATIVE_DECIMALS in .env (for example: VITE_NATIVE_DECIMALS=6) when your chain is not 18 decimals.
const customChain = {
  chain_id: 'weavecredit-1', // Update to match your rollup
  chain_name: 'weavecredit',
  pretty_name: 'WeaveCredit',
  network_type: 'testnet',
  bech32_prefix: 'init',
  logo_URIs: {
    png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
    svg: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg',
  },
  apis: {
    rpc: [{ address: 'http://localhost:26657' }],
    rest: [{ address: 'http://localhost:1317' }],
    indexer: [{ address: 'http://localhost:8080' }],
    "json-rpc": [{ address: 'http://localhost:8545' }], // REQUIRED for EVM rollups
  },
  fees: {
    fee_tokens: [{ 
      denom: 'GAS', 
      fixed_min_gas_price: 0,
      low_gas_price: 0,
      average_gas_price: 0,
      high_gas_price: 0
    }],
  },
  staking: {
    staking_tokens: [{ denom: 'GAS' }]
  },
  metadata: {
    is_l1: false,
    minitia: {
      type: 'minievm', // Use 'minimove', 'miniwasm', or 'minievm'
    },
  },
  native_assets: [
    {
      denom: 'GAS',
      name: 'Native Token',
      symbol: 'GAS',
      decimals: 18
    }
  ]
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          enableAutoSign={true}
          defaultChainId={customChain.chain_id}
          customChain={customChain}
          customChains={[...(TESTNET.customChains || []), customChain]}
        >
          <App />
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
