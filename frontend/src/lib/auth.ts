import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest, NextResponse } from 'next/server';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

// Only initialize Privy if credentials are available
const privy = (PRIVY_APP_ID && PRIVY_APP_SECRET)
  ? new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
  : null;

export async function verifyPrivyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  // CRITICAL: Fail if credentials are missing
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !privy) {
    console.error('[AUTH] Privy credentials not configured');
    return null;
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(token);
    return verifiedClaims;
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
