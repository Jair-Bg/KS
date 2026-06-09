import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  binanceWallet,
  bybitWallet,
  okxWallet,
  phantomWallet,
  ledgerWallet,
  rabbyWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { base, baseSepolia, mainnet } from "wagmi/chains";

const projectId = "demo-project-id"; // WalletConnect projectId — replace for production

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        binanceWallet,
        bybitWallet,
        okxWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        trustWallet,
        rainbowWallet,
        phantomWallet,
        rabbyWallet,
        ledgerWallet,
        injectedWallet,
      ],
    },
  ],
  { appName: "Kastia", projectId },
);

export const config = createConfig({
  connectors,
  chains: [base, baseSepolia, mainnet],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false,
});

// USDC — the platform's stablecoin of record
export const USDC = {
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  // Base Sepolia (test) and Base mainnet addresses
  addresses: {
    [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  } as Record<number, string>,
} as const;

// Backwards compatible exports
export const USDC_ADDRESS = USDC.addresses[baseSepolia.id];
export const USDC_DECIMALS = USDC.decimals;

// Prediction Market Contract — deploy and update this address
export const PREDICTION_MARKET_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
