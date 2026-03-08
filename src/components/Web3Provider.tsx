import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import { useTheme } from "next-themes";

const queryClient = new QueryClient();

function RainbowKitWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <RainbowKitProvider
      theme={resolvedTheme === "dark" ? darkTheme({
        accentColor: "hsl(166, 100%, 36%)",
        accentColorForeground: "white",
        borderRadius: "large",
      }) : lightTheme({
        accentColor: "hsl(166, 100%, 36%)",
        accentColorForeground: "white",
        borderRadius: "large",
      })}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWrapper>
          {children}
        </RainbowKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
