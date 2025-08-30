"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiClient, type BackendOfficer, ApiError } from "../lib/api";

export function useOfficers() {
  const [officers, setOfficers] = useState<BackendOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();

  const loadOfficers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const backendOfficers = await api.officers.getAll();
      setOfficers(backendOfficers);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to load officers";
      setError(errorMessage);
      console.error("Error loading officers:", err);
    } finally {
      setLoading(false);
    }
  }, [api.officers.getAll]);

  useEffect(() => {
    loadOfficers();
  }, [loadOfficers]);

  const addOfficer = useCallback(async (officerData: any) => {
    try {
      setError(null);
      const backendOfficer = await api.officers.create(officerData);
      setOfficers(prev => [...prev, backendOfficer]);
      return backendOfficer;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to create officer";
      setError(errorMessage);
      throw err;
    }
  }, [api.officers.create]);

  const editOfficer = useCallback(async (id: number, officerData: any) => {
    try {
      setError(null);
      const backendOfficer = await api.officers.update(id, officerData);
      setOfficers(prev => prev.map(o => o.id === id ? backendOfficer : o));
      return backendOfficer;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to update officer";
      setError(errorMessage);
      throw err;
    }
  }, [api.officers.update]);

  const removeOfficer = useCallback(async (id: number) => {
    try {
      setError(null);
      await api.officers.delete(id);
      setOfficers(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to delete officer";
      setError(errorMessage);
      throw err;
    }
  }, [api.officers.delete]);

  return {
    officers,
    loading,
    error,
    addOfficer,
    editOfficer,
    removeOfficer,
    refetch: loadOfficers,
  };
}
