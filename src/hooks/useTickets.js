import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getEventStats,
  getOrganizerTickets,
  getTicketById,
  getTicketsByEvent,
  getTicketsByUser,
} from '../services/ticketService';
import { isAbortError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

function useTicketData({
  mode,
  eventId = '',
  ticketId = '',
  enabled = true,
  scope = 'public',
} = {}) {
  const { user } = useAuth();
  const publicStats = mode === 'stats' && scope === 'public';
  const userId = publicStats ? undefined : user?.id;
  const [tickets, setTickets] = useState(mode === 'single' ? null : []);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);
  const abortRef = useRef(null);

  const hasRequiredId = (mode !== 'event' || Boolean(eventId)) &&
    (mode !== 'single' || Boolean(ticketId));
  const canFetch = enabled && hasRequiredId && (publicStats || Boolean(userId));

  const fetchTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (!canFetch) {
        setTickets(mode === 'single' ? null : []);
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
        const options = { signal: controller.signal };
        let data;
        if (mode === 'stats') {
          data = await getEventStats({ eventId, scope, ...options });
        } else if (mode === 'event') {
          data = await getTicketsByEvent(eventId, userId, options);
        } else if (mode === 'mine') {
          data = await getTicketsByUser(userId, options);
        } else if (mode === 'single') {
          data = await getTicketById(ticketId, userId, options);
        } else {
          data = await getOrganizerTickets(userId, options);
        }

        if (seq !== requestSeqRef.current) return;
        setTickets(mode === 'single' ? data : Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (isAbortError(err) || seq !== requestSeqRef.current) return;
        setError(err);
        if (!silent && mode === 'single') {
          setTickets(null);
        }
      } finally {
        if (seq === requestSeqRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [canFetch, eventId, mode, scope, ticketId, userId]
  );

  useEffect(() => {
    setError(null);
    if (mode === 'single') {
      setTickets(null);
    } else {
      setTickets([]);
    }
    fetchTickets();

    return () => {
      requestSeqRef.current += 1;
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchTickets, mode]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useTickets(options) {
  return useTicketData(options);
}

export function useEventStats(options) {
  const { tickets: stats, ...request } = useTicketData({ ...options, mode: 'stats' });
  return { stats, ...request };
}
