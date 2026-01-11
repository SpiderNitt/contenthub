import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { usePrivy } from '@privy-io/react-auth';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI } from '@/config/constants';

export function useSubscription(creatorAddress: string) {
    const { user } = usePrivy();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [expiry, setExpiry] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const checkStatus = async () => {
        if (!creatorAddress || !user?.wallet?.address) {
            setIsLoading(false);
            return;
        }

        try {
            const client = createPublicClient({
                chain: baseSepolia,
                transport: http()
            });

            // Use the view function checkSubscription
            const status = await client.readContract({
                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                abi: CREATOR_HUB_ABI,
                functionName: 'checkSubscription',
                args: [user.wallet.address as `0x${string}`, creatorAddress as `0x${string}`]
            }) as boolean;

            setIsSubscribed(status);

            // Also fetch exact expiry if needed
            const expiryTimestamp = await client.readContract({
                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                abi: CREATOR_HUB_ABI,
                functionName: 'subscriptions',
                args: [user.wallet.address as `0x${string}`, creatorAddress as `0x${string}`]
            }) as bigint;

            setExpiry(Number(expiryTimestamp));

        } catch (e) {
            console.error("Failed to check on-chain subscription:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        // Poll every 10 seconds? Or just checking on mount/user change is fine for now
    }, [creatorAddress, user?.wallet?.address]);

    // Helper to manually refresh
    const refresh = () => checkStatus();

    return {
        tierId: isSubscribed ? 1 : 0, // Mapping boolean to tier for now
        isSubscribed,
        expiry,
        isLoading,
        refresh
    };
}
