import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifyPrivyToken, unauthorizedResponse, verifyWalletOwnership } from '@/lib/auth';
import { createPublicClient, encodeFunctionData, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { isValidTransactionHash, isValidWalletAddress, isValidTierId } from '@/lib/validation';
import { CREATOR_HUB_ABI, CREATOR_HUB_ADDRESS, CHAIN_ID, USDC_SEPOLIA_ADDRESS } from '@/config/constants';

// Setup Viem Client
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

// In-memory idempotency store (in production, use Redis or database)
const processedPayments = new Map<string, { timestamp: number; result: any }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

// Rate limiting function
function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW
        });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    record.count++;
    return true;
}

async function verifyTransaction(
    txHash: string,
    expectedSender: string,
    expectedCreator: string
): Promise<{ valid: boolean; error?: string }> {
    try {
        let tx, receipt;
        try {
            tx = await publicClient.getTransaction({
                hash: txHash as `0x${string}`
            });
            receipt = await publicClient.getTransactionReceipt({
                hash: txHash as `0x${string}`
            });
        } catch (err: any) {
            console.error("[x402] Failed to get transaction:", err);
            return { valid: false, error: "Transaction not found or not yet confirmed" };
        }

        if (receipt.status !== 'success') {
            return { valid: false, error: "Transaction failed on-chain" };
        }

        if (tx.from.toLowerCase() !== expectedSender.toLowerCase()) {
            console.error(`[x402] Sender mismatch. Got ${tx.from}, expected ${expectedSender}`);
            return { valid: false, error: "Transaction sender does not match authenticated user" };
        }

        if (tx.to?.toLowerCase() !== CREATOR_HUB_ADDRESS.toLowerCase()) {
            console.error(`[x402] Wrong recipient. Got ${tx.to}, expected ${CREATOR_HUB_ADDRESS}`);
            return { valid: false, error: "Invalid recipient" };
        }

        const expectedData = encodeFunctionData({
            abi: CREATOR_HUB_ABI,
            functionName: 'subscribe',
            args: [expectedCreator as `0x${string}`]
        });

        if (tx.input.toLowerCase() !== expectedData.toLowerCase()) {
            return { valid: false, error: 'Transaction call data mismatch' };
        }

        try {
            const hasSubscription = await publicClient.readContract({
                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                abi: CREATOR_HUB_ABI,
                functionName: 'checkSubscription',
                args: [expectedSender as `0x${string}`, expectedCreator as `0x${string}`]
            }) as boolean;

            if (!hasSubscription) {
                return { valid: false, error: 'Subscription was not activated on-chain' };
            }
        } catch (err: any) {
            return { valid: false, error: err.message || 'Subscription check failed' };
        }

        return { valid: true };

    } catch (e: any) {
        console.error("[x402] Verification Error:", e);
        return { valid: false, error: e.message || "Verification failed" };
    }
}

export async function POST(req: NextRequest) {
    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    // Rate limiting check
    if (!checkRateLimit(userClaims.userId)) {
        return NextResponse.json({
            error: 'Too many requests',
            details: 'Please wait before trying again'
        }, {
            status: 429,
            headers: {
                'Retry-After': '60'
            }
        });
    }

    // Parse and validate request body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({
            error: 'Invalid request body'
        }, { status: 400 });
    }

    const { creatorAddress, tierId, idempotencyKey, walletAddress } = body;

    if (!creatorAddress || tierId === undefined || !walletAddress) {
        return NextResponse.json({
            error: 'Missing required fields',
            details: 'creatorAddress, tierId, and walletAddress are required'
        }, { status: 400 });
    }

    if (!isValidWalletAddress(walletAddress)) {
        return NextResponse.json({
            error: 'Invalid wallet address format'
        }, { status: 400 });
    }

    const isWalletOwned = await verifyWalletOwnership(userClaims.userId, walletAddress);
    if (!isWalletOwned) {
        return NextResponse.json({
            error: 'walletAddress does not belong to authenticated user'
        }, { status: 403 });
    }

    // Validate creator address format
    if (!isValidWalletAddress(creatorAddress)) {
        return NextResponse.json({
            error: 'Invalid creator address format'
        }, { status: 400 });
    }

    // Validate tier ID
    if (!isValidTierId(tierId)) {
        return NextResponse.json({
            error: 'Invalid tier ID',
            details: 'Tier ID must be a number between 0 and 10'
        }, { status: 400 });
    }

    // Validate idempotency key if provided
    if (idempotencyKey && typeof idempotencyKey !== 'string') {
        return NextResponse.json({
            error: 'Invalid idempotency key format'
        }, { status: 400 });
    }

    let subscriptionAmount: bigint;
    try {
        const creatorData = await publicClient.readContract({
            address: CREATOR_HUB_ADDRESS as `0x${string}`,
            abi: CREATOR_HUB_ABI,
            functionName: 'creators',
            args: [creatorAddress as `0x${string}`]
        }) as readonly [string, `0x${string}`, boolean, bigint, bigint, bigint];

        if (!creatorData[2]) {
            return NextResponse.json({ error: 'Creator not registered' }, { status: 404 });
        }

        subscriptionAmount = creatorData[3];
        if (subscriptionAmount <= 0n) {
            return NextResponse.json({ error: 'Creator subscription price is invalid' }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch creator pricing' }, { status: 500 });
    }

    const paymentProof = req.headers.get('X-PAYMENT');

    if (paymentProof) {

        // Validate transaction hash format
        if (!isValidTransactionHash(paymentProof)) {
            return NextResponse.json({
                error: 'Invalid transaction hash format',
                details: 'Transaction hash must be a valid hex string'
            }, { status: 400 });
        }

        // Check idempotency - prevent duplicate processing
        if (idempotencyKey) {
            const cached = processedPayments.get(idempotencyKey);
            if (cached && (Date.now() - cached.timestamp) < IDEMPOTENCY_TTL) {
                return NextResponse.json(cached.result);
            }
        }

        const verification = await verifyTransaction(
            paymentProof,
            walletAddress,
            creatorAddress
        );

        if (verification.valid) {
            const subscription = {
                id: `sub_${randomUUID()}`,
                creatorAddress,
                tierId,
                status: 'ACTIVE',
                startsAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                transactionHash: paymentProof
            };

            const result = {
                status: 'activated',
                subscription
            };

            // Cache the result for idempotency
            if (idempotencyKey) {
                processedPayments.set(idempotencyKey, {
                    timestamp: Date.now(),
                    result
                });

                // Clean up old entries periodically
                if (processedPayments.size > 1000) {
                    const now = Date.now();
                    for (const [key, value] of processedPayments.entries()) {
                        if (now - value.timestamp > IDEMPOTENCY_TTL) {
                            processedPayments.delete(key);
                        }
                    }
                }
            }

            return NextResponse.json(result);
        } else {
            // Don't expose detailed error to client in production
            const errorMessage = process.env.NODE_ENV === 'production'
                ? 'Payment verification failed'
                : verification.error || 'Invalid payment proof';

            return NextResponse.json({
                error: 'Payment verification failed',
                details: errorMessage
            }, { status: 400 });
        }
    }

    // Return 402 Payment Required with x402 protocol headers
    const paymentMetadata = {
        chainId: CHAIN_ID,
        tokenAddress: USDC_SEPOLIA_ADDRESS,
        amount: subscriptionAmount.toString(),
        recipient: CREATOR_HUB_ADDRESS,
        paymentParameter: {
            minerOf: creatorAddress,
            action: 'subscribe'
        }
    };

    return NextResponse.json(paymentMetadata, {
        status: 402,
        headers: {
            // x402 protocol headers
            'X-Accept-Payment': 'erc20-transfer',
            'X-Payment-Required': `${subscriptionAmount.toString()} USDC_BASE_UNITS on chain ${CHAIN_ID}`,
            'X-Payment-Chain-Id': CHAIN_ID.toString(),
            'X-Payment-Token': USDC_SEPOLIA_ADDRESS,
            'X-Payment-Amount': subscriptionAmount.toString(),
            'X-Payment-Recipient': CREATOR_HUB_ADDRESS,
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        }
    });
}
