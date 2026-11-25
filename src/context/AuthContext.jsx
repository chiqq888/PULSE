import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase, supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(!supabase);
  const [profileResult, setProfileResult] = useState(null);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const user = session?.user ?? null;
  const userId = user?.id;

  useEffect(() => {
    if (!supabase) return undefined;

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialized(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfileResult(null);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 12_000);

    async function loadRole() {
      try {
        const { data, error } = await getSupabase()
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .abortSignal(controller.signal)
          .single();

        if (error) throw error;
        if (active) {
          setProfileResult({ userId, profileAttempt, role: data.role });
        }
      } catch {
        if (active) {
          setProfileResult({
            userId,
            profileAttempt,
            error: 'โหลดสิทธิ์บัญชีไม่สำเร็จ กรุณาลองอีกครั้ง',
          });
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    loadRole();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [userId, profileAttempt]);

  const profile =
    profileResult?.userId === userId && profileResult?.profileAttempt === profileAttempt
      ? profileResult
      : null;

  const value = {
    user,
    role: profile?.role ?? null,
    loading: !initialized || Boolean(userId && !profile),
    error: profile?.error ?? null,
    retryProfile: () => setProfileAttempt((attempt) => attempt + 1),
    async signIn(email, password) {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp({ email, password, fullName, emailRedirectTo }) {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo,
        },
      });
      if (error) throw error;
      return data.session;
    },
    async signOut() {
      const { error } = await getSupabase().auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
