import React, { useState } from 'react';
import { X, UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import { WorkspaceRole } from '@realcollab/shared';

interface Member {
  id: string;
  role: WorkspaceRole;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  members: Member[];
  currentUserRole?: WorkspaceRole;
  onMemberUpdated?: () => void;
}

export function ManageMembersModal({
  isOpen,
  onClose,
  workspaceId,
  members,
  currentUserRole = 'OWNER',
  onMemberUpdated,
}: ManageMembersModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'COMMENTER' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const isOwner = currentUserRole === 'OWNER';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setSuccess(`Added ${email} as ${role}!`);
      setEmail('');
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }
      onMemberUpdated?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }
      onMemberUpdated?.();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface border border-slate-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
            <Shield className="w-5 h-5 text-brand-500" />
            <span>Workspace Members & Roles</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            {success}
          </div>
        )}

        {/* Invite section (Owner only) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mt-4 p-3 bg-surface-card rounded-lg space-y-3">
            <span className="text-xs font-semibold text-slate-200">Invite new team member</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full pl-8 pr-3 py-1.5 bg-surface border border-slate-700 rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-surface border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="EDITOR">Editor</option>
                <option value="COMMENTER">Commenter</option>
                <option value="VIEWER">Viewer</option>
              </select>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>
          </form>
        )}

        {/* Members list */}
        <div className="mt-5 space-y-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Members ({members.length})
          </span>

          <div className="space-y-1.5 mt-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-card/60 hover:bg-surface-card transition border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                    {m.user.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{m.user.name}</div>
                    <div className="text-[11px] text-slate-400">{m.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && m.role !== 'OWNER' ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as WorkspaceRole)}
                      className="bg-surface border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="COMMENTER">Commenter</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {m.role}
                    </span>
                  )}

                  {isOwner && m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(m.id, m.user.name)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-card hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
