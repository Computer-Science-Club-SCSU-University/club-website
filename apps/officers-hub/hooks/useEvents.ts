"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiClient, type Event, type EventRSVP, ApiError } from "../lib/api";
import { 
  toCreateEventRequest, 
  toUpdateEventRequest,
  toEventUIProps,
  toRSVPUIProps
} from "../lib/adapters";

export { type Event, type EventRSVP } from "../lib/api";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  useEffect(() => {
    loadEvents();
  }, [api]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await api.events.getAll();
      setEvents(events);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to load events";
      setError(errorMessage);
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    meetingLink?: string;
    slidesUrl?: string;
  }) => {
    try {
      setError(null);
      const request = toCreateEventRequest(eventData);
      const event = await api.events.create(request);
      setEvents(prev => [...prev, event]);
      return event;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to create event";
      setError(errorMessage);
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<{
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
  }>) => {
    try {
      setError(null);
      const request = toUpdateEventRequest(eventData);
      const event = await api.events.update(id, request);
      setEvents(prev => prev.map(e => e.id === id ? event : e));
      return event;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to update event";
      setError(errorMessage);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      setError(null);
      await api.events.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to delete event";
      setError(errorMessage);
      throw err;
    }
  };

  const getRSVPs = async (eventId: string): Promise<EventRSVP[]> => {
    try {
      return await api.events.getRSVPs(eventId);
    } catch (err) {
      console.error("Error loading RSVPs:", err);
      throw err;
    }
  };

  const getEventById = useCallback(async (id: string): Promise<Event> => {
    try {
      setError(null);
      
      // First check if event is already in cache
      const cachedEvent = events.find(event => event.id === id);
      if (cachedEvent) {
        return cachedEvent;
      }
      
      // Only make API call if not in cache
      const event = await api.events.getById(id);
      
      // Add to cache for future use
      setEvents(prev => {
        const exists = prev.find(e => e.id === id);
        if (exists) {
          return prev.map(e => e.id === id ? event : e);
        } else {
          return [...prev, event];
        }
      });
      
      return event;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to load event";
      setError(errorMessage);
      throw err;
    }
  }, [events, api.events]);

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getRSVPs,
    refetch: loadEvents,
  };
}