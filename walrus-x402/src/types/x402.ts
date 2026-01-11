/**
 * x402 Payment Protocol Types
 */

export interface PaymentMetadata {
    chainId: number;
    tokenAddress: string;
    amount: string;
    recipient: string;
    paymentParameter?: {
        minerOf?: string;
    };
}

export type PaymentState =
    | 'idle'
    | 'required'
    | 'paying'
    | 'confirming'
    | 'verifying'
    | 'success'
    | 'error';

export interface PaymentError {
    code: string;
    message: string;
}

export interface PaymentProof {
    transactionHash: string;
    chainId: number;
    timestamp: number;
}

export interface SubscriptionRequest {
    creatorAddress: string;
    tierId: number;
    idempotencyKey?: string;
}

export interface SubscriptionResponse {
    status: 'activated' | 'pending' | 'failed';
    subscription?: Subscription;
    error?: string;
    details?: string;
}

export interface Subscription {
    id: string;
    creatorAddress: string;
    tierId: number;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    startsAt: Date;
    expiresAt: Date;
    transactionHash?: string;
}
