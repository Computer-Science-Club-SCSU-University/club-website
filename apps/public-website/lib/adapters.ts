/**
 * Adapter functions to transform domain types to UI component props
 */

import type { Event, Announcement, Officer } from '@club-website/api-client';

function stripHtml(input?: string | null): string {
	if (!input) return '';
	return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Transform domain Event to EventCard props
 */
export function toEventCardProps(event: Event) {
	return {
		id: event.id,
		title: event.title,
		description: stripHtml(event.description),
		startTime: event.scheduledAt.toISOString(),
		endTime: event.scheduledAt.toISOString(), // Using same time since we don't have endTime
		location: event.location,
		maxAttendees: event.maxAttendees,
		currentAttendees: event.rsvpCount,
	};
}

/**
 * Transform domain Announcement to AnnouncementCardPublic props
 */
export function toAnnouncementCardProps(announcement: Announcement) {
	return {
		id: announcement.id,
		content: announcement.content,
		display_text: announcement.displayText,
		pinned: announcement.isPinned,
		is_draft: announcement.isDraft,
		discord_message_id: announcement.discordMessageId,
		created_at: announcement.createdAt.toISOString(),
		updated_at: announcement.updatedAt.toISOString(),
	};
}

/**
 * Transform domain Officer to OfficerCard props
 */
export function toOfficerCardProps(officer: Officer) {
	return {
		id: officer.id,
		name: officer.name,
		position: officer.position,
		bio: officer.bio,
		email: officer.email,
		image_url: officer.imageUrl,
		linkedin_url: officer.linkedinUrl,
		order_index: officer.orderIndex,
	};
}
