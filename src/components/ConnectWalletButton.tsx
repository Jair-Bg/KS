import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";
import { Wallet, ChevronDown } from "lucide-react";

export function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    variant="signup"
                    size="pill"
                    onClick={openConnectModal}
                    className="gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button variant="destructive" size="pill" onClick={openChainModal}>
                    Wrong Network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <Button
                    variant="odds"
                    size="pill"
                    onClick={openChainModal}
                    className="gap-1.5 hidden sm:flex"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain"}
                        src={chain.iconUrl}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    {chain.name}
                  </Button>

                  <Button
                    variant="odds"
                    size="pill"
                    onClick={openAccountModal}
                    className="gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {account.displayName.slice(0, 2)}
                    </span>
                    <span className="text-sm max-w-[120px] truncate">
                      {account.displayBalance ? `${account.displayBalance}` : account.displayName}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
