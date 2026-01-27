import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { isValidTransactionHash, isValidWalletAddress, isValidTierId } from '@/lib/validation';

// Constants (Should be in env or config)
const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Representation for native ETH
const CHAIN_ID = 84532;
const MOCK_PRICE_WEI = "1000000000000000"; // 0.001 ETH

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
    expectedRecipient: string,
    minAmount: bigint
): Promise<{ valid: boolean; error?: string }> {
    try {
        console.log(`[x402] Verifying TX: ${txHash}`);

        // 1. Get Transaction and Receipt
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
            console.error("[x402] TX failed on-chain");
            return { valid: false, error: "Transaction failed on-chain" };
        }

        // 2. Verify Recipient
        if (tx.to?.toLowerCase() !== expectedRecipient.toLowerCase()) {
            console.error(`[x402] Wrong recipient. Got ${tx.to}, expected ${expectedRecipient}`);
            return { valid: false, error: "Invalid recipient" };
        }

        // 3. Verify Amount
        if (tx.value < minAmount) {
            console.error(`[x402] Insufficient amount. Got ${tx.value}, need ${minAmount}`);
            return {
                valid: false,
                error: `Insufficient payment amount. Required: ${minAmount}, Got: ${tx.value}`
            };
        }

        console.log("[x402] Verification Successful", {
            txHash,
            amount: tx.value.toString(),
            recipient: expectedRecipient
        });
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

    const { creatorAddress, tierId, idempotencyKey } = body;

    // Validate required fields
    if (!creatorAddress || tierId === undefined) {
        return NextResponse.json({
            error: 'Missing required fields',
            details: 'creatorAddress and tierId are required'
        }, { status: 400 });
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

    console.log(`[x402] Processing subscription for ${userClaims.userId} to ${creatorAddress}`);

    // Check for payment proof header
    const paymentProof = req.headers.get('X-PAYMENT');

    if (paymentProof) {
        console.log(`[x402] Processing Payment Proof: ${paymentProof}`);

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
                console.log(`[x402] Returning cached result for idempotency key: ${idempotencyKey}`);
                return NextResponse.json(cached.result);
            }
        }

        // Verify the transaction
        const verification = await verifyTransaction(
            paymentProof,
            creatorAddress,
            BigInt(MOCK_PRICE_WEI)
        );

        if (verification.valid) {
            const subscription = {
                id: 'sub_' + Math.random().toString(36).substr(2, 9),
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
        tokenAddress: NATIVE_ETH,
        amount: MOCK_PRICE_WEI,
        recipient: creatorAddress,
        paymentParameter: {
            minerOf: creatorAddress
        }
    };

    return NextResponse.json(paymentMetadata, {
        status: 402,
        headers: {
            // x402 protocol headers
            'X-Accept-Payment': 'native-transfer',
            'X-Payment-Required': `${MOCK_PRICE_WEI} WEI on chain ${CHAIN_ID}`,
            'X-Payment-Chain-Id': CHAIN_ID.toString(),
            'X-Payment-Token': NATIVE_ETH,
            'X-Payment-Amount': MOCK_PRICE_WEI,
            'X-Payment-Recipient': creatorAddress,
            // Security headers
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        }
    });
}
