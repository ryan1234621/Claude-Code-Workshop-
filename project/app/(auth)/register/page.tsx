import React from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Parmore and get access to exclusive drops, member events, and personalised recommendations.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-parmore-cream flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: '#0B281E' }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative z-10">
          <p className="font-serif text-2xl font-bold tracking-widest uppercase" style={{ color: '#C5A869' }}>
            Parmore
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-3xl font-serif font-bold leading-snug">
            Join the inner circle.
          </p>
          <ul className="space-y-3 text-sm text-white/70">
            {[
              'Early access to new drops',
              'Members-only events & course stories',
              'Personalised style picks',
              'Faster checkout & order tracking',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span style={{ color: '#C5A869' }}>✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-xs text-white/30 tracking-wider uppercase">Athletic Luxury</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <RegisterForm />
      </div>
    </div>
  );
}
