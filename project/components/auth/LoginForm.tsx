'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { getUserRole } from '@/lib/auth/authHelpers';
import { cn } from '@/app/lib/utils';

type Tab = 'password' | 'magic';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '';
  const urlError = searchParams.get('error');

  const [tab, setTab] = useState<Tab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>(urlError ? 'error' : 'idle');
  const [message, setMessage] = useState(urlError ? decodeURIComponent(urlError) : '');

  const supabase = createSupabaseBrowserClient();

  const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus('loading');
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    const role = getUserRole(data.user);
    const dest = next || (role === 'master_admin' || role === 'staff_admin' ? '/admin' : '/account');
    router.push(dest);
    router.refresh();
  }, [email, password, next, supabase, router]);

  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');

    const redirectTo = `${window.location.origin}/api/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage(`Check your inbox — we sent a link to ${email.trim()}`);
    }
  }, [email, next, supabase]);

  const isLoading = status === 'loading';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand header */}
      <div className="text-center mb-8">
        <p className="font-serif text-2xl font-bold tracking-widest uppercase text-parmore-black">
          Parmore
        </p>
        <p className="text-sm text-parmore-slate mt-1">Sign in to your account</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-sm border border-zinc-200 p-1 mb-6 bg-zinc-50">
        {([
          { key: 'password' as Tab, label: 'Password', icon: undefined as typeof Sparkles | undefined },
          { key: 'magic' as Tab, label: 'Magic Link', icon: Sparkles as typeof Sparkles | undefined },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setStatus('idle'); setMessage(''); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-sm transition-all',
              tab === key
                ? 'bg-parmore-black text-white shadow-sm'
                : 'text-parmore-slate hover:text-parmore-black'
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
          </button>
        ))}
      </div>

      {/* Toast feedback */}
      <AnimatePresence mode="wait">
        {status === 'error' && message && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 p-3 mb-4 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {message}
          </motion.div>
        )}
        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2.5 p-3 mb-4 bg-green-50 border border-green-200 rounded-sm text-sm text-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forms */}
      <AnimatePresence mode="wait">
        {tab === 'password' ? (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
            onSubmit={handlePasswordLogin}
            className="space-y-4"
          >
            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="login-email" className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-4 border border-zinc-200 rounded-sm text-sm placeholder-zinc-400 focus:outline-none focus:border-parmore-black transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-parmore-slate hover:text-parmore-gold transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 border border-zinc-200 rounded-sm text-sm placeholder-zinc-400 focus:outline-none focus:border-parmore-black transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-parmore-black transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-parmore-black text-white text-sm font-semibold rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="magic"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleMagicLink}
            className="space-y-4"
          >
            <p className="text-xs text-parmore-slate">
              Enter your email and we&apos;ll send a one-click sign-in link — no password needed.
            </p>
            <div className="space-y-1">
              <label htmlFor="magic-email" className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={status === 'success'}
                  className="w-full h-11 pl-10 pr-4 border border-zinc-200 rounded-sm text-sm placeholder-zinc-400 focus:outline-none focus:border-parmore-black transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || status === 'success'}
              className="w-full h-11 bg-parmore-black text-white text-sm font-semibold rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : status === 'success' ? (
                <><CheckCircle2 className="h-4 w-4" /> Link Sent</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Send Magic Link</>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Register link */}
      <p className="mt-6 text-center text-xs text-parmore-slate">
        New to Parmore?{' '}
        <Link href="/register" className="font-semibold text-parmore-black hover:text-parmore-gold transition-colors">
          Create an account
        </Link>
      </p>
    </div>
  );
}
