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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/30 p-4 animate-in fade-in select-none">
      <div className="clay clay-paper rounded-panel max-w-lg w-full p-6 border border-line/10 shadow-clay">
        <div className="flex items-center justify-between pb-3.5 border-b border-line/10">
          <div className="flex items-center gap-2.5 text-ink-1 font-bold text-base">
            <div className="w-8 h-8 rounded-control bg-primary flex items-center justify-center text-white shadow-clay-sm">
              <Shield className="w-4 h-4" />
            </div>
            <span>Workspace Access & Members</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-control text-ink-3 hover:text-ink-1 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-line/10 pb-2.5">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
              activeTab === 'members'
                ? 'clay clay-paper text-primary-deep shadow-clay-sm border border-primary/20'
                : 'text-ink-2 hover:bg-canvas'
            }`}
          >
            Members ({members.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'invitations'
                  ? 'clay clay-paper text-primary-deep shadow-clay-sm border border-primary/20'
                  : 'text-ink-2 hover:bg-canvas'
              }`}
            >
              <span>Invitations</span>
              {invitations.length > 0 && (
                <span className="px-1.5 py-0.2 bg-primary/20 text-primary-deep rounded-full text-[10px] font-bold">
                  {invitations.length}
                </span>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-card clay clay-inset bg-peach/40 border border-peach-deep/30 text-err text-xs font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-3 rounded-card clay clay-inset bg-mint/40 border border-mint-deep/30 text-ok text-xs font-bold">
            {success}
          </div>
        )}

        {/* Tab 1: Members */}
        {activeTab === 'members' && (
          <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
            <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
              Active Members ({members.length})
            </span>

            <div className="space-y-1.5 mt-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-card clay clay-paper border border-line/10 shadow-clay-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white shadow-clay-sm">
                      {m.user.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink-1">{m.user.name}</div>
                      <div className="text-[11px] text-ink-3 font-medium">{m.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && m.role !== 'OWNER' ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as WorkspaceRole)}
                        className="clay clay-inset bg-canvas border border-line/10 rounded-control px-2.5 py-1 text-[11px] text-ink-1 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="COMMENTER">Commenter</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold clay clay-inset bg-canvas text-ink-2 border border-line/10">
                        {m.role}
                      </span>
                    )}

                    {isOwner && m.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemove(m.id, m.user.name)}
                        className="p-1.5 text-ink-3 hover:text-err transition-all rounded-control"
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
            <form onSubmit={handleCreateInvite} className="p-3.5 clay clay-inset bg-canvas rounded-card border border-line/10 space-y-3">
              <span className="text-xs font-bold text-ink-1">Send Invitation Link</span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 text-ink-3"
                    style={{ transform: "translateY(-50%)" }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collaborator@example.com"
                    className="clay clay-paper w-full pl-8 pr-3 py-1.5 border border-line/10 rounded-control text-xs text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium shadow-clay-sm"
                  />
                </div>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="clay clay-paper border border-line/10 rounded-control px-2.5 py-1.5 text-xs text-ink-1 font-semibold shadow-clay-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="COMMENTER">Commenter</option>
                  <option value="VIEWER">Viewer</option>
                </select>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-deep disabled:opacity-50 text-white rounded-control text-xs font-bold flex items-center gap-1.5 transition-all shadow-clay-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>

              {generatedInviteUrl && (
                <div className="mt-2 p-2.5 clay clay-paper border border-primary/30 rounded-control flex items-center justify-between gap-2 shadow-clay-sm">
                  <div className="flex items-center gap-1.5 truncate text-xs text-ink-1 font-mono">
                    <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{generatedInviteUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-primary hover:bg-primary-deep text-white text-[11px] font-bold rounded-control flex items-center gap-1 transition-all shrink-0 shadow-clay-sm"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </form>

            {/* Pending invitations list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                Pending Invitations ({invitations.length})
              </span>

              {loadingInvites ? (
                <div className="text-center py-4 text-xs font-semibold text-ink-3">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-4 text-xs font-semibold text-ink-3">No pending invitations</div>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 rounded-card clay clay-paper border border-line/10 shadow-clay-sm"
                    >
                      <div>
                        <div className="text-xs font-bold text-ink-1">{inv.email}</div>
                        <div className="flex items-center gap-2 text-[10px] text-ink-3 font-medium">
                          <span className="text-primary font-bold">Role: {inv.role}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-err hover:bg-peach/30 rounded-control transition-all"
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

        <div className="mt-5 pt-3.5 border-t border-line/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 clay clay-paper rounded-control text-xs font-bold text-ink-2 hover:text-ink-1 hover:bg-canvas border border-line/10 shadow-clay-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
