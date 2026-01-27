import { createPublicClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI } from '@/config/constants';

/**
 * Subscription Verification
 * Checks if a user has access to content based on on-chain data
 */

export interface AccessCheckResult {
    hasAccess: boolean;
    reason?: string;
}

/**
 * Check if a user has uploaded content (creator access)
 * @param userAddress - User's wallet address
 * @returns Whether user is a registered creator
 */
export async function isRegisteredCreator(
    userAddress: Address
): Promise<boolean> {
    try {
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        // @ts-ignore
        const channelName = await client.readContract({
            address: CREATOR_HUB_ADDRESS as Address,
            abi: CREATOR_HUB_ABI,
            functionName: 'getChannelName',
            args: [userAddress]
        }) as string;

        // If channel name is not "Unknown Channel", user is registered
        return channelName !== "Unknown Channel";
    } catch (error) {
        console.error('Error checking creator status:', error);
        return false;
    }
}

/**
 * Check if user has access to specific content
 * For MVP: All authenticated users have access (dev mode)
 * For Production: Check on-chain payment/subscription
 * 
 * @param userAddress - User's wallet address
 * @param contentId - Content ID
 * @param creatorAddress - Creator's wallet address
 * @returns Access check result
 */
export async function checkContentAccess(
    userAddress: Address,
    contentId: string,
    creatorAddress: Address
): Promise<AccessCheckResult> {
    try {
        // Check if user is the creator (always has access to own content)
        if (userAddress.toLowerCase() === creatorAddress.toLowerCase()) {
            return {
                hasAccess: true,
                reason: 'Content owner'
            };
        }

        // on-chain payment verification
        const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        // 1. Check Rental (24h Access)
        try {
            // @ts-ignore
            const hasRental = await publicClient.readContract({
                address: CREATOR_HUB_ADDRESS as Address,
                abi: CREATOR_HUB_ABI,
                functionName: 'checkRental',
                args: [userAddress, BigInt(contentId)]
            }) as boolean;

            if (hasRental) {
                return {
                    hasAccess: true,
                    reason: 'Active Rental'
                };
            }
        } catch (e) {
            console.error('Error checking rental:', e);
        }

        // 2. Check Subscription (30 Days)
        try {
            // @ts-ignore
            const hasSubscription = await publicClient.readContract({
                address: CREATOR_HUB_ADDRESS as Address,
                abi: CREATOR_HUB_ABI,
                functionName: 'checkSubscription',
                args: [userAddress, creatorAddress]
            }) as boolean;

            if (hasSubscription) {
                return {
                    hasAccess: true,
                    reason: 'Active Subscription'
                };
            }
        } catch (e) {
            console.error('Error checking subscription:', e);
        }

        // For now, in development, grant access to all authenticated users ONLY if manually bypassed
        // Removing auto-grant to enforce payment testing
        /*
        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev) {
             console.log('[Access] Dev mode: Strict payment check active.');
        }
        */

        // Deny access if no valid payment found
        return {
            hasAccess: false,
            reason: 'Payment required'
        };

    } catch (error) {
        console.error('Error checking content access:', error);
        return {
            hasAccess: false,
            reason: 'Verification failed'
        };
    }
}

/**
 * Verify payment transaction on-chain
 * This is a placeholder/fallback. Real verification happens via checkRental/checkSubscription.
 */
export async function verifyPaymentTransaction(
    txHash: string,
    expectedAmount: bigint,
    creatorAddress: Address,
    contentId?: string
): Promise<boolean> {
    try {
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        const tx = await client.getTransaction({
            hash: txHash as `0x${string}`
        });

        // 1. Verify Recipient
        if (tx.to?.toLowerCase() !== creatorAddress.toLowerCase()) {
            console.error(`Verification Failed: Recipient mismatch. Expected ${creatorAddress}, got ${tx.to}`);
            return false;
        }

        // 2. Verify Amount (allow for small gas differences if needed, but exact matches preferred)
        if (tx.value < expectedAmount) {
            console.error(`Verification Failed: Insufficient amount. Expected ${expectedAmount}, got ${tx.value}`);
            return false;
        }

        // 3. Verify Content ID (if provided)
        if (contentId) {
            const expectedData = '0x' + BigInt(contentId).toString(16).padStart(64, '0');
            if (tx.input !== expectedData) {
                console.warn(`Verification Warning: Content ID mismatch or missing data. Expected ${expectedData}, got ${tx.input}`);
                // We might allow this to pass if strictly checking payment amount is enough, 
                // but for direct mapping, data is key.
                // For now, return false to be strict.
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Error verifying transaction:', error);
        return false;
    }
}
