import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

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
    role: string;
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

export interface BackendRSVP {
  id: number;
  event_id: number;
  name: string;
  email: string;
  comment: string | null;
  created_at: string;
}

// Frontend-compatible types
export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxAttendees?: number;
  rsvpCount: number;
  rsvps: EventRSVP[];
}

export interface EventRSVP {
  id: number;
  name: string;
  email: string;
  comment?: string;
  timestamp: string;
}

export interface Announcement {
  id: number;
  content: string;
  display_text?: string | null;
  pinned: boolean;
  is_draft: boolean;
  summary: string;
  publishedAt: string;
  updatedAt: string;
}

export interface Officer {
  id: number;
  name: string;
  position: string;
  email: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  order_index: number;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request configuration interface
export interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: any;
  timeout?: number;
  retries?: number;
}

// API Client class
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    defaultTimeout: number = 10000,
    defaultRetries: number = 3
  ) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
    this.defaultRetries = defaultRetries;
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {},
    getToken?: () => Promise<string | null>
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      body,
      headers = {},
      ...restConfig
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token if available
    const token = getToken ? await getToken() : null;

    const requestConfig: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...restConfig,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new ApiError(
            errorData?.error || errorData?.detail || `HTTP ${response.status}`,
            response.status,
            errorData
          );
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return {} as T;
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or auth errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    // If we get here, all retries failed
    if (lastError instanceof ApiError) {
      throw lastError;
    }

    throw new ApiError(
      'Network error - please check your connection and try again',
      0
    );
  }

  // HTTP method helpers
  async get<T>(endpoint: string, config?: RequestConfig, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' }, getToken);
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body: data }, getToken);
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body: data }, getToken);
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body: data }, getToken);
  }

  async delete<T>(endpoint: string, config?: RequestConfig, getToken?: () => Promise<string | null>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' }, getToken);
  }
}

// Transform functions
export function transformEvent(backendEvent: BackendEvent): Event {
  return {
    id: backendEvent.id,
    title: backendEvent.title,
    description: backendEvent.description || '',
    location: backendEvent.location || '',
    startTime: backendEvent.event_date,
    endTime: backendEvent.event_date, // Backend only has single date
    rsvpCount: backendEvent.rsvp_count || 0,
    rsvps: [], // Will be populated separately if needed
  };
}

export function transformAnnouncement(backendAnnouncement: BackendAnnouncement): Announcement {
  return {
    id: backendAnnouncement.id,
    content: backendAnnouncement.content,
    display_text: backendAnnouncement.display_text,
    pinned: backendAnnouncement.pinned,
    is_draft: backendAnnouncement.is_draft,
    summary: backendAnnouncement.content.substring(0, 150) + '...', // Generate summary
    publishedAt: backendAnnouncement.created_at,
    updatedAt: backendAnnouncement.updated_at,
  };
}

export function transformOfficer(backendOfficer: BackendOfficer): Officer {
  return {
    id: backendOfficer.id,
    name: backendOfficer.name,
    position: backendOfficer.position,
    email: backendOfficer.email || backendOfficer.user_email,
    bio: backendOfficer.bio || '',
    image_url: backendOfficer.image_url || '',
    linkedin_url: backendOfficer.linkedin_url || '',
    order_index: backendOfficer.order_index,
  };
}

export function transformRSVP(backendRSVP: BackendRSVP): EventRSVP {
  return {
    id: backendRSVP.id,
    name: backendRSVP.name,
    email: backendRSVP.email,
    comment: backendRSVP.comment || undefined,
    timestamp: backendRSVP.created_at,
  };
}

// Default API client instance
export const apiClient = new ApiClient();

// API service methods
export const api = {
  // Events
  events: {
    getAll: (getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendEvent[]>('/events/', undefined, getToken),
    
    getById: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendEvent>(`/events/${id}/`, undefined, getToken),
    
    create: (data: Omit<Event, 'id' | 'rsvpCount' | 'rsvps'>, getToken?: () => Promise<string | null>) => 
      apiClient.post<BackendEvent>('/events/', {
        title: data.title,
        description: data.description,
        location: data.location,
        event_date: data.startTime,
      }, undefined, getToken),
    
    update: (id: number, data: Partial<Event>, getToken?: () => Promise<string | null>) => 
      apiClient.patch<BackendEvent>(`/events/${id}/`, {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.startTime && { event_date: data.startTime }),
      }, undefined, getToken),
    
    delete: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.delete(`/events/${id}/`, undefined, getToken),
    
    getRSVPs: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendRSVP[]>(`/events/${id}/rsvps/`, undefined, getToken),
  },

  // Announcements
  announcements: {
    getAll: (getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendAnnouncement[]>('/announcements/admin/', undefined, getToken),
    
    getById: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendAnnouncement>(`/announcements/${id}/`, undefined, getToken),
    
    create: (data: Omit<Announcement, 'id' | 'publishedAt' | 'updatedAt' | 'summary' | 'author'>, getToken?: () => Promise<string | null>) => 
      apiClient.post<BackendAnnouncement>('/announcements/create/', {  // Changed from '/announcements/' to '/announcements/create/'
        content: data.content,
        display_text: data.display_text,
        pinned: data.pinned || false,
        is_draft: data.is_draft !== false, // Default to draft if not specified
      }, undefined, getToken),
    
    update: (id: number, data: Partial<Announcement>, getToken?: () => Promise<string | null>) => 
      apiClient.patch<BackendAnnouncement>(`/announcements/${id}/update/`, {  // Changed from put to patch
        ...(data.content !== undefined && { content: data.content }),
        ...(data.display_text !== undefined && { display_text: data.display_text }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        ...(data.is_draft !== undefined && { is_draft: data.is_draft })
      }, undefined, getToken).then(transformAnnouncement),
    
    delete: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.delete(`/announcements/${id}/delete/`, undefined, getToken),  // Keep existing delete endpoint
    
    pin: (id: number, displayText: string, getToken?: () => Promise<string | null>) => 
      apiClient.patch<BackendAnnouncement>(`/announcements/${id}/pin/`, {
        display_text: displayText,
        pinned: true
      }, undefined, getToken),
    
    unpin: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.patch<BackendAnnouncement>(`/announcements/${id}/pin/`, {}, undefined, getToken),
  },

  // Officers
  officers: {
    getAll: (getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendOfficer[]>('/officers/', undefined, getToken),
    
    getById: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.get<BackendOfficer>(`/officers/${id}/`, undefined, getToken),
    
    create: (data: Omit<Officer, 'id'>, getToken?: () => Promise<string | null>) => 
      apiClient.post<BackendOfficer>('/officers/create/', {
        name: data.name,
        position: data.position,
        bio: data.bio,
        image_url: data.image_url,
        linkedin_url: data.linkedin_url,
        email: data.email,
        order_index: data.order_index,
      }, undefined, getToken),
    
    update: (id: number, data: Partial<Officer>, getToken?: () => Promise<string | null>) => 
      apiClient.patch<BackendOfficer>(`/officers/${id}/update/`, {
        ...(data.name && { name: data.name }),
        ...(data.position && { position: data.position }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.image_url !== undefined && { image_url: data.image_url }),
        ...(data.linkedin_url !== undefined && { linkedin_url: data.linkedin_url }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.order_index !== undefined && { order_index: data.order_index }),
      }, undefined, getToken),
    
    delete: (id: number, getToken?: () => Promise<string | null>) => 
      apiClient.delete(`/officers/${id}/delete/`, undefined, getToken),
  },
};

// React hook for using the API client with Clerk authentication
export function useApiClient() {
    const { getToken } = useAuth();
  
    // Create a function that gets the token with your template
    const getAuthToken = useCallback(async () => {
      try {
        // Use 'backend' as your template name
        return await getToken({ template: 'backend' });
      } catch (error) {
        console.error('Failed to get auth token:', error);
        return null;
      }
    }, [getToken]);
  
    const authenticatedApi = {
      events: {
        getAll: useCallback(() => api.events.getAll(getAuthToken), [getAuthToken]),
        getById: useCallback((id: number) => api.events.getById(id, getAuthToken), [getAuthToken]),
        create: useCallback((data: Omit<Event, 'id' | 'rsvpCount' | 'rsvps'>) => api.events.create(data, getAuthToken), [getAuthToken]),
        update: useCallback((id: number, data: Partial<Event>) => api.events.update(id, data, getAuthToken), [getAuthToken]),
        delete: useCallback((id: number) => api.events.delete(id, getAuthToken), [getAuthToken]),
        getRSVPs: useCallback((id: number) => api.events.getRSVPs(id, getAuthToken), [getAuthToken]),
      },
      announcements: {
        getAll: useCallback(() => api.announcements.getAll(getAuthToken), [getAuthToken]),
        getById: useCallback((id: number) => api.announcements.getById(id, getAuthToken), [getAuthToken]),
        create: useCallback((data: Omit<Announcement, 'id' | 'publishedAt' | 'updatedAt' | 'summary' | 'author'>) => api.announcements.create(data, getAuthToken), [getAuthToken]),
        update: useCallback((id: number, data: Partial<Announcement>) => api.announcements.update(id, data, getAuthToken), [getAuthToken]),
        delete: useCallback((id: number) => api.announcements.delete(id, getAuthToken), [getAuthToken]),
        pin: useCallback((id: number, displayText: string) => api.announcements.pin(id, displayText, getAuthToken), [getAuthToken]),
        unpin: useCallback((id: number) => api.announcements.unpin(id, getAuthToken), [getAuthToken]),
      },
      officers: {
        getAll: useCallback(() => api.officers.getAll(getAuthToken), [getAuthToken]),
        getById: useCallback((id: number) => api.officers.getById(id, getAuthToken), [getAuthToken]),
        create: useCallback((data: Omit<Officer, 'id'>) => api.officers.create(data, getAuthToken), [getAuthToken]),
        update: useCallback((id: number, data: Partial<Officer>) => api.officers.update(id, data, getAuthToken), [getAuthToken]),
        delete: useCallback((id: number) => api.officers.delete(id, getAuthToken), [getAuthToken]),
      },
    };
  
    return authenticatedApi;
}
