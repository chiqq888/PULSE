import { useCallback, useEffect, useRef, useState } from 'react';
import { getEvents } from '../services/eventService';
import { isAbortError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export function useEvents(scope = 'public') {
  const { user } = useAuth();
  const userId = scope === 'public' ? undefined : user?.id;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(null);

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    if (scope !== 'public' && !userId) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    const seq = ++requestSeqRef.current;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await getEvents({ signal: controller.signal, scope, userId });
      if (seq !== requestSeqRef.current) return;
      setEvents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (isAbortError(err) || seq !== requestSeqRef.current) return;
      setError(err);
    } finally {
      if (seq === requestSeqRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [scope, userId]);

  useEffect(() => {
    setEvents([]);
    fetchEvents();
    return () => {
      requestSeqRef.current += 1;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
