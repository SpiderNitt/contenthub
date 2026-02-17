import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { isValidBlobId, isValidWalletAddress, createSignature } from '@/lib/validation';
import { checkContentAccess } from '@/lib/subscription';

const SIGNING_SECRET = process.env.CONTENT_SIGNING_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    // Validate contentId format
    const { id: contentId } = params;
    console.log(`[API] Authorize request for ID: ${contentId}`);

    if (!isValidBlobId(contentId)) {
        console.error(`[API] Invalid Blob ID: ${contentId}`);
        // Allow numeric IDs for premium content
        if (!/^\d+$/.test(contentId)) {
            return NextResponse.json({
                error: 'Invalid content ID format'
            }, { status: 400 });
        }
    }

    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    // CRITICAL: Fail if signing secret is missing in production
    if (!SIGNING_SECRET) {
        if (IS_PRODUCTION) {
            console.error('[AUTHORIZE] Signing secret missing in production!');
            return NextResponse.json({
                error: 'Service configuration error'
            }, { status: 500 });
        }
        console.warn('[AUTHORIZE] No signing secret configured - requests will be rejected in production');
        return NextResponse.json({
            error: 'Signing secret not configured'
        }, { status: 500 });
    }

    const signingSecret = SIGNING_SECRET;

    // Parse and validate request body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const creatorAddress = body.creatorAddress;

    // Validate creator address if provided
    if (creatorAddress && !isValidWalletAddress(creatorAddress)) {
        return NextResponse.json({
            error: 'Invalid creator address format'
        }, { status: 400 });
    }

    // Get user's wallet address from Privy claims
    // Note: userClaims.userId might be the wallet address or a Privy user ID
    // In production, you'd need to map this to the actual wallet address
    const userWalletAddress = userClaims.userId; // Assuming this is the wallet address

    if (!isValidWalletAddress(userWalletAddress)) {
        return NextResponse.json({
            error: 'Invalid user wallet address'
        }, { status: 400 });
    }

    // Check on-chain access
    const accessCheck = await checkContentAccess(
        userWalletAddress as `0x${string}`,
        contentId,
        creatorAddress as `0x${string}`
    );

    if (!accessCheck.hasAccess) {
        return NextResponse.json({
            authorized: false,
            error: 'Access denied',
            reason: accessCheck.reason
        }, { status: 403 });
    }

    // Generate Signed Fetch Instruction with timestamp validation
    const now = Date.now();
    const expiry = now + 3600 * 1000; // 1 hour
    const payload = {
        blobId: contentId,
        userWallet: userWalletAddress,
        issuedAt: now,
        expiry,
        nonce: Math.floor(Math.random() * 1000000)
    };

    // Create signature
    const signature = createSignature(payload, signingSecret);

    const fetchInstruction = {
        ...payload,
        signature
    };

    return NextResponse.json({
        authorized: true,
        fetchInstruction,
        accessReason: accessCheck.reason
    });
}
