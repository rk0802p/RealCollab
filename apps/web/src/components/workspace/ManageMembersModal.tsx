import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, Trash2, Mail, Copy, Check, Link as LinkIcon, Clock } from 'lucide-react';
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

interface PendingInvitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
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
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'COMMENTER' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const isOwner = currentUserRole === 'OWNER';

  // Load pending invitations when modal is opened or tab switched
  useEffect(() => {
    if (isOpen && isOwner) {
      loadInvitations();
    }
  }, [isOpen, workspaceId, isOwner]);

  const loadInvitations = async () => {
    setLoadingInvites(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoadingInvites(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setSuccess('');
    setGeneratedInviteUrl('');
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invitation');

      setGeneratedInviteUrl(data.inviteUrl);
      setSuccess(`Invitation created for ${email}!`);
      setEmail('');
      loadInvitations();
      onMemberUpdated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${inviteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke invitation');
      }
      loadInvitations();
    } catch (err: any) {
      alert(err.message);
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-base">
            <Shield className="w-5 h-5 text-brand-500" />
            <span>Workspace Access & Members</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'members'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
            }`}
          >
            Members ({members.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'invitations'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-card'
              }`}
            >
              <span>Invitations</span>
              {invitations.length > 0 && (
                <span className="px-1.5 py-0.2 bg-brand-500/30 text-brand-300 rounded-full text-[10px]">
                  {invitations.length}
                </span>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            {success}
          </div>
        )}

        {/* Tab 1: Members */}
        {activeTab === 'members' && (
          <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
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
        )}

        {/* Tab 2: Invitations */}
        {activeTab === 'invitations' && isOwner && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleCreateInvite} className="p-3 bg-surface-card rounded-lg space-y-3">
              <span className="text-xs font-semibold text-slate-200">Send Invitation Link</span>
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
                  <span>Generate</span>
                </button>
              </div>

              {generatedInviteUrl && (
                <div className="mt-2 p-2 bg-slate-900 border border-brand-500/30 rounded flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate text-xs text-slate-300 font-mono">
                    <LinkIcon className="w-3 h-3 text-brand-400 shrink-0" />
                    <span className="truncate">{generatedInviteUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2 py-1 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-medium rounded flex items-center gap-1 transition shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </form>

            {/* Pending invitations list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Invitations ({invitations.length})
              </span>

              {loadingInvites ? (
                <div className="text-center py-4 text-xs text-slate-500">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">No pending invitations</div>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-card/60 hover:bg-surface-card transition border border-slate-800"
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-200">{inv.email}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="text-brand-400 font-medium">Role: {inv.role}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title="Revoke invitation"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
