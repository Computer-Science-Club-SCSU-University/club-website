"use client";

import { useState, useEffect } from 'react';
import { usePublicApiClient, type Officer, ApiError } from '@/lib/api';

interface UseOfficersReturn {
  officers: Officer[];
  loading: boolean;
  error: string | null;
}

export function useOfficers(): UseOfficersReturn {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = usePublicApiClient();

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const officers = await client.officers.getAll();
        setOfficers(officers);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Failed to load officers: ${err.message}`);
        } else {
          setError('Failed to load officers. Please try again later.');
        }
        setOfficers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, [client]);

  return { officers, loading, error };
} 