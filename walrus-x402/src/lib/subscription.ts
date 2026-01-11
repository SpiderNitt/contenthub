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

        // TODO: Implement real payment verification
        // This would check:
        // 1. On-chain payment records
        // 2. Subscription status
        // 3. Token holdings
        // 4. NFT ownership
        // etc.

        // For now, in development, grant access to all authenticated users
        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev) {
            // return {
            //     hasAccess: true,
            //     reason: 'Development mode - auto-authorized'
            // };
            console.log('[Access] Dev mode, but enforcing payment for testing');
        }

        // In production, deny by default until payment system is implemented
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
 * This is a placeholder for future implementation
 * 
 * @param txHash - Transaction hash to verify
 * @param expectedAmount - Expected payment amount
 * @param creatorAddress - Creator receiving payment
 * @returns Whether payment is valid
 */
export async function verifyPaymentTransaction(
    txHash: string,
    expectedAmount: bigint,
    creatorAddress: Address
): Promise<boolean> {
    try {
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        const receipt = await client.getTransactionReceipt({
            hash: txHash as `0x${string}`
        });

        if (!receipt || receipt.status !== 'success') {
            return false;
        }

        const transaction = await client.getTransaction({
            hash: txHash as `0x${string}`
        });

        // Verify transaction details
        const isCorrectRecipient = transaction.to?.toLowerCase() === creatorAddress.toLowerCase();
        const isCorrectAmount = transaction.value >= expectedAmount;

        return isCorrectRecipient && isCorrectAmount;

    } catch (error) {
        console.error('Error verifying payment:', error);
        return false;
    }
}
