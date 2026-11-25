import { queryDatabase, queryDatabaseRows } from './apiClient';
import { getSupabase } from './supabaseClient';

export function getEventStaff(eventId, { signal } = {}) {
  const client = getSupabase();
  return queryDatabaseRows(
    () => client.rpc('list_event_staff', { p_event_id: eventId }).order('email').order('id'),
    { signal }
  );
}

export function addEventStaff(eventId, email) {
  const query = getSupabase().rpc('add_event_staff', { p_event_id: eventId, p_email: email });
  return queryDatabase(query, { mutation: true });
}
