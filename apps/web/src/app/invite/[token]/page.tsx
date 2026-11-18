'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400 text-2xl">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Workspace Invitation</h1>
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-slate-200">{invitation?.inviter?.name || 'A team member'}</span> has
            invited you to collaborate.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs">
            {success}
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Workspace</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Role: {invitation?.role}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{invitation?.workspace?.name}</h2>
          {invitation?.workspace?.description && (
            <p className="text-slate-400 text-xs">{invitation.workspace.description}</p>
          )}

          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Invited email: {invitation?.email}</span>
            <span>Expires: {new Date(invitation?.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>

        {invitation?.isExpired ? (
          <div className="text-center p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
            This invitation has expired. Please ask the workspace owner to send a new invite link.
          </div>
        ) : currentUser ? (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <span>Accept & Join Workspace</span>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Logged in as <span className="text-slate-200 font-medium">{currentUser.email}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition text-center block"
            >
              Log In to Accept Invitation
            </Link>
            <Link
              href={`/signup?redirect=/invite/${token}`}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm rounded-lg transition text-center block"
            >
              Create New Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
