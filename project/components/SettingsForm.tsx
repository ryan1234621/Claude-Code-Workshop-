'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '@/app/lib/utils';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
}

interface AddressData {
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

type SaveState = 'idle' | 'saving' | 'success' | 'error';

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 px-3 rounded-sm border border-zinc-200 bg-white text-sm text-parmore-black',
        'placeholder-zinc-400 outline-none transition-colors',
        'hover:border-zinc-300 focus:border-parmore-black',
        'disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

function SaveFeedback({ state }: { state: SaveState }) {
  return (
    <AnimatePresence mode="wait">
      {state === 'success' && (
        <motion.span
          key="success"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-green-600 text-xs font-medium"
        >
          <Check className="h-3.5 w-3.5" /> Saved
        </motion.span>
      )}
      {state === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1.5 text-red-500 text-xs font-medium"
        >
          <AlertCircle className="h-3.5 w-3.5" /> Failed to save
        </motion.span>
      )}
    </AnimatePresence>
  );
}

interface SettingsFormProps {
  initialProfile: ProfileData;
  initialAddress?: AddressData;
  onSaveProfile?: (data: ProfileData) => Promise<void>;
  onSaveAddress?: (data: AddressData) => Promise<void>;
}

export function SettingsForm({
  initialProfile,
  initialAddress,
  onSaveProfile,
  onSaveAddress,
}: SettingsFormProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [address, setAddress] = useState<AddressData>(
    initialAddress ?? {
      full_name: initialProfile.full_name,
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    }
  );
  const [profileSave, setProfileSave] = useState<SaveState>('idle');
  const [addressSave, setAddressSave] = useState<SaveState>('idle');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validateProfile = () => {
    const errs: typeof errors = {};
    if (!profile.full_name.trim()) errs.full_name = 'Name is required';
    if (!profile.email.includes('@')) errs.email = 'Valid email required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAddress = () => {
    const errs: typeof errors = {};
    if (!address.line1.trim()) errs.line1 = 'Address is required';
    if (!address.city.trim()) errs.city = 'City is required';
    if (!address.state.trim()) errs.state = 'State is required';
    if (!address.zip.trim()) errs.zip = 'ZIP is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setProfileSave('saving');
    try {
      await onSaveProfile?.(profile);
      setProfileSave('success');
    } catch {
      setProfileSave('error');
    }
    setTimeout(() => setProfileSave('idle'), 3000);
  };

  const handleSaveAddress = async () => {
    if (!validateAddress()) return;
    setAddressSave('saving');
    try {
      await onSaveAddress?.(address);
      setAddressSave('success');
    } catch {
      setAddressSave('error');
    }
    setTimeout(() => setAddressSave('idle'), 3000);
  };

  return (
    <div className="space-y-8">
      {/* ─── Contact Info ─── */}
      <section className="bg-white rounded-sm border border-zinc-100 shadow-luxury">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <User className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">Contact Information</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Full Name" error={errors.full_name}>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Alex Morgan"
              />
            </FieldGroup>
            <FieldGroup label="Email Address" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="pl-9"
                />
              </div>
            </FieldGroup>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveProfile}
              loading={profileSave === 'saving'}
            >
              {profileSave === 'saving' ? 'Saving…' : 'Save Changes'}
            </Button>
            <SaveFeedback state={profileSave} />
          </div>
        </div>
      </section>

      {/* ─── Default Shipping Address ─── */}
      <section className="bg-white rounded-sm border border-zinc-100 shadow-luxury">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-parmore-gold" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">Default Shipping Address</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Full Name" error={errors.addr_name}>
              <Input
                value={address.full_name}
                onChange={(e) => setAddress((a) => ({ ...a, full_name: e.target.value }))}
                placeholder="Alex Morgan"
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Address Line 1" error={errors.line1}>
            <Input
              value={address.line1}
              onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
              placeholder="42 Augusta Way"
            />
          </FieldGroup>
          <FieldGroup label="Address Line 2">
            <Input
              value={address.line2}
              onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
              placeholder="Apt, suite, etc. (optional)"
            />
          </FieldGroup>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FieldGroup label="City" error={errors.city}>
              <Input
                value={address.city}
                onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                placeholder="Scottsdale"
                className="col-span-1 sm:col-span-2"
              />
            </FieldGroup>
            <FieldGroup label="State" error={errors.state}>
              <Input
                value={address.state}
                onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="AZ"
                maxLength={2}
              />
            </FieldGroup>
            <FieldGroup label="ZIP" error={errors.zip}>
              <Input
                value={address.zip}
                onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
                placeholder="85251"
                maxLength={10}
              />
            </FieldGroup>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAddress}
              loading={addressSave === 'saving'}
            >
              {addressSave === 'saving' ? 'Saving…' : 'Save Address'}
            </Button>
            <SaveFeedback state={addressSave} />
          </div>
        </div>
      </section>

      {/* ─── Password ─── */}
      <section className="bg-white rounded-sm border border-zinc-100 shadow-luxury">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold">Security</h2>
        </div>
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Password</p>
            <p className="text-xs text-parmore-slate mt-0.5">Last changed more than 90 days ago</p>
          </div>
          <Button variant="outline" size="sm">Change Password</Button>
        </div>
      </section>
    </div>
  );
}
