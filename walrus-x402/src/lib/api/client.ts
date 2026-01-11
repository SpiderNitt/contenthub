/**
 * API Client Base
 * Centralized HTTP client with error handling
 */

import type { ApiResponse, ApiError } from '@/types';

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            return {
                data: response.ok ? data : undefined,
                error: !response.ok ? data.error : undefined,
                details: !response.ok ? data.details : undefined,
                status: response.status,
            };
        } catch (error) {
            return {
                error: 'Network error',
                details: error instanceof Error ? error.message : 'Unknown error',
                status: 0,
            };
        }
    }

    async get<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET', headers });
    }

    async post<T>(
        endpoint: string,
        body?: any,
        headers?: HeadersInit
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    async put<T>(
        endpoint: string,
        body?: any,
        headers?: HeadersInit
    ): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
            headers,
        });
    }

    async delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE', headers });
    }
}

// Default API client instance
export const apiClient = new ApiClient('/api');
