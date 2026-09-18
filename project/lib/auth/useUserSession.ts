'use client';

import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface UserSessionState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/** Subscribes to Supabase onAuthStateChange and keeps React state in sync. */
export function useUserSession(): UserSessionState {
  const supabase = createSupabaseBrowserClient();
  const [state, setState] = useState<UserSessionState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Initial session read
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    // Subscribe to future changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, session, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
