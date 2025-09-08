'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layouts/Navbar';
import { Footer } from '@/components/layouts/Footer';
import {
	createPublicClient,
	type Event,
	ApiError,
} from '@club-website/api-client';
import { formatDate, formatTime } from '@club-website/ui/lib/utils';

function stripHtml(input?: string | null): string {
	if (!input) return '';
	return input.replace(/<[^>]*>/g, '').trim();
}

export default function EventDetailPage() {
	const params = useParams<{ id: string }>();
	const [event, setEvent] = useState<Event | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			if (!params?.id) return;
			try {
				setLoading(true);
				setError(null);
				const client = createPublicClient();
				// Try Google proxy first (matches list source)
				const e = await client.events.getFromGoogleById(params.id);
				setEvent(e);
			} catch (err) {
				// Fallback to DB event by id
				try {
					const client = createPublicClient();
					const e = await client.events.getById(params.id);
					setEvent(e);
				} catch (err2) {
					const message =
						err2 instanceof ApiError ? err2.message : 'Event not found';
					setError(message);
				}
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [params?.id]);

	return (
		<div className='min-h-screen flex flex-col'>
			<Navbar />
			<main className='flex-1 pt-16'>
				<div className='container mx-auto px-4 py-12 max-w-3xl'>
					{loading && <div>Loading event...</div>}
					{error && <div className='text-red-500'>{error}</div>}
					{event && (
						<div className='space-y-4'>
							<h1 className='text-3xl font-bold'>{event.title}</h1>
							<div className='text-muted-foreground'>
								{`${formatDate(event.scheduledAt)} • ${formatTime(event.scheduledAt)}`}
							</div>
							{event.location && (
								<div className='text-muted-foreground'>{event.location}</div>
							)}
							<p className='text-muted-foreground'>
								{stripHtml(event.description)}
							</p>
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}
