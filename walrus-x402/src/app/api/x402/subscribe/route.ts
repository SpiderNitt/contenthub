import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';

// Constants (Should be in env or config)
const USDC_SEPOLIA_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const CHAIN_ID = 84532;
// In real world, this would be an endpoint to Coinbase Commerce or similar if using Facilitator API fully.
// Or we just return the payment metadata for the client to execute onchain.

// Setup Viem Client
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

async function verifyTransaction(txHash: string, expectedRecipient: string, minAmount: bigint): Promise<boolean> {
    try {
        console.log(`[x402] Verifying TX: ${txHash}`);

        // 1. Get Receipt (Wait for it if needed, but here we assume client sent it after confirmation)
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

        if (receipt.status !== 'success') {
            console.error("[x402] TX failed on-chain");
            return false;
        }

        // 2. Check Logs for Transfer event to proper recipient
        // Transfer(address indexed from, address indexed to, uint256 value)
        // Topic 0 is Transfer signature. 
        // We look for a log where 'to' matches expectedRecipient.

        // Note: In production, check the 'address' of the log matches the USDC contract too.
        // For prototype, we loosely check logs.

        const transferLog = receipt.logs.find(log => {
            // Very basic check: is this a Transfer to our recipient?
            // "to" is the second indexed topic (topics[2]).
            // topics[0] = signature, topics[1] = from, topics[2] = to
            if (log.topics.length < 3) return false;

            // normalized comparison
            const toTopic = log.topics[2];
            // Pad recipient to 32 bytes for topic comparison
            const paddedRecipient = '0x' + expectedRecipient.replace('0x', '').toLowerCase().padStart(64, '0');

            return toTopic?.toLowerCase() === paddedRecipient;
        });

        if (!transferLog) {
            console.error("[x402] No Transfer log found for recipient");
            return false;
        }

        // 3. Check Amount (Data part of log for standard ERC20)
        // data is hex string of amount
        const transferredAmount = BigInt(transferLog.data);

        if (transferredAmount < minAmount) {
            console.error(`[x402] Insufficient amount. Got ${transferredAmount}, need ${minAmount}`);
            return false;
        }

        console.log("[x402] Verification Successful");
        return true;

    } catch (e) {
        console.error("[x402] Verification Error:", e);
        return false;
    }
}

export async function POST(req: NextRequest) {
    const userClaims = await verifyPrivyToken(req);
    // In dev mode, verifyPrivyToken might return a mock user if secrets are missing.
    // If it returns null, we really fail.
    if (!userClaims) {
        return unauthorizedResponse();
    }

    const body = await req.json();
    const { creatorAddress, tierId } = body;

    if (!creatorAddress || tierId === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`[Mock DB] Processing subscription for ${userClaims.userId} to ${creatorAddress}`);

    // MOCK LOGIC (Bypassing Prisma for Dev/Demo correctness without DB)
    const MOCK_PRICE_USDC = "5000000"; // 5 USDC (6 decimals)

    // 1. Check Logic: In a real app, check DB for existing active sub.
    // Mock: Assume no active sub for demo purposes, or maybe check a cookie?
    // Let's assume always "New Subscription" needed unless Payment Proof is present.

    const paymentProof = req.headers.get('X-PAYMENT');

    if (paymentProof) {
        console.log(`[x402] Processing Payment Proof: ${paymentProof}`);

        // REAL VERIFICATION
        const isValid = await verifyTransaction(
            paymentProof,
            creatorAddress,
            BigInt(MOCK_PRICE_USDC)
        );

        if (isValid) {
            return NextResponse.json({
                status: 'activated',
                subscription: {
                    id: 'sub_' + Math.random().toString(36).substr(2, 9),
                    creatorAddress,
                    tierId,
                    status: 'ACTIVE',
                    startsAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
            });
        } else {
            return NextResponse.json({ error: 'Invalid Payment Proof' }, { status: 400 });
        }
    }

    // 2. Return 402 with Payment Params (Mock Plan)
    return NextResponse.json({
        chainId: CHAIN_ID,
        tokenAddress: USDC_SEPOLIA_ADDRESS,
        amount: MOCK_PRICE_USDC,
        recipient: creatorAddress,
        paymentParameter: {
            minerOf: creatorAddress
        }
    }, { status: 402 });
}
