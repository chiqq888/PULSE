import { queryDatabase } from './apiClient';
import { getSupabase } from './supabaseClient';

export async function getCategories({ signal } = {}) {
  return queryDatabase(getSupabase().from('categories').select('id, name').order('name'), { signal });
}
