'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ClayTile, Button, Badge, Divider, ClayTone } from '@/components/ui';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Check current auth status
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        // 2. Fetch invitation details
        const inviteRes = await fetch(`/api/invitations/${token}`);
        if (!inviteRes.ok) {
          const errData = await inviteRes.json();
          setError(errData.error || 'Failed to load invitation');
          setLoading(false);
          return;
        }

        const data = await inviteRes.json();
        setInvitation(data.invitation);
      } catch (err: any) {
        setError('Network error while loading invitation details');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept invitation');
        setAccepting(false);
        return;
      }

      setSuccess(`Joined ${data.workspaceName} as ${data.role}! Redirecting...`);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError('Network error accepting invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-ink-1 flex items-center justify-center p-4">
        <ClayTile tone="paper" size="card" className="p-8 flex flex-col items-center gap-4 text-center border border-line/10">
          <div className="w-10 h-10 border-4 border-primary border-t-lavender rounded-full animate-spin"></div>
          <p className="text-ink-2 text-sm font-semibold">Loading invitation...</p>
        </ClayTile>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-canvas text-ink-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="w-24 h-24 rounded-full clay clay-pink absolute -top-4 -left-6 pointer-events-none opacity-80 animate-float-1 hidden sm:block"
        />
        <div
          aria-hidden="true"
          className="w-28 h-28 rounded-full clay clay-lavender absolute -bottom-10 -right-8 pointer-events-none opacity-80 animate-float-2 hidden sm:block"
        />
        <ClayTile tone="paper" size="panel" className="max-w-md w-full p-8 sm:p-10 text-center border border-line/10 shadow-clay relative z-10">
          <div className="w-14 h-14 bg-peach/70 border border-err/30 rounded-card flex items-center justify-center mx-auto mb-4 text-err text-2xl clay-card">
            ⚠️
          </div>
          <h1 className="text-xl font-extrabold text-ink-1 mb-2">Invalid Invitation</h1>
          <p className="text-ink-2 text-sm font-semibold mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary-deep text-white text-sm font-bold rounded-pill shadow-clay-sm clay-press transition"
          >
            Go to Home
          </Link>
        </ClayTile>
      </div>
    );
  }

  const roleToneMap: Record<string, ClayTone> = {
    OWNER: 'butter',
    EDITOR: 'lavender',
    COMMENTER: 'mint',
    VIEWER: 'sky',
  };
  const roleTone = roleToneMap[invitation?.role] || 'lavender';

  return (
    <div className="min-h-screen bg-canvas text-ink-1 flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary/25">
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

      <div className="max-w-md w-full relative z-10">
        <ClayTile
          tone="paper"
          size="panel"
          className="p-8 sm:p-10 border border-line/10 shadow-clay"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-lavender rounded-card flex items-center justify-center mx-auto mb-4 text-2xl clay-card">
              🚀
            </div>
            <h1 className="text-2xl font-extrabold text-ink-1 mb-1 tracking-tight">
              Workspace Invitation
            </h1>
            <p className="text-ink-2 text-sm font-medium">
              <span className="font-extrabold text-ink-1">
                {invitation?.inviter?.name || 'A team member'}
              </span>{' '}
              has invited you to collaborate.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-control bg-peach/70 border border-err/30 text-err text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.25]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-control bg-mint/70 border border-ok/30 text-ok text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.25]" />
              <span>{success}</span>
            </div>
          )}

          <ClayTile tone={roleTone} size="card" className="p-5 mb-6 border border-line/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink-2 uppercase tracking-wider font-extrabold">
                Workspace
              </span>
              <Badge tone="paper" size="sm">
                Role: {invitation?.role}
              </Badge>
            </div>
            <h2 className="text-lg font-extrabold text-ink-1 mb-1">
              {invitation?.workspace?.name}
            </h2>
            {invitation?.workspace?.description && (
              <p className="text-ink-2 text-xs font-medium">
                {invitation.workspace.description}
              </p>
            )}

            <Divider className="my-3" />

            <div className="flex justify-between text-xs font-semibold text-ink-3">
              <span>Invited email: {invitation?.email}</span>
              <span>Expires: {new Date(invitation?.expiresAt).toLocaleDateString()}</span>
            </div>
          </ClayTile>

          {invitation?.isExpired ? (
            <div className="text-center p-4 bg-butter/70 border border-warn/30 rounded-control text-ink-1 text-sm font-bold">
              This invitation has expired. Please ask the workspace owner to send a new invite link.
            </div>
          ) : currentUser ? (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={accepting}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {accepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Accept & Join Workspace</span>
                )}
              </Button>
              <p className="text-center text-xs font-semibold text-ink-3">
                Logged in as <span className="text-ink-1 font-bold">{currentUser.email}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/login?redirect=/invite/${token}`}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-deep text-white font-bold text-sm rounded-pill shadow-clay-sm clay-press transition text-center block"
              >
                Log In to Accept Invitation
              </Link>
              <Link
                href={`/signup?redirect=/invite/${token}`}
                className="w-full py-2.5 px-4 bg-paper hover:bg-paper/90 text-ink-1 font-bold text-sm rounded-pill border border-line/10 clay-card clay-press transition text-center block"
              >
                Create New Account
              </Link>
            </div>
          )}
        </ClayTile>
      </div>
    </div>
  );
}
