import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, encodeFunctionData, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { verifyPrivyToken, unauthorizedResponse, verifyWalletOwnership } from '@/lib/auth';
import { isValidTransactionHash, isValidWalletAddress } from '@/lib/validation';
import { CHAIN_ID, CREATOR_HUB_ABI, CREATOR_HUB_ADDRESS, USDC_SEPOLIA_ADDRESS } from '@/config/constants';

const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;
const processedPayments = new Map<string, { timestamp: number; result: unknown }>();

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

type ContentPaymentAction = 'rent' | 'buy';

interface ContentRequestBody {
    contentId: string;
    action: ContentPaymentAction;
    walletAddress: string;
    idempotencyKey?: string;
}

function isValidContentAction(action: unknown): action is ContentPaymentAction {
    return action === 'rent' || action === 'buy';
}

async function verifyContentPayment(
    txHash: string,
    walletAddress: string,
    contentId: bigint,
    action: ContentPaymentAction
): Promise<{ valid: boolean; error?: string }> {
    try {
        const [tx, receipt] = await Promise.all([
            publicClient.getTransaction({ hash: txHash as `0x${string}` }),
            publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` })
        ]);

        if (receipt.status !== 'success') {
            return { valid: false, error: 'Transaction failed on-chain' };
        }

        if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
            return { valid: false, error: 'Transaction sender mismatch' };
        }

        if (tx.to?.toLowerCase() !== CREATOR_HUB_ADDRESS.toLowerCase()) {
            return { valid: false, error: 'Transaction recipient mismatch' };
        }

        const expectedData = encodeFunctionData({
            abi: CREATOR_HUB_ABI,
            functionName: action === 'rent' ? 'rentContent' : 'buyContent',
            args: [contentId]
        });

        if (tx.input.toLowerCase() !== expectedData.toLowerCase()) {
            return { valid: false, error: 'Transaction call data mismatch' };
        }

        const accessFn = action === 'rent' ? 'checkRental' : 'checkPurchase';
        const hasAccess = await publicClient.readContract({
            address: CREATOR_HUB_ADDRESS as `0x${string}`,
            abi: CREATOR_HUB_ABI,
            functionName: accessFn,
            args: [walletAddress as `0x${string}`, contentId]
        }) as boolean;

        if (!hasAccess) {
            return { valid: false, error: 'Payment confirmed but access not activated on-chain' };
        }

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: error.message || 'Transaction verification failed' };
    }
}

export async function POST(req: NextRequest) {
    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    let body: ContentRequestBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { contentId, action, walletAddress, idempotencyKey } = body;

    if (!contentId || !action || !walletAddress) {
        return NextResponse.json({ error: 'contentId, action and walletAddress are required' }, { status: 400 });
    }

    if (!/^\d+$/.test(contentId)) {
        return NextResponse.json({ error: 'contentId must be a numeric string' }, { status: 400 });
    }

    if (!isValidContentAction(action)) {
        return NextResponse.json({ error: 'action must be rent or buy' }, { status: 400 });
    }

    if (!isValidWalletAddress(walletAddress)) {
        return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    const isWalletOwned = await verifyWalletOwnership(userClaims.userId, walletAddress);
    if (!isWalletOwned) {
        return NextResponse.json({ error: 'walletAddress does not belong to authenticated user' }, { status: 403 });
    }

    const contentIdBigInt = BigInt(contentId);
    let amount: bigint;
    try {
        const rawContent = await publicClient.readContract({
            address: CREATOR_HUB_ADDRESS as `0x${string}`,
            abi: CREATOR_HUB_ABI,
            functionName: 'contents',
            args: [contentIdBigInt]
        }) as readonly [bigint, `0x${string}`, number, string, boolean, bigint, bigint, `0x${string}`, boolean];

        const [, , , , isFree, fullPrice, rentedPrice, paymentToken, active] = rawContent;

        if (!active) {
            return NextResponse.json({ error: 'Content is not active' }, { status: 400 });
        }

        if (isFree) {
            return NextResponse.json({ error: 'Content is free and does not require payment' }, { status: 400 });
        }

        if (paymentToken.toLowerCase() !== USDC_SEPOLIA_ADDRESS.toLowerCase()) {
            return NextResponse.json({ error: 'Content is not configured for USDC x402 payments' }, { status: 400 });
        }

        amount = action === 'rent' ? rentedPrice : fullPrice;
        if (amount <= 0n) {
            return NextResponse.json({ error: 'Requested payment type is not available for this content' }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Failed to fetch content pricing' }, { status: 500 });
    }

    const paymentProof = req.headers.get('X-PAYMENT');
    if (paymentProof) {
        if (!isValidTransactionHash(paymentProof)) {
            return NextResponse.json({ error: 'Invalid transaction hash format' }, { status: 400 });
        }

        if (idempotencyKey) {
            const cached = processedPayments.get(idempotencyKey);
            if (cached && (Date.now() - cached.timestamp) < IDEMPOTENCY_TTL) {
                return NextResponse.json(cached.result);
            }
        }

        const verification = await verifyContentPayment(paymentProof, walletAddress, contentIdBigInt, action);
        if (!verification.valid) {
            return NextResponse.json(
                { error: 'Payment verification failed', details: verification.error || 'Invalid payment proof' },
                { status: 400 }
            );
        }

        const result = {
            status: 'activated',
            action,
            contentId,
            transactionHash: paymentProof
        };

        if (idempotencyKey) {
            processedPayments.set(idempotencyKey, { timestamp: Date.now(), result });
        }

        return NextResponse.json(result);
    }

    const paymentMetadata = {
        chainId: CHAIN_ID,
        tokenAddress: USDC_SEPOLIA_ADDRESS,
        amount: amount.toString(),
        recipient: CREATOR_HUB_ADDRESS,
        paymentParameter: {
            contentId,
            purchaseType: action === 'buy' ? 'buy' : 'rent',
            action
        }
    };

    return NextResponse.json(paymentMetadata, {
        status: 402,
        headers: {
            'X-Accept-Payment': 'erc20-transfer',
            'X-Payment-Chain-Id': CHAIN_ID.toString(),
            'X-Payment-Token': USDC_SEPOLIA_ADDRESS,
            'X-Payment-Amount': amount.toString(),
            'X-Payment-Recipient': CREATOR_HUB_ADDRESS
        }
    });
}
