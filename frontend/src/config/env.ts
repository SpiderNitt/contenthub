/**
 * Environment Variables Configuration
 * Centralized access to environment variables with type safety
 */

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && !defaultValue) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        console.warn(`Missing environment variable: ${key}`);
    }
    return value || defaultValue || '';
}

function getEnvVarOptional(key: string): string | undefined {
    return process.env[key];
}

// Environment
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Privy
export const PRIVY_APP_ID = getEnvVar('NEXT_PUBLIC_PRIVY_APP_ID', '');
export const PRIVY_APP_SECRET = getEnvVar('PRIVY_APP_SECRET', '');

// Content Signing
export const CONTENT_SIGNING_SECRET = getEnvVar('CONTENT_SIGNING_SECRET', '');

// Database
export const DATABASE_URL = getEnvVar('DATABASE_URL', '');

// API
export const API_BASE_URL = getEnvVar('NEXT_PUBLIC_API_BASE_URL', '');
export const ALLOWED_ORIGINS = getEnvVarOptional('ALLOWED_ORIGINS')?.split(',') || [];

// Blockchain
export const RPC_URL = getEnvVarOptional('NEXT_PUBLIC_RPC_URL');

// Feature Flags
export const ENABLE_ANALYTICS = getEnvVarOptional('NEXT_PUBLIC_ENABLE_ANALYTICS') === 'true';
export const ENABLE_DEBUG_LOGS = !IS_PRODUCTION || getEnvVarOptional('ENABLE_DEBUG_LOGS') === 'true';

// Export all as a single object for convenience
export const env = {
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    PRIVY_APP_ID,
    PRIVY_APP_SECRET,
    CONTENT_SIGNING_SECRET,
    DATABASE_URL,
    API_BASE_URL,
    ALLOWED_ORIGINS,
    RPC_URL,
    ENABLE_ANALYTICS,
    ENABLE_DEBUG_LOGS,
} as const;
