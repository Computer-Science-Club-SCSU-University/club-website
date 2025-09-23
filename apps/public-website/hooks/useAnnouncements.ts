"use client";

import { useState, useEffect } from 'react';
import { usePublicApiClient, type Announcement, ApiError } from '@/lib/api';

interface UseAnnouncementsReturn {
  announcements: Announcement[];
  pinnedAnnouncement: Announcement | null;
  loading: boolean;
  error: string | null;
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = usePublicApiClient();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await client.announcements.getAll();
        setAnnouncements(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to fetch announcements');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [client]);

  const pinnedAnnouncement = announcements.find(a => a.isPinned) || null;

  return { announcements, pinnedAnnouncement, loading, error };
}