import { useState, useEffect } from 'react';
import { usePublicApiClient, type Event, ApiError } from '@/lib/api';

interface UseEventsReturn {
  events: Event[];
  upcomingEvents: Event[];
  ongoingEvents: Event[];
  pastEvents: Event[];
  loading: boolean;
  error: string | null;
}

export function useEvents(): UseEventsReturn {
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
        
        // Sort by scheduled time
        const sortedEvents = events.sort((a: Event, b: Event) => 
          a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );
        
        setEvents(sortedEvents);
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

  // Filter events by status using the new computed properties
  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const ongoingEvents = events.filter(event => event.status === 'ongoing');
  const pastEvents = events.filter(event => event.status === 'past').reverse(); // Most recent first

  return {
    events,
    upcomingEvents,
    ongoingEvents,
    pastEvents,
    loading,
    error,
  };
} 