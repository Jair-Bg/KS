import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Prediction Market",
  projectId: "demo-project-id", // WalletConnect project ID — replace with yours for production
  chains: [baseSepolia],
  ssr: false,
});

// Base Sepolia USDC (Circle test token)
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;

// Prediction Market Contract — deploy and update this address
export const PREDICTION_MARKET_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
