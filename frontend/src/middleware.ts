import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers to add to all responses
const securityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Content Security Policy
const CSP = `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://auth.privy.io https://verify.walletconnect.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss: https://auth.privy.io https://rpc.walletconnect.com https://sepolia.base.org; frame-src 'self' https://verify.walletconnect.com https://auth.privy.io; media-src 'self' https: blob:;`;

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    // Add CSP header
    response.headers.set('Content-Security-Policy', CSP);

    // CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Only allow same-origin requests in production
        const origin = request.headers.get('origin');
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

        if (process.env.NODE_ENV === 'development' ||
            (origin && allowedOrigins.includes(origin))) {
            response.headers.set('Access-Control-Allow-Origin', origin || '*');
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Payment');
            response.headers.set('Access-Control-Max-Age', '86400');
        }

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 204, headers: response.headers });
        }
    }

    return response;
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
