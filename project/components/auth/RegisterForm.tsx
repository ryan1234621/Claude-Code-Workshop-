'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { cn } from '@/app/lib/utils';

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

function validate(full_name: string, email: string, password: string, confirm: string): FormErrors {
  const errors: FormErrors = {};
  if (!full_name.trim()) errors.full_name = 'Name is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (confirm !== password) errors.confirm_password = 'Passwords do not match';
  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const supabase = createSupabaseBrowserClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fullName, email, password, confirm);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitStatus('loading');
    setServerError('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'customer',
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
      },
    });

    if (error) {
      setSubmitStatus('error');
      setServerError(error.message);
      return;
    }

    setSubmitStatus('success');
  }, [fullName, email, password, confirm, supabase]);

  if (submitStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 px-4"
      >
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-parmore-black mb-2">Check your email</h2>
        <p className="text-sm text-parmore-slate mb-6 max-w-xs mx-auto">
          We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="text-xs font-semibold text-parmore-gold hover:underline"
        >
          Back to sign in
        </button>
      </motion.div>
    );
  }

  const isLoading = submitStatus === 'loading';

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    type: string,
    placeholder: string,
    error?: string,
    icon?: React.ReactNode,
    rightEl?: React.ReactNode
  ) => (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full h-11 border rounded-sm text-sm placeholder-zinc-400 focus:outline-none transition-colors',
            icon ? 'pl-10' : 'pl-4',
            rightEl ? 'pr-11' : 'pr-4',
            error ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-parmore-black'
          )}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <p className="font-serif text-2xl font-bold tracking-widest uppercase text-parmore-black">
          Parmore
        </p>
        <p className="text-sm text-parmore-slate mt-1">Create your account</p>
      </div>

      <AnimatePresence>
        {submitStatus === 'error' && serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 p-3 mb-4 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {field(
          'reg-name', 'Full Name',
          fullName, setFullName,
          'text', 'Jordan Smith',
          errors.full_name,
          <User className="h-4 w-4" />
        )}
        {field(
          'reg-email', 'Email',
          email, setEmail,
          'email', 'you@example.com',
          errors.email,
          <Mail className="h-4 w-4" />
        )}
        {field(
          'reg-password', 'Password',
          password, setPassword,
          showPassword ? 'text' : 'password',
          '8+ characters',
          errors.password,
          <Lock className="h-4 w-4" />,
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="text-zinc-400 hover:text-parmore-black transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {field(
          'reg-confirm', 'Confirm Password',
          confirm, setConfirm,
          showPassword ? 'text' : 'password',
          '••••••••',
          errors.confirm_password,
          <Lock className="h-4 w-4" />
        )}

        <p className="text-xs text-parmore-slate">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-parmore-gold">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-parmore-gold">Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-parmore-black text-white text-sm font-semibold rounded-sm hover:bg-zinc-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-parmore-slate">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-parmore-black hover:text-parmore-gold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
