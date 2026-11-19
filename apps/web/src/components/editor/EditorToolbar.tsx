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
    <div className="clay clay-paper clay-card px-3 py-1.5 flex items-center justify-between gap-2 border border-line/10 shadow-clay-sm sticky top-0 z-20 flex-wrap select-none mb-3">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Undo / Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-control hover:bg-canvas text-ink-2 hover:text-ink-1 disabled:opacity-30 transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-control hover:bg-canvas text-ink-2 hover:text-ink-1 disabled:opacity-30 transition-all"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('heading', { level: 1 })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('heading', { level: 2 })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('heading', { level: 3 })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Inline styles: Bold, Italic, Underline */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('bold')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('italic')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('underline')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Lists & Checklist */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted List"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('bulletList')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('orderedList')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Checklist (Task list)"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('taskList')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Quote & Code Block */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('blockquote')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('codeBlock')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Link */}
        <button
          onClick={setLink}
          title={editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive('link')
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive('link') && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
            className="p-1.5 rounded-control hover:bg-canvas text-err transition-all"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Text Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Align Left"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive({ textAlign: 'left' })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Align Center"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive({ textAlign: 'center' })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Align Right"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive({ textAlign: 'right' })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justify"
          className={`p-1.5 rounded-control transition-all ${
            editor.isActive({ textAlign: 'justify' })
              ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold shadow-clay-press'
              : 'hover:bg-canvas text-ink-2 hover:text-ink-1'
          }`}
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-line/15 mx-1" />

        {/* Quick Insert / Slash Command trigger */}
        <button
          onClick={onOpenSlashMenu}
          title="Insert block (/)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold text-primary hover:bg-canvas transition-all"
        >
          <Command className="w-3.5 h-3.5" />
          <span>Insert</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Autosave Status Badge */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-warn font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-ok font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-ink-3 font-semibold">
              <span className="w-2 h-2 rounded-full bg-warn" />
              <span>Unsaved changes</span>
            </span>
          )}
        </div>

        <div className="w-[1px] h-4 bg-line/15" />

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-ink-2 hover:text-ink-1 hover:bg-canvas rounded-control transition-all"
          title="Version history"
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>

        <button
          onClick={onOpenComments}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-ink-2 hover:text-ink-1 hover:bg-canvas rounded-control transition-all"
          title="Comments"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comments</span>
          {commentsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-primary text-white rounded-full text-[10px] font-bold shadow-clay-sm">
              {commentsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
