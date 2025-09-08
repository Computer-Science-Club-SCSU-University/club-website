import { useState, useEffect } from 'react';
import {
	createPublicClient,
	type Event,
	ApiError,
} from '@club-website/api-client';

interface UseEventsReturn {
	events: Event[];
	upcomingEvents: Event[];
	pastEvents: Event[];
	loading: boolean;
	error: string | null;
}

export function useEvents(): UseEventsReturn {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoading(true);
				setError(null);

				const client = createPublicClient();
				const events = await client.events.getFromGoogle();

				// Sort by scheduled time
				const sortedEvents = events.sort(
					(a: Event, b: Event) =>
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
	}, []);

	// Filter events into upcoming and past
	const now = new Date();
	const upcomingEvents = events.filter((event: any) => event.scheduledAt > now);
	const pastEvents = events
		.filter((event: any) => event.scheduledAt <= now)
		.reverse(); // Most recent first

	return {
		events,
		upcomingEvents,
		pastEvents,
		loading,
		error,
	};
}
