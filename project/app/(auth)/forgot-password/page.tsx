'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

// Note: metadata export is not supported in 'use client' pages.
// For this page the title is set via the layout's template.

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    const redirectTo = `${window.location.origin}/api/auth/callback?next=/account/settings`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage(`Password reset instructions sent to ${email.trim()}`);
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-parmore-cream flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-parmore-slate hover:text-parmore-gold transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="mb-8">
          <p className="font-serif text-2xl font-bold tracking-widest uppercase text-parmore-black mb-1">
            Parmore
          </p>
          <h1 className="text-base font-semibold text-parmore-black">Reset your password</h1>
          <p className="text-sm text-parmore-slate mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold text-green-800">Check your inbox</p>
                <p className="text-xs text-green-700 mt-0.5">{message}</p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label htmlFor="reset-email" className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 pl-10 pr-4 border border-zinc-200 rounded-sm text-sm placeholder-zinc-400 focus:outline-none focus:border-parmore-black transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-parmore-black text-white text-sm font-semibold rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
