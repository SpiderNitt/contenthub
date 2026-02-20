import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import lighthouse from '@lighthouse-web3/sdk';

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

export async function POST(req: NextRequest) {
    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    if (!LIGHTHOUSE_API_KEY) {
        console.error('[UPLOAD] LIGHTHOUSE_API_KEY not configured');
        return NextResponse.json(
            { error: 'Upload service not configured' },
            { status: 500 }
        );
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const output = await lighthouse.uploadBuffer(buffer, LIGHTHOUSE_API_KEY);

        if (!output?.data?.Hash) {
            return NextResponse.json(
                { error: 'Upload failed - no CID returned' },
                { status: 502 }
            );
        }

        return NextResponse.json({ cid: output.data.Hash });
    } catch (error) {
        console.error('[UPLOAD] Error:', error);
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        );
    }
}
