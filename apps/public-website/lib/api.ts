import { createPublicClient, ApiError } from '@club-website/api-client';
import { useMemo } from 'react';

// Re-export types from domain-types
export type {
  Event,
  Announcement,
  Officer,
  RSVP
} from '@club-website/domain-types';

export { ApiError };

/**
 * Hook to get a public API client (no authentication required)
 * Automatically uses NEXT_PUBLIC_API_URL from environment
 */
export function usePublicApiClient() {
  return useMemo(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return createPublicClient(apiBaseUrl);
  }, []);
}

/**
 * Direct function to create a public client (for non-hook usage)
 */
export function createPublicClientWithEnv() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return createPublicClient(apiBaseUrl);
}
