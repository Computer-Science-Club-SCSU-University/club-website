"use client";

import { Button } from "@club-website/ui/components/button";
import { Card } from "@club-website/ui/components/card";
import { formatDate, formatTime } from '@club-website/ui/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    maxAttendees?: number;
    currentAttendees: number;
  };
  LinkComponent?: React.ComponentType<LinkProps>;
}

export function EventCard({ event, LinkComponent }: EventCardProps) {
  const isAtCapacity = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;
  
  // Default to a regular anchor tag if no LinkComponent provided
  const Link = LinkComponent || (({ href, children }: LinkProps) => (
    <a href={href}>{children}</a>
  ));

  return (
		<Card className='p-6 hover:shadow-lg transition-shadow'>
			<div className='space-y-4'>
				<div className='space-y-2'>
					<h3 className='text-xl font-semibold text-card-foreground'>
						{event.title}
					</h3>
					<p className='text-muted-foreground text-sm line-clamp-2'>
						{event.description}
					</p>
				</div>

				<div className='space-y-2 text-sm text-muted-foreground'>
					<div className='flex items-center gap-2'>
						<Calendar className='h-4 w-4' />
						<span>
							{formatDate(event.startTime)} • {formatTime(event.startTime)} -{' '}
							{formatTime(event.endTime)}
						</span>
					</div>

					<div className='flex items-center gap-2'>
						<MapPin className='h-4 w-4' />
						<span>{event.location}</span>
					</div>

					<div className='flex items-center gap-2'>
						<Users className='h-4 w-4' />
						<span>
							{event.currentAttendees} attending
							{event.maxAttendees &&
								` • ${event.maxAttendees - event.currentAttendees} spots left`}
						</span>
					</div>
				</div>

				<div className='flex items-center justify-between pt-4 border-t'>
					<Link href={`/events/${event.id}`}>
						<Button
							variant='outline'
							size='sm'>
							Learn More
						</Button>
					</Link>

					<Button
						size='sm'
						disabled={isAtCapacity}
						className={isAtCapacity ? 'bg-muted' : ''}>
						{isAtCapacity ? 'Full' : 'RSVP'}
					</Button>
				</div>
			</div>
		</Card>
	);
} 