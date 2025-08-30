// Backend API types
export interface BackendEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  created_by: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
  is_upcoming: boolean;
  rsvp_count: number;
}

export interface BackendAnnouncement {
  id: number;
  content: string;
  display_text?: string | null;
  pinned: boolean;
  is_draft: boolean;
  discord_message_id?: string | null;
  created_by: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface BackendOfficer {
  id: number;
  user: {
    id: number;
    full_name: string;
    role: string;
  };
  name: string;
  full_name: string;
  user_email: string;
  position: string;
  bio: string | null;
  image_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  order_index: number;
}

// Frontend-compatible types (transformed from backend)
export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxAttendees?: number;
  currentAttendees: number;
}

export interface Announcement {
  id: string;
  content: string;
  display_text?: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  email?: string;
  linkedin?: string;
}

// Transform functions
export function transformEvent(backendEvent: BackendEvent): Event {
  return {
    id: backendEvent.id.toString(),
    title: backendEvent.title,
    description: backendEvent.description || '',
    startTime: backendEvent.event_date,
    endTime: backendEvent.event_date, // Backend only has single date, use same for both
    location: backendEvent.location || '',
    currentAttendees: backendEvent.rsvp_count || 0,
    // maxAttendees is not available from backend
  };
}

export function transformAnnouncement(backendAnnouncement: BackendAnnouncement): Announcement {
  return {
    id: backendAnnouncement.id.toString(),
    content: backendAnnouncement.content,
    display_text: backendAnnouncement.display_text,
    isPinned: backendAnnouncement.pinned,
    createdAt: backendAnnouncement.created_at,
    updatedAt: backendAnnouncement.updated_at || backendAnnouncement.created_at,
  };
}

export function transformOfficer(backendOfficer: BackendOfficer): Officer {
  return {
    id: backendOfficer.id.toString(),
    name: backendOfficer.name,
    role: backendOfficer.position,
    bio: backendOfficer.bio || '',
    image: backendOfficer.image_url || undefined,
    email: backendOfficer.email || backendOfficer.user_email || undefined,
    linkedin: backendOfficer.linkedin_url || undefined,
  };
} 