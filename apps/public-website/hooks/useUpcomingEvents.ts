import { useState, useEffect } from 'react';
import { usePublicApiClient, type Event, ApiError } from '@/lib/api';

interface UseUpcomingEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
}

export function useUpcomingEvents(): UseUpcomingEventsReturn {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = usePublicApiClient();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const events = await client.events.getAll();
        
        // Filter upcoming events
        const now = new Date();
        const upcomingEvents = events
          .filter((event: Event) => event.scheduledAt > now)
          .sort((a: Event, b: Event) => 
            a.scheduledAt.getTime() - b.scheduledAt.getTime()
          );
        
        setEvents(upcomingEvents);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Failed to load events: ${err.message}`);
        } else {
          setError('Failed to load events. Please try again later.');
        }
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [client]);

  return { events, loading, error };
} 