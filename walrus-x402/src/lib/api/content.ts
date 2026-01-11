/**
 * Content API Methods
 */

import { apiClient } from './client';
import type { AuthorizeRequest, AuthorizeResponse } from '@/types';

export async function authorizeContent(
    contentId: string,
    request: AuthorizeRequest,
    token: string
): Promise<AuthorizeResponse> {
    const response = await apiClient.post<AuthorizeResponse>(
        `/content/${contentId}/authorize`,
        request,
        {
            'Authorization': `Bearer ${token}`,
        }
    );

    if (response.error) {
        return {
            authorized: false,
            error: response.error,
        };
    }

    return response.data || { authorized: false };
}
