import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

const SIGNING_SECRET = process.env.WALRUS_SIGNING_SECRET || 'dev-secret';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    const { id: contentId } = params;

    // 1. Fetch content metadata. 
    // In a real app, we sync ContentRegistry events to DB.
    // We assume we have a Content model or similar, or we query the contract.
    // For this prototype, let's assume valid requests check DB or we allow all for demo if subscribed to Creator.
    // We need to know who the CREATOR is for this Content ID.

    // MOCK: In production, lookup Content in DB -> get Creator & Tier.
    // Here, we'll expect the client to send Creator Address in body? Or assume a mapping?
    // Let's assume the body contains the creator address for efficiency in this demo phase, or we skip tier check if simple.
    // BETTER: Mock DB lookup.
    const mockContentDB = {
        [contentId]: { creatorAddress: "0xCreatorAddress", minTier: 1 }
    };

    // Ideally, use a real DB model:
    // const content = await prisma.content.findUnique({ where: { id: contentId } });

    // Dynamic body fallback needed for demo?
    const body = await req.json().catch(() => ({}));
    const creatorAddress = body.creatorAddress || "0xCreatorAddress"; // Fallback
    const minTier = body.minTier || 1;

    // 2. Check Subscription (MOCK)
    // In a real app, query DB: prisma.subscription.findFirst(...)
    // For this Mock/Demo environment without a DB, we allow access if the user is authenticated.
    // The client-side "userTier" state already handles the UI gating.
    // This server-side check would normally verify that state against the DB.

    // Attempting to simulate "Found User & Subscription"
    const mockUser = { id: 'mock-user-id', walletAddress: '0xMockWallet' };

    // We assume authorized for demo purposes if token is valid.
    const isAuthorized = true;

    if (!isAuthorized) {
        return NextResponse.json({
            authorized: false,
            error: 'Subscription required',
            requiredTier: minTier
        }, { status: 403 });
    }

    // Continue to generate instruction...
    const user = mockUser; // Use mock user for payload construction

    // 3. Generate Signed Fetch Instruction
    // This JSON is what the frontend sends to the Walrus Aggregator (or player logic) to prove right to access.
    const expiry = Date.now() + 3600 * 1000; // 1 hour
    const payload = {
        blobId: contentId, // Assuming contentId IS the blobId or maps to it
        userWallet: user.walletAddress,
        expiry,
        nonce: Math.floor(Math.random() * 1000000)
    };

    // Sign it
    const signature = createHmac('sha256', SIGNING_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    const fetchInstruction = {
        ...payload,
        signature
    };

    return NextResponse.json({
        authorized: true,
        fetchInstruction
    });
}
