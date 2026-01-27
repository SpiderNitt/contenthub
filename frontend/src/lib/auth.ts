import { PrivyClient } from '@privy-io/server-auth';
import { NextRequest, NextResponse } from 'next/server';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

  // CRITICAL: In production, fail if credentials are missing
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET || !privy) {
    if (IS_PRODUCTION) {
      console.error('[AUTH] Privy credentials missing in production!');
      return null;
    }

    // Development mode only - return mock user
    console.warn('[AUTH] Privy credentials missing. Using mock user (DEV MODE ONLY)');
    return {
      userId: 'did:privy:dev-mock-user',
      appId: 'dev-mock-app',
      issuer: 'privy.io',
      issuedAt: Date.now() / 1000,
      expiration: Date.now() / 1000 + 3600
    };
  }

  try {
    const verifiedClaims = await privy.verifyAuthToken(token);
    return verifiedClaims;
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);

    // CRITICAL: In production, fail authentication
    if (IS_PRODUCTION) {
      return null;
    }

    // Development mode only - return mock user
    console.warn('[AUTH] Verification failed, using mock user (DEV MODE ONLY)');
    return {
      userId: 'did:privy:dev-mock-user',
      appId: 'dev-mock-app',
      issuer: 'privy.io',
      issuedAt: Date.now() / 1000,
      expiration: Date.now() / 1000 + 3600
    };
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
