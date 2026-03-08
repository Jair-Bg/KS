import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import { PredictionMarketABI, ERC20ABI } from "@/lib/contracts/PredictionMarketABI";
import { PREDICTION_MARKET_ADDRESS, USDC_ADDRESS, USDC_DECIMALS } from "@/lib/wagmi";

export function useUSDCBalance() {
  const { address } = useAccount();
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balance = data ? Number(data) / 10 ** USDC_DECIMALS : 0;
  return { balance, refetch };
}

export function useUSDCAllowance() {
  const { address } = useAccount();
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address ? [address, PREDICTION_MARKET_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  return { allowance: data ?? BigInt(0), refetch };
}

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: number) => {
    const value = parseUnits(amount.toString(), USDC_DECIMALS);
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20ABI,
      functionName: "approve",
      args: [PREDICTION_MARKET_ADDRESS, value],
    });
  };

  return { approve, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function usePlaceBetOnchain() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const placeBet = (marketId: bigint, optionIndex: bigint, amount: number) => {
    const value = parseUnits(amount.toString(), USDC_DECIMALS);
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PredictionMarketABI,
      functionName: "placeBet",
      args: [marketId, optionIndex, value],
    });
  };

  return { placeBet, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useCreateMarketOnchain() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createMarket = (question: string, endTime: bigint, optionCount: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PredictionMarketABI,
      functionName: "createMarket",
      args: [question, endTime, optionCount],
    });
  };

  return { createMarket, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useResolveMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const resolve = (marketId: bigint, winningOption: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PredictionMarketABI,
      functionName: "resolveMarket",
      args: [marketId, winningOption],
    });
  };

  return { resolve, isPending: isPending || isConfirming, isSuccess, error, hash };
}

export function useClaimWinnings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = (marketId: bigint) => {
    writeContract({
      address: PREDICTION_MARKET_ADDRESS,
      abi: PredictionMarketABI,
      functionName: "claim",
      args: [marketId],
    });
  };

  return { claim, isPending: isPending || isConfirming, isSuccess, error, hash };
}
