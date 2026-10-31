import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface CommentItem {
  id: string;
  author: { name: string; avatar?: string };
  content: string;
  quote?: string;
  createdAt: string;
  resolved: boolean;
  replies?: Array<{
    id: string;
    author: { name: string };
    content: string;
    createdAt: string;
  }>;
}

interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  comments?: CommentItem[];
  onAddComment?: (text: string) => void;
  onResolveComment?: (commentId: string) => void;
}

export function CommentsSidebar({
  isOpen,
  onClose,
  comments = [
    {
      id: 'c1',
      author: { name: 'Charlie Brown' },
      content: 'Should we verify Redis pub/sub latency under 5ms for cross-node replication?',
      quote: 'Real-Time Architecture',
      createdAt: '10m ago',
      resolved: false,
      replies: [
        {
          id: 'r1',
          author: { name: 'Alice Johnson' },
          content: 'Yes, benchmarking is scheduled in Phase 9 and Phase 10.',
          createdAt: '5m ago',
        },
      ],
    },
  ],
  onAddComment,
  onResolveComment,
}: CommentsSidebarProps) {
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment?.(newComment.trim());
    setNewComment('');
  };

  return (
    <aside className="w-80 border-l border-slate-800 bg-surface flex flex-col h-full shadow-2xl z-30">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-sm text-slate-100">Discussions</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.map((thread) => (
          <div
            key={thread.id}
            className={`p-3 rounded-lg border text-xs space-y-2.5 transition ${
              thread.resolved
                ? 'bg-surface-card/40 border-slate-800/60 opacity-60'
                : 'bg-surface-card border-slate-700/80'
            }`}
          >
            {thread.quote && (
              <div className="border-l-2 border-brand-500 pl-2 text-slate-400 italic">
                "{thread.quote}"
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">{thread.author.name}</span>
              <span className="text-[10px] text-slate-400">{thread.createdAt}</span>
            </div>

            <p className="text-slate-300 leading-relaxed">{thread.content}</p>

            {/* Replies */}
            {thread.replies && thread.replies.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-2 pl-2">
                {thread.replies.map((reply) => (
                  <div key={reply.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-300">{reply.author.name}</span>
                      <span className="text-[10px] text-slate-500">{reply.createdAt}</span>
                    </div>
                    <p className="text-slate-400">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={() => onResolveComment?.(thread.id)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{thread.resolved ? 'Reopen' : 'Resolve'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Leave a comment..."
          className="flex-1 bg-surface-card border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="p-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-md transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
