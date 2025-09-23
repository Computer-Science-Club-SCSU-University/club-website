/**
 * Adapter functions to transform domain types to UI component props
 */

import type { Event, Announcement, Officer, RSVP } from '@club-website/domain-types';

/**
 * Transform domain Event to UI component props
 */
export function toEventUIProps(event: Event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startAt: event.startAt, // Use proper Date objects
    endAt: event.endAt,     // Use proper Date objects
    meetingLink: event.meetingLink,
    slidesUrl: event.slidesUrl,
    recordingUrl: event.recordingUrl,
    status: event.status,
    rsvpCount: event.rsvpCount,
    canRsvp: event.canRsvp,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

/**
 * Transform domain Announcement to UI component props
 */
export function toAnnouncementUIProps(announcement: Announcement) {
  return {
    id: announcement.id,
    content: announcement.content,
    displayText: announcement.displayText,
    isPinned: announcement.isPinned,
    isDraft: announcement.isDraft,
    discordMessageId: announcement.discordMessageId,
    summary: announcement.content.length <= 150 
      ? announcement.content 
      : announcement.content.substring(0, 147) + '...',
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  };
}

/**
 * Transform domain Officer to UI component props
 */
export function toOfficerUIProps(officer: Officer) {
  return {
    id: officer.id,
    name: officer.name,
    position: officer.position,
    bio: officer.bio,
    image_url: officer.imageUrl,
    order_index: officer.orderIndex,
  };
}

/**
 * Transform domain RSVP to UI component props
 */
export function toRSVPUIProps(rsvp: RSVP) {
  return {
    id: rsvp.id,
    eventId: rsvp.eventId,
    name: rsvp.name,
    email: rsvp.email,
    comment: rsvp.comment,
    timestamp: rsvp.registeredAt.toISOString(),
  };
}

/**
 * Combine date and time into a single Date object
 */
function combineDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours || 0, minutes || 0, 0, 0);
  return combined;
}

/**
 * Transform form data to API request for creating events
 */
export function toCreateEventRequest(data: {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  meetingLink?: string;
  slidesUrl?: string;
}) {
  const startDateTime = combineDateTime(data.startDate, data.startTime);
  const endDateTime = combineDateTime(data.endDate, data.endTime);
  
  return {
    title: data.title,
    description: data.description || undefined,
    location: data.location || undefined,
    start_at: startDateTime.toISOString(),
    end_at: endDateTime.toISOString(),
    meeting_link: data.meetingLink || undefined,
    slides_url: data.slidesUrl || undefined,
    recording_url: undefined // Only for past events during editing
  };
}

/**
 * Transform form data to API request for updating events
 */
export function toUpdateEventRequest(data: Partial<{
  title: string;
  description: string;
  location: string;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  meetingLink: string;
  slidesUrl: string;
  recordingUrl: string;
}>) {
  const request: any = {};
  
  if (data.title !== undefined) request.title = data.title;
  if (data.description !== undefined) request.description = data.description;
  if (data.location !== undefined) request.location = data.location;
  
  // Handle date/time combinations
  if (data.startDate !== undefined && data.startTime !== undefined) {
    const startDateTime = combineDateTime(data.startDate, data.startTime);
    request.start_at = startDateTime.toISOString();
  }
  
  if (data.endDate !== undefined && data.endTime !== undefined) {
    const endDateTime = combineDateTime(data.endDate, data.endTime);
    request.end_at = endDateTime.toISOString();
  }
  
  if (data.meetingLink !== undefined) request.meeting_link = data.meetingLink;
  if (data.slidesUrl !== undefined) request.slides_url = data.slidesUrl;
  if (data.recordingUrl !== undefined) request.recording_url = data.recordingUrl;
  
  return request;
}

/**
 * Extract date and time components from ISO string for form initialization
 */
export function extractDateTime(isoString: string): { date: Date; time: string } {
  const dateTime = new Date(isoString);
  const date = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
  const time = dateTime.toTimeString().slice(0, 5); // HH:MM format
  return { date, time };
}

/**
 * Transform event domain object to form data for editing
 */
export function toEventFormData(event: Event) {
  const startDateTime = extractDateTime(event.startAt.toISOString());
  const endDateTime = extractDateTime(event.endAt.toISOString());
  
  return {
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    startDate: startDateTime.date,
    startTime: startDateTime.time,
    endDate: endDateTime.date,
    endTime: endDateTime.time,
    meetingLink: event.meetingLink || '',
    slidesUrl: event.slidesUrl || '',
    recordingUrl: event.recordingUrl || '',
  };
}

/**
 * Transform form data to API request
 */
export function toCreateAnnouncementRequest(data: {
  content: string;
  displayText?: string;
  isPinned?: boolean;
  isDraft?: boolean;
}) {
  return {
    content: data.content,
    display_text: data.displayText,
    pinned: data.isPinned,
    is_draft: data.isDraft,
  };
}

/**
 * Transform form data to API request
 */
export function toUpdateAnnouncementRequest(data: Partial<{
  content: string;
  displayText?: string;
  isPinned?: boolean;
  isDraft?: boolean;
}>) {
  const request: any = {};
  if (data.content !== undefined) request.content = data.content;
  if (data.displayText !== undefined) request.display_text = data.displayText;
  if (data.isPinned !== undefined) request.pinned = data.isPinned;
  if (data.isDraft !== undefined) request.is_draft = data.isDraft;
  return request;
}

/**
 * Transform form data to API request
 */
export function toCreateOfficerRequest(data: {
  name: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  orderIndex?: number;
}) {
  return {
    name: data.name,
    position: data.position,
    bio: data.bio,
    image_url: data.imageUrl,
    order_index: data.orderIndex,
  };
}

/**
 * Transform form data to API request
 */
export function toUpdateOfficerRequest(data: Partial<{
  name: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  orderIndex?: number;
}>) {
  const request: any = {};
  if (data.name !== undefined) request.name = data.name;
  if (data.position !== undefined) request.position = data.position;
  if (data.bio !== undefined) request.bio = data.bio;
  if (data.imageUrl !== undefined) request.image_url = data.imageUrl;
  if (data.orderIndex !== undefined) request.order_index = data.orderIndex;
  return request;
}
