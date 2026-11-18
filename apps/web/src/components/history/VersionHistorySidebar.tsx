'use client';

import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Eye,
  Plus,
  Bookmark,
  Clock,
  Check,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { DocumentSnapshotSummary } from '@/types';

interface VersionHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: DocumentSnapshotSummary[];
  previewingSnapshot: DocumentSnapshotSummary | null;
  onPreviewSnapshot: (id: string) => Promise<void>;
  onExitPreview: () => void;
  onRestoreSnapshot: (id: string) => Promise<any>;
  onCreateCheckpoint: (description: string) => Promise<any>;
  userRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

export function VersionHistorySidebar({
  isOpen,
  onClose,
  snapshots,
  previewingSnapshot,
  onPreviewSnapshot,
  onExitPreview,
  onRestoreSnapshot,
  onCreateCheckpoint,
  userRole = 'EDITOR',
}: VersionHistorySidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [checkpointDesc, setCheckpointDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  if (!isOpen) return null;

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointDesc.trim() || isSubmitting || !canEdit) return;
    setIsSubmitting(true);
    try {
      await onCreateCheckpoint(checkpointDesc.trim());
      setCheckpointDesc('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create snapshot checkpoint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRestore = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onRestoreSnapshot(id);
      setConfirmRestoreId(null);
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-88 w-[22rem] border-l border-slate-800 bg-surface flex flex-col h-full shadow-2xl z-30 select-none">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-surface/90">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-sm text-slate-100">Version History</h2>
          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[11px] font-mono">
            {snapshots.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="p-1 rounded text-slate-400 hover:text-brand-300 hover:bg-surface-card transition"
              title="Create named snapshot checkpoint"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Preview Banner */}
      {previewingSnapshot && (
        <div className="p-3 bg-amber-950/40 border-b border-amber-600/40 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-amber-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Previewing historical version
            </span>
            <button
              onClick={onExitPreview}
              className="text-slate-400 hover:text-white text-[11px] underline"
            >
              Exit
            </button>
          </div>
          <div className="text-[11px] text-amber-200/80">
            {previewingSnapshot.description || 'Snapshot'} • {formatTimestamp(previewingSnapshot.createdAt)}
          </div>
          {canEdit ? (
            <button
              onClick={() => setConfirmRestoreId(previewingSnapshot.id)}
              className="w-full py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition flex items-center justify-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore this version</span>
            </button>
          ) : (
            <p className="text-[10px] text-slate-400 italic">
              Viewers and commenters cannot restore historical versions.
            </p>
          )}
        </div>
      )}

      {/* New Named Checkpoint Modal / Inline Form */}
      {isCreating && canEdit && (
        <form onSubmit={handleCreate} className="p-3 bg-surface-card border-b border-slate-700/80 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-medium text-slate-200">
            <span className="flex items-center gap-1.5 text-brand-300">
              <Bookmark className="w-3.5 h-3.5" />
              Create named snapshot
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-slate-200 text-[10px]"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Major draft revision, Before client review..."
            value={checkpointDesc}
            onChange={(e) => setCheckpointDesc(e.target.value)}
            autoFocus
            className="w-full text-xs bg-surface border border-slate-700 rounded p-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!checkpointDesc.trim() || isSubmitting}
              className="px-3 py-1 text-xs rounded bg-brand-600 text-white font-medium hover:bg-brand-500 disabled:opacity-50 transition"
            >
              Save Checkpoint
            </button>
          </div>
        </form>
      )}

      {/* Snapshot Confirmation Modal */}
      {confirmRestoreId && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-700/50 space-y-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Confirm Version Restore</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Restoring will roll back document content to this snapshot. An automatic backup checkpoint of your current state will be saved before restoring.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setConfirmRestoreId(null)}
              disabled={isSubmitting}
              className="px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-surface transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmRestore(confirmRestoreId)}
              disabled={isSubmitting}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Confirm & Restore</span>
            </button>
          </div>
        </div>
      )}

      {/* Snapshots Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Current Live State Card */}
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/10 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Current Live Version
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono">Live</span>
          </div>
          <p className="text-slate-400 text-[11px]">Active collaborative document</p>
        </div>

        {/* Empty state */}
        {snapshots.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto opacity-30" />
            <p>No historical snapshots yet.</p>
            {canEdit && (
              <p className="text-[11px] text-slate-400">
                Click "+" above to save a named checkpoint.
              </p>
            )}
          </div>
        )}

        {/* Snapshot cards */}
        {snapshots.map((s) => {
          const isPreviewing = previewingSnapshot?.id === s.id;

          return (
            <div
              key={s.id}
              className={`p-3 rounded-lg border text-xs space-y-2 transition ${
                isPreviewing
                  ? 'border-amber-500/80 bg-surface-card ring-1 ring-amber-500/50'
                  : 'bg-surface-card border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200 leading-snug">
                    {s.description || 'Snapshot Checkpoint'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    <span>{formatTimestamp(s.createdAt)}</span>
                    {s.creator && (
                      <>
                        <span>•</span>
                        <span>{s.creator.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="font-mono text-[9px] text-slate-500">
                      {(s.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (isPreviewing) {
                      onExitPreview();
                    } else {
                      onPreviewSnapshot(s.id);
                    }
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                    isPreviewing
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-surface'
                  }`}
                  title={isPreviewing ? 'Exit preview' : 'Preview this version'}
                >
                  <Eye className="w-3 h-3" />
                  <span>{isPreviewing ? 'Previewing' : 'Preview'}</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => setConfirmRestoreId(s.id)}
                    className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-amber-300 hover:bg-surface transition flex items-center gap-1"
                    title="Restore document to this version"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
