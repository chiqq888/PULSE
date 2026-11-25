import { useCallback, useEffect, useRef, useState } from 'react';
import { getEventById } from '../services/eventService';
import { isAbortError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export function useEvent(eventId, scope = 'public') {
  const { user } = useAuth();
  const userId = scope === 'public' ? undefined : user?.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(null);

  const fetchEvent = useCallback(
    async ({ silent = false } = {}) => {
      if (!eventId || (scope !== 'public' && !userId)) {
        setEvent(null);
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
        const data = await getEventById(eventId, { signal: controller.signal, scope, userId });
        if (seq !== requestSeqRef.current) return;
        setEvent(data);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || seq !== requestSeqRef.current) return;
        setError(err);
        if (!silent) {
          setEvent(null);
        }
      } finally {
        if (seq === requestSeqRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [eventId, scope, userId]
  );

  useEffect(() => {
    setEvent(null);
    setError(null);
    fetchEvent();

    return () => {
      requestSeqRef.current += 1;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
}
