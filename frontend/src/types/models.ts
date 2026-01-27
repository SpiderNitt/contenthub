/**
 * Data Model Types
 */

export interface User {
    id: string;
    privyUserId: string;
    walletAddress: string;
    createdAt: Date;
}

export interface Creator {
    address: string;
    profileUri?: string;
    name?: string;
    bio?: string;
    avatar?: string;
    cover?: string;
    stats?: CreatorStats;
}

export interface CreatorStats {
    subscribers: string;
    videos: number;
    articles: number;
}

export interface Plan {
    id: string;
    creatorAddress: string;
    tierId: number;
    name: string;
    price: string;
    period: string;
    priceUsdc: string;
    periodSeconds: number;
    features: string[];
}

export interface Content {
    id: string;
    title: string;
    type: 'video' | 'article' | 'audio';
    tier: number;
    thumbnail: string;
    date: string;
    creatorAddress: string;
    blobId?: string;
}

export interface PaymentAttempt {
    id: string;
    idempotencyKey: string;
    userWallet: string;
    amount: string;
    state: 'INITIATED' | 'SUBMITTED' | 'VERIFIED' | 'SETTLED' | 'FAILED';
    createdAt: Date;
}
