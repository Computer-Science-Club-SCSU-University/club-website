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
  pinned: boolean;
  is_draft: boolean;
  discord_message_id?: string | null;
  author?: string;
  publishedAt: string;
  updatedAt: string;
}

export interface Officer {
  id: string;
  name: string;
  position: string;
  user_email: string;
  bio: string;
  image_url: string;
  linkedin_url?: string;
  email?: string;
  order_index: number;
}

export interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
} 