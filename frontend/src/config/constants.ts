/**
 * Application Constants
 */

// Blockchain
export const CHAIN_ID = 84532; // Base Sepolia
export const USDC_SEPOLIA_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Payment
export const MOCK_PRICE_USDC = "5000000"; // 5 USDC (6 decimals)
export const USDC_DECIMALS = 6;

// Rate Limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 10;

// Idempotency
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Transaction
export const TX_CONFIRMATION_TIMEOUT_MS = 60 * 1000; // 60 seconds
export const TX_REQUIRED_CONFIRMATIONS = 1;

// Signature
export const SIGNATURE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Validation
export const MAX_TIER_ID = 10;
export const MIN_TIER_ID = 0;
export const MAX_BLOB_ID_LENGTH = 64;
export const TX_HASH_LENGTH = 66; // 0x + 64 hex chars
export const WALLET_ADDRESS_LENGTH = 42; // 0x + 40 hex chars

// UI
export const ITEMS_PER_PAGE = 12;
export const DEBOUNCE_DELAY_MS = 300;

// Content Types
export const CONTENT_TYPES = ['video', 'article', 'audio'] as const;
export type ContentType = typeof CONTENT_TYPES[number];

// Subscription Status
export const SUBSCRIPTION_STATUS = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[number];

// Payment States
export const PAYMENT_STATES = [
    'idle',
    'required',
    'paying',
    'confirming',
    'verifying',
    'success',
    'error'
] as const;
export type PaymentStateType = typeof PAYMENT_STATES[number];

// Contracts
import CreatorHubABI from './CreatorHub.json';
export const CREATOR_HUB_ADDRESS = '0xc567c6112720d8190caa4e93086cd36e2ae01d37';
export const CREATOR_HUB_ABI = CreatorHubABI.abi;

// IPFS
export const NEXT_PUBLIC_IPFS_GATEWAY = "https://gateway.lighthouse.storage/ipfs/";

// Require API key from environment - never hardcode
const lighthouseApiKey = process.env.LIGHTHOUSE_API_KEY;
if (!lighthouseApiKey) {
    console.warn('[WARN] LIGHTHOUSE_API_KEY not set - upload functionality will fail');
}
export const LIGHTHOUSE_API_KEY = lighthouseApiKey;
