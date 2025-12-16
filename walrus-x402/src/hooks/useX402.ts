import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';

export function useX402() {
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const [loading, setLoading] = useState(false);
    const [paymentState, setPaymentState] = useState<'idle' | 'required' | 'paying' | 'verifying' | 'success' | 'error'>('idle');
    const [paymentMetadata, setPaymentMetadata] = useState<any>(null);

    const handlePayment = async (metadata: any) => {
        try {
            setPaymentState('paying');

            console.log("Starting payment flow...", { user: user?.wallet?.address, wallets: wallets.map(w => w.address) });

            const wallet = wallets.find(w => w.address.toLowerCase() === user?.wallet?.address?.toLowerCase());
            if (!wallet) {
                console.error("Wallet not found. Available:", wallets.map(w => w.address));
                throw new Error("No wallet connected matching user address");
            }

            // 1. Switch chain if needed (Base Sepolia 84532)
            // Handle CAIP-2 (eip155:84532) or raw number
            const chainIdStr = wallet.chainId.toString();
            const currentChainId = chainIdStr.includes(':') ? Number(chainIdStr.split(':')[1]) : Number(chainIdStr);
            const targetChainId = Number(metadata.chainId);

            console.log("Chain Check:", { currentChainId, targetChainId });

            if (currentChainId !== targetChainId) {
                console.log("Switching chain...");
                await wallet.switchChain(targetChainId);
            }

            // 2. Send TX (USDC Transfer)
            // metadata: { tokenAddress, amount, recipient ... }
            // This is a simplified direct transfer. Real x402 might interact with a Facilitator contract.
            // We assume simple ERC20 transfer for this prototype as per prompt "tokenAddress", "amount", "recipient".

            const provider = await wallet.getEthereumProvider();

            // Construct ERC20 transfer data
            // We use viem or just construct data manually if simple.
            // wallet.sendTransaction generic.

            // Let's assume standard ERC20 transfer.
            // function transfer(address to, uint256 amount)
            const data = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [metadata.recipient, BigInt(metadata.amount)]
            });

            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [{
                    to: metadata.tokenAddress,
                    data,
                    from: wallet.address
                }]
            });

            console.log("Payment TX sent:", txHash);
            setPaymentState('verifying');

            // 3. Return proof
            // In real x402, we might wait for receipt, then send hash as proof.
            return txHash;

        } catch (err) {
            console.error(err);
            setPaymentState('error');
            throw err;
        }
    };

    return {
        handlePayment,
        paymentState,
        setPaymentState, // Allow resetting
        loading
    };
}
