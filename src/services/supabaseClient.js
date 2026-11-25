import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseSetupMessage =
  'ระบบยังไม่ได้เชื่อมต่อ Supabase กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY';

function createConfiguredClient() {
  if (!url || !key) return null;

  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

export const supabase = createConfiguredClient();

export function getSupabase() {
  if (!supabase) throw new Error(supabaseSetupMessage);
  return supabase;
}
