import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspace: any) => void;
}

export function CreateWorkspaceModal({ isOpen, onClose, onCreated }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

      onCreated(data.workspace);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-1/30 p-4 animate-in fade-in select-none">
      <div className="clay clay-paper rounded-panel max-w-md w-full p-6 border border-line/10 shadow-clay">
        <div className="flex items-center justify-between pb-3.5 border-b border-line/10">
          <div className="flex items-center gap-2.5 text-ink-1 font-bold text-base">
            <div className="w-8 h-8 rounded-control bg-primary flex items-center justify-center text-white shadow-clay-sm">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span>Create New Workspace</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-control text-ink-3 hover:text-ink-1 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-card clay clay-inset bg-peach/40 border border-peach-deep/30 text-err text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team, Acme Corp"
              className="clay clay-inset bg-canvas w-full px-3.5 py-2.5 border border-line/10 rounded-control text-sm text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace used for?"
              className="clay clay-inset bg-canvas w-full px-3.5 py-2.5 border border-line/10 rounded-control text-sm text-ink-1 placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-control text-xs font-bold text-ink-2 hover:text-ink-1 hover:bg-canvas transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary-deep disabled:opacity-50 text-white rounded-control text-xs font-bold transition-all shadow-clay-sm"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
