import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, erc20Abi, createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI } from '@/config/constants';

// Payment metadata interface for type safety
interface PaymentMetadata {
    chainId: number;
    tokenAddress: string;
    amount: string;
    recipient: string;
    paymentParameter?: {
        minerOf?: string;
        contentId?: string; // For rentals
    };
}

// Extended payment states for better UX
type PaymentState = 'idle' | 'required' | 'paying' | 'confirming' | 'verifying' | 'success' | 'error';

interface PaymentError {
    code: string;
    message: string;
}

export function useX402() {
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const [loading, setLoading] = useState(false);
    const [paymentState, setPaymentState] = useState<PaymentState>('idle');
    const [error, setError] = useState<PaymentError | null>(null);

    // Validate payment metadata
    const validateMetadata = (metadata: any): metadata is PaymentMetadata => {
        if (!metadata) {
            throw new Error("Payment metadata is required");
        }
        if (!metadata.chainId || typeof metadata.chainId !== 'number') {
            throw new Error("Invalid chainId in payment metadata");
        }
        if (!metadata.tokenAddress || typeof metadata.tokenAddress !== 'string') {
            throw new Error("Invalid tokenAddress in payment metadata");
        }
        if (!metadata.amount || typeof metadata.amount !== 'string') {
            throw new Error("Invalid amount in payment metadata");
        }
        if (!metadata.recipient || typeof metadata.recipient !== 'string') {
            throw new Error("Invalid recipient in payment metadata");
        }
        return true;
    };

    const handlePayment = async (metadata: any): Promise<string> => {
        try {
            setLoading(true);
            setError(null);
            setPaymentState('paying');

            // Validate metadata first
            validateMetadata(metadata);

            console.log("[x402] Starting payment flow...", {
                user: user?.wallet?.address,
                wallets: wallets.map(w => w.address),
                metadata
            });

            // Find matching wallet
            const wallet = wallets.find(w => w.address.toLowerCase() === user?.wallet?.address?.toLowerCase());
            if (!wallet) {
                console.error("[x402] Wallet not found. Available:", wallets.map(w => w.address));
                throw new Error("No wallet connected matching user address");
            }

            // 1. Switch chain if needed (Base Sepolia 84532)
            const chainIdStr = wallet.chainId.toString();
            const currentChainId = chainIdStr.includes(':') ? Number(chainIdStr.split(':')[1]) : Number(chainIdStr);
            const targetChainId = Number(metadata.chainId);

            console.log("[x402] Chain Check:", { currentChainId, targetChainId });

            if (currentChainId !== targetChainId) {
                console.log("[x402] Switching chain...");
                try {
                    await wallet.switchChain(targetChainId);
                } catch (err: any) {
                    throw new Error(`Failed to switch to chain ${targetChainId}: ${err.message}`);
                }
            }

            // 2. Check ETH balance
            const publicClient = createPublicClient({
                chain: baseSepolia,
                transport: http()
            });

            try {
                const balance = await publicClient.getBalance({
                    address: wallet.address as `0x${string}`
                });

                const requiredAmount = BigInt(metadata.amount);
                const gasBuffer = BigInt("100000000000000"); // 0.0001 ETH for gas
                const totalRequired = requiredAmount + gasBuffer;

                if (balance < totalRequired) {
                    const balanceFormatted = (Number(balance) / 1e18).toFixed(4);
                    const requiredFormatted = (Number(requiredAmount) / 1e18).toFixed(4);
                    throw new Error(`Insufficient ETH balance. You have ${balanceFormatted} ETH but need ${requiredFormatted} ETH + gas. Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia`);
                }

                console.log("[x402] ETH Balance check passed");
            } catch (err: any) {
                if (err.message.includes('Insufficient ETH')) {
                    throw err;
                }
                console.warn("[x402] Balance check failed, proceeding anyway:", err);
            }

            // 2.5 Check Token Balance (if ERC20)
            if (metadata.tokenAddress && metadata.tokenAddress !== '0x0000000000000000000000000000000000000000') {
                try {
                    const tokenBalance = await publicClient.readContract({
                        address: metadata.tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [wallet.address as `0x${string}`]
                    }) as bigint;

                    const requiredTokenAmount = BigInt(metadata.amount);
                    if (tokenBalance < requiredTokenAmount) {
                        const requiredFmt = (Number(requiredTokenAmount) / 1000000).toFixed(2); // Assuming 6 decimals for USDC
                        const balanceFmt = (Number(tokenBalance) / 1000000).toFixed(2);
                        throw new Error(`Insufficient USDC balance. Have: ${balanceFmt}, Need: ${requiredFmt}. Get free testnet USDC from faucet.circle.com`);
                    }
                    console.log("[x402] Token Balance check passed");
                } catch (err: any) {
                    if (err.message.includes('Insufficient USDC')) throw err;
                    console.warn("[x402] Token balance check skipped:", err);
                }
            }

            // 3. Get provider and send transaction
            const provider = await wallet.getEthereumProvider();
            let txHash: string;

            if (metadata.recipient === CREATOR_HUB_ADDRESS) {
                // Smart contract interaction
                console.log("[x402] Smart Contract Interaction:", metadata);

                if (metadata.paymentParameter?.contentId) {
                    // Rental: rentContent(uint256 _contentId)
                    const data = encodeFunctionData({
                        abi: CREATOR_HUB_ABI,
                        functionName: 'rentContent',
                        args: [BigInt(metadata.paymentParameter.contentId)]
                    });

                    txHash = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            to: CREATOR_HUB_ADDRESS,
                            from: wallet.address,
                            data: data,
                            value: '0x' + BigInt(metadata.amount).toString(16)
                        }]
                    }) as string;

                } else if (metadata.paymentParameter?.minerOf) {
                    // Subscription: subscribe(address _creator)
                    const data = encodeFunctionData({
                        abi: CREATOR_HUB_ABI,
                        functionName: 'subscribe',
                        args: [metadata.paymentParameter.minerOf as `0x${string}`]
                    });

                    txHash = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            to: CREATOR_HUB_ADDRESS,
                            from: wallet.address,
                            data: data,
                            value: '0x' + BigInt(metadata.amount).toString(16)
                        }]
                    }) as string;
                } else {
                    throw new Error("Invalid payment parameters for smart contract");
                }

            } else if (metadata.tokenAddress && metadata.tokenAddress !== '0x0000000000000000000000000000000000000000') {
                // ERC20 Transfer
                const data = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [metadata.recipient as `0x${string}`, BigInt(metadata.amount)]
                });

                try {
                    txHash = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            to: metadata.tokenAddress, // Token contract address
                            from: wallet.address,
                            data: data
                        }]
                    }) as string;
                } catch (err: any) {
                    if (err.code === 4001 || err.message?.includes('User rejected')) {
                        throw new Error("Transaction rejected by user");
                    }
                    throw new Error(`ERC20 Transfer failed: ${err.message}`);
                }
            } else {
                // Native ETH Transfer (Direct to Creator)
                try {
                    let txData = '0x';
                    // Encode Content ID as data if present
                    if (metadata.paymentParameter?.contentId) {
                        // Pad to 32 bytes (64 hex chars)
                        const contentIdHex = BigInt(metadata.paymentParameter.contentId).toString(16).padStart(64, '0');
                    } else if (metadata.paymentParameter?.minerOf) {
                        // Subscription: Encode creator address
                        // Pad to 32 bytes (64 hex chars)
                        const minerOfHex = metadata.paymentParameter.minerOf.replace('0x', '').padStart(64, '0');
                        txData = `0x${minerOfHex}`;
                    }

                    txHash = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            to: metadata.recipient,
                            value: '0x' + BigInt(metadata.amount).toString(16),
                            from: wallet.address,
                            data: txData
                        }]
                    }) as string;
                } catch (err: any) {
                    // Handle user rejection
                    if (err.code === 4001 || err.message?.includes('User rejected')) {
                        throw new Error("Transaction rejected by user");
                    }
                    // Handle insufficient funds
                    if (err.message?.includes('insufficient funds')) {
                        throw new Error("Insufficient ETH for gas fees. You need a small amount of ETH on Base Sepolia.");
                    }
                    throw new Error(`Transaction failed: ${err.message || 'Unknown error'}`);
                }
            }

            console.log("[x402] Payment TX sent:", txHash);
            setPaymentState('confirming');

            // 5. Wait for transaction confirmation
            // Reuse publicClient from balance check
            console.log("[x402] Waiting for transaction confirmation...");

            try {
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash as `0x${string}`,
                    timeout: 60_000, // 60 second timeout
                    confirmations: 1
                });

                if (receipt.status !== 'success') {
                    throw new Error("Transaction failed on-chain");
                }

                console.log("[x402] Transaction confirmed:", receipt);
                setPaymentState('verifying');

                return txHash;

            } catch (err: any) {
                if (err.message?.includes('timeout')) {
                    // Transaction sent but not confirmed in time
                    // Still return hash so backend can verify later
                    console.warn("[x402] Transaction confirmation timeout, proceeding with hash:", txHash);
                    setPaymentState('verifying');
                    return txHash;
                }
                throw err;
            }

        } catch (err: any) {
            console.error("[x402] Payment error:", err);

            const paymentError: PaymentError = {
                code: err.code || 'PAYMENT_FAILED',
                message: err.message || 'Payment failed'
            };

            setError(paymentError);
            setPaymentState('error');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPayment = () => {
        setPaymentState('idle');
        setError(null);
        setLoading(false);
    };

    return {
        handlePayment,
        paymentState,
        setPaymentState,
        resetPayment,
        loading,
        error
    };
}
