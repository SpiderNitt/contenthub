import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { CREATOR_HUB_ABI, CREATOR_HUB_ADDRESS } from '@/config/constants';

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

export async function GET(req: NextRequest) {
    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    if (!LIGHTHOUSE_API_KEY) {
        console.error('[UPLOAD_KEY] LIGHTHOUSE_API_KEY not configured');
        return NextResponse.json(
            { error: 'Upload service not configured' },
            { status: 500 }
        );
    }

    const walletAddress = req.nextUrl.searchParams.get('walletAddress');
    if (!walletAddress || !isAddress(walletAddress)) {
        return NextResponse.json(
            { error: 'walletAddress query param is required' },
            { status: 400 }
        );
    }

    try {
        const creatorData = await publicClient.readContract({
            address: CREATOR_HUB_ADDRESS as `0x${string}`,
            abi: CREATOR_HUB_ABI,
            functionName: 'creators',
            args: [walletAddress as `0x${string}`]
        }) as readonly [string, `0x${string}`, boolean, bigint];

        if (!creatorData[2]) {
            return NextResponse.json(
                { error: 'Creator access required' },
                { status: 403 }
            );
        }

        return NextResponse.json({ apiKey: LIGHTHOUSE_API_KEY });
    } catch (error) {
        console.error('[UPLOAD_KEY] Failed to verify creator status:', error);
        return NextResponse.json(
            { error: 'Failed to verify creator access' },
            { status: 500 }
        );
    }
}
