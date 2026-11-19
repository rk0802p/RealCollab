'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { ClayTile, Button, Input, Divider } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 selection:bg-primary/25 relative overflow-hidden">
      {/* Decorative pastel clay shapes */}
      <div
        aria-hidden="true"
        className="w-24 h-24 rounded-full clay clay-lavender absolute -top-4 -left-6 pointer-events-none opacity-80 animate-float-1 hidden sm:block"
      />
      <div
        aria-hidden="true"
        className="w-32 h-14 rounded-pill clay clay-butter absolute top-16 -right-8 pointer-events-none opacity-80 animate-float-2 hidden sm:block"
      />
      <div
        aria-hidden="true"
        className="w-20 h-20 rounded-card clay clay-mint absolute -bottom-6 -left-8 pointer-events-none opacity-80 animate-float-2 hidden sm:block"
      />
      <div
        aria-hidden="true"
        className="w-28 h-28 rounded-full clay clay-pink absolute -bottom-10 -right-8 pointer-events-none opacity-80 animate-float-1 hidden sm:block"
      />
      <div
        aria-hidden="true"
        className="w-12 h-12 rounded-card clay clay-peach absolute top-1/2 -right-14 pointer-events-none opacity-70 animate-float-1 hidden md:block"
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-card bg-primary text-white flex items-center justify-center font-extrabold text-2xl shadow-clay-sm clay-press mb-4">
            RC
          </div>
          <h1 className="text-[28px] font-extrabold text-ink-1 tracking-tight leading-tight">
            Welcome to RealCollab
          </h1>
          <p className="text-sm font-semibold text-ink-2 mt-1.5 max-w-sm">
            Real-time collaborative workspace with CRDT synchronization
          </p>
        </div>

        {/* Auth Card */}
        <ClayTile
          tone="paper"
          size="panel"
          className="p-8 sm:p-10 border border-line/10 shadow-clay relative"
        >
          <h2 className="text-lg font-extrabold text-ink-1 mb-6">
            Sign in to your account
          </h2>

          {error && (
            <div className="mb-5 p-3.5 rounded-control bg-peach/70 border border-err/30 text-err text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.25]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-ink-2 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3">
                  <Mail className="w-4 h-4 stroke-[2.25]" />
                </div>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-ink-2 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3">
                  <Lock className="w-4 h-4 stroke-[2.25]" />
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="lg"
              className="w-full mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.25]" />
                </>
              )}
            </Button>
          </form>

          <Divider className="my-6" />

          <div className="text-center">
            <p className="text-xs font-semibold text-ink-3">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-primary-deep hover:underline font-bold"
              >
                Create an account
              </Link>
            </p>
          </div>
        </ClayTile>
      </div>
    </div>
  );
}
