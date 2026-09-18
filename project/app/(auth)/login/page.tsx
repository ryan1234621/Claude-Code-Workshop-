import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Parmore account to access orders, returns, and member benefits.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-parmore-cream flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: '#0B281E' }}
      >
        {/* Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative z-10">
          <p className="font-serif text-2xl font-bold tracking-widest uppercase" style={{ color: '#C5A869' }}>
            Parmore
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-3xl font-serif font-bold leading-snug">
            Welcome back<br />to the Clubhouse.
          </p>
          <p className="text-sm text-white/60 max-w-xs leading-relaxed">
            Premium golf apparel crafted for the modern golfer. Performance-engineered. Luxury-finished.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-xs text-white/30 tracking-wider uppercase">Athletic Luxury</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
