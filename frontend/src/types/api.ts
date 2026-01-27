/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    details?: string;
    status: number;
}

export interface ApiError {
    error: string;
    details?: string;
    code?: string;
}

/**
 * Content Authorization Types
 */

export interface AuthorizeRequest {
    creatorAddress?: string;
    minTier?: number;
}

export interface AuthorizeResponse {
    authorized: boolean;
    fetchInstruction?: FetchInstruction;
    error?: string;
    requiredTier?: number;
}

export interface FetchInstruction {
    blobId: string;
    userWallet: string;
    issuedAt: number;
    expiry: number;
    nonce: number;
    signature: string;
}

/**
 * Pagination Types
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
    cursor?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
        cursor?: string;
    };
}
