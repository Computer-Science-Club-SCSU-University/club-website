import { ApiError, type ApiErrorResponse } from '@club-website/api-contracts';

export interface TransportOptions {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    getToken?: () => Promise<string | null>;
}

export interface RequestOptions {
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
}

export class HttpTransport {
    private baseUrl: string;
    private defaultTimeout: number;
    private defaultRetries: number;
    private getToken?: () => Promise<string | null>;

    constructor(options: TransportOptions = {}) {

        const defaultBaseUrl = typeof window !== 'undefined' 
            ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
            : 'http://localhost:8000/api';

        this.baseUrl = (options.baseUrl || defaultBaseUrl).replace(/\/$/, '');
        this.defaultTimeout = options.timeout || 10000;
        this.defaultRetries = options.retries || 3;
        this.getToken = options.getToken;
    }

    async get<T>(path: string, options?: RequestOptions): Promise<T> {
        return this.request<T>('GET', path, undefined, options);
    }

    async post<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
        return this.request<T>('POST', path, body, options);
    }

    async patch<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
        return this.request<T>('PATCH', path, body, options);
    }

    async put<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
        return this.request<T>('PUT', path, body, options);
    }

    async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
        return this.request<T>('DELETE', path, undefined, options);
    }

    private async request<T>(
        method: string,
        path: string,
        body?: any,
        options: RequestOptions = {}
    ): Promise<T> {
        const url = this.buildUrl(path, options.params);
        const token = this.getToken ? await this.getToken() : null;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers
        };

        const timeout = options.timeout || this.defaultTimeout;
        const retries = options.retries ?? this.defaultRetries;

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    throw ApiError.fromResponse(errorData, response.status);
                }

                return await this.parseResponse<T>(response);
            } catch (error) {
                lastError = error as Error;

                // Don't retry client errors
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Don't retry on last attempt
                if (attempt === retries) break;

                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }

        throw lastError || new ApiError('Network error', 0, 'NETWORK_ERROR');
    }

    private buildUrl(path: string, params?: Record<string, any>): string {
        const url = `${this.baseUrl}${path}`;
        if (!params) return url;

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, String(v)));
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });

        const queryString = searchParams.toString();
        return queryString ? `${url}?${queryString}` : url;
    }

    private async parseResponse<T>(response: Response): Promise<T> {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const text = await response.text();
            return text ? JSON.parse(text) : ({} as T);
        }
        return {} as T;
    }

    private async parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
        try {
            return await response.json();
        } catch {
            return { message: `HTTP ${response.status}` };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
