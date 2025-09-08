import type { Event, RSVP } from '@club-website/domain-types';
import type {
	CreateEventRequest,
	UpdateEventRequest,
	CreateRSVPRequest,
	EventResponse,
	RSVPResponse,
	EventFilters,
} from '@club-website/api-contracts';
import type { HttpTransport } from '../transport/http-transport';
import {
	transformEventResponse,
	transformRSVPResponse,
} from '../transforms/events';

export class EventsResource {
	constructor(private transport: HttpTransport) {}

	/**
	 * Get all events with optional filters
	 */
	async getAll(filters?: EventFilters): Promise<Event[]> {
		const response = await this.transport.get<EventResponse[]>('/events/', {
			params: filters,
		});
		return response.map(transformEventResponse);
	}

	/**
	 * Get a single event by ID
	 */
	async getById(id: string): Promise<Event> {
		const response = await this.transport.get<EventResponse>(`/events/${id}/`);
		return transformEventResponse(response);
	}

	/**
	 * Create a new event
	 */
	async create(request: CreateEventRequest): Promise<Event> {
		const response = await this.transport.post<EventResponse>(
			'/events/create/',
			request
		);
		return transformEventResponse(response);
	}

	/**
	 * Update an existing event
	 */
	async update(id: string, request: UpdateEventRequest): Promise<Event> {
		const response = await this.transport.patch<EventResponse>(
			`/events/${id}/update/`,
			request
		);
		return transformEventResponse(response);
	}

	/**
	 * Delete an event
	 */
	async delete(id: string): Promise<void> {
		await this.transport.delete(`/events/${id}/delete/`);
	}

	/**
	 * Create an RSVP for an event
	 */
	async createRSVP(eventId: string, request: CreateRSVPRequest): Promise<void> {
		await this.transport.post(`/events/${eventId}/rsvp/`, request);
	}

	/**
	 * Get all RSVPs for an event
	 */
	async getRSVPs(eventId: string): Promise<RSVP[]> {
		const response = await this.transport.get<RSVPResponse[]>(
			`/events/${eventId}/rsvps/`
		);
		return response.map(transformRSVPResponse);
	}

	/**
	 * Get events directly from Google Calendar via backend proxy
	 */
	async getFromGoogle(params?: {
		calendarId?: string;
		maxResults?: number;
	}): Promise<Event[]> {
		const response = await this.transport.get<EventResponse[]>(
			`/events/google/`,
			{
				params,
			}
		);
		return response.map(transformEventResponse);
	}

	/**
	 * Get single event from Google proxy by deterministic id
	 */
	async getFromGoogleById(
		id: string,
		params?: { calendarId?: string }
	): Promise<Event> {
		const response = await this.transport.get<EventResponse>(
			`/events/google/${id}/`,
			{ params }
		);
		return transformEventResponse(response);
	}
}
