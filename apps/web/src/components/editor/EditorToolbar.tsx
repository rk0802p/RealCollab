'use client';

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  MessageSquare,
  History,
  Cloud,
  Check,
  Loader2,
  Command,
} from 'lucide-react';
import { Editor } from '@tiptap/react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface EditorToolbarProps {
  editor: Editor | null;
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
  onOpenComments?: () => void;
  onOpenHistory?: () => void;
  onOpenSlashMenu?: () => void;
  commentsCount?: number;
}

export function EditorToolbar({
  editor,
  saveStatus = 'saved',
  lastSavedAt,
  onOpenComments,
  onOpenHistory,
  onOpenSlashMenu,
  commentsCount = 0,
}: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-surface/90 backdrop-blur sticky top-0 z-20 flex-wrap gap-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Undo / Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-surface-card text-slate-400 hover:text-white disabled:opacity-30 transition"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-surface-card text-slate-400 hover:text-white disabled:opacity-30 transition"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className={`p-1.5 rounded transition ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Inline styles: Bold, Italic, Underline */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded transition ${
            editor.isActive('bold')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded transition ${
            editor.isActive('italic')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded transition ${
            editor.isActive('underline')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Lists & Checklist */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted List"
          className={`p-1.5 rounded transition ${
            editor.isActive('bulletList')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={`p-1.5 rounded transition ${
            editor.isActive('orderedList')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Checklist (Task list)"
          className={`p-1.5 rounded transition ${
            editor.isActive('taskList')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Quote & Code Block */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={`p-1.5 rounded transition ${
            editor.isActive('blockquote')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={`p-1.5 rounded transition ${
            editor.isActive('codeBlock')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Link */}
        <button
          onClick={setLink}
          title={editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
          className={`p-1.5 rounded transition ${
            editor.isActive('link')
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive('link') && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
            className="p-1.5 rounded hover:bg-surface-card text-rose-400 hover:text-rose-300 transition"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Text Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align Left"
          className={`p-1.5 rounded transition ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align Center"
          className={`p-1.5 rounded transition ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align Right"
          className={`p-1.5 rounded transition ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justify"
          className={`p-1.5 rounded transition ${
            editor.isActive({ textAlign: 'justify' })
              ? 'bg-brand-600/30 text-brand-300'
              : 'hover:bg-surface-card text-slate-400 hover:text-white'
          }`}
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />

        {/* Quick Insert / Slash Command trigger */}
        <button
          onClick={onOpenSlashMenu}
          title="Insert block (/)"
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-card text-xs text-brand-400 hover:text-brand-300 font-medium transition"
        >
          <Command className="w-3.5 h-3.5" />
          <span>Insert</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Autosave Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>

        <div className="w-[1px] h-4 bg-slate-800" />

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
