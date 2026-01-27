/**
 * x402 Payment API Methods
 */

import { apiClient } from './client';
import type {
    PaymentMetadata,
    SubscriptionRequest,
    SubscriptionResponse
} from '@/types';

export async function subscribe(
    request: SubscriptionRequest,
    token: string,
    paymentProof?: string
): Promise<SubscriptionResponse> {
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
    };

    if (paymentProof) {
        headers['X-PAYMENT'] = paymentProof;
    }

    const response = await apiClient.post<SubscriptionResponse | PaymentMetadata>(
        '/x402/subscribe',
        request,
        headers
    );

    // Handle 402 Payment Required
    if (response.status === 402) {
        return {
            status: 'pending',
            error: 'Payment required',
        };
    }

    if (response.error) {
        return {
            status: 'failed',
            error: response.error,
            details: response.details,
        };
    }

    return response.data as SubscriptionResponse;
}

export async function getPaymentMetadata(
    request: SubscriptionRequest,
    token: string
): Promise<PaymentMetadata | null> {
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
    };

    const response = await apiClient.post<PaymentMetadata>(
        '/x402/subscribe',
        request,
        headers
    );

    if (response.status === 402 && response.data) {
        return response.data;
    }

    return null;
}
