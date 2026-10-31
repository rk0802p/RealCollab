import React from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  MessageSquare,
  History,
} from 'lucide-react';

interface EditorToolbarProps {
  onToggleBold?: () => void;
  onToggleItalic?: () => void;
  onToggleH1?: () => void;
  onToggleH2?: () => void;
  onToggleH3?: () => void;
  onToggleBulletList?: () => void;
  onToggleOrderedList?: () => void;
  onToggleBlockquote?: () => void;
  onToggleCodeBlock?: () => void;
  onOpenComments?: () => void;
  onOpenHistory?: () => void;
  commentsCount?: number;
}

export function EditorToolbar({
  onToggleBold,
  onToggleItalic,
  onToggleH1,
  onToggleH2,
  onToggleH3,
  onToggleBulletList,
  onToggleOrderedList,
  onToggleBlockquote,
  onToggleCodeBlock,
  onOpenComments,
  onOpenHistory,
  commentsCount = 0,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleBold}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleItalic}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          onClick={onToggleH1}
          title="Heading 1"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleH2}
          title="Heading 2"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleH3}
          title="Heading 3"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          onClick={onToggleBulletList}
          title="Bullet List"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleOrderedList}
          title="Ordered List"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        <button
          onClick={onToggleBlockquote}
          title="Quote"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleCodeBlock}
          title="Code Block"
          className="p-1.5 rounded hover:bg-surface-card text-slate-300 hover:text-white transition"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-card rounded transition"
          title="Version history"
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
        <button
          onClick={onOpenComments}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-card rounded transition"
          title="Comments"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comments</span>
          {commentsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-brand-600 text-white rounded-full text-[10px]">
              {commentsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
