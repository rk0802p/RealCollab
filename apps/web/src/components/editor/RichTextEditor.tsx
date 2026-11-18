'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { MessageSquare } from 'lucide-react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorToolbar, SaveStatus } from './EditorToolbar';
import { SlashCommandsMenu } from './SlashCommandsMenu';
import { CommentExtension } from './extensions/CommentExtension';
import { CommentThread, CommentAnchorData } from '@/types';

interface RichTextEditorProps {
  pageId: string;
  initialTitle?: string;
  initialIcon?: string;
  initialContent?: string | null;
  ydoc?: Y.Doc | null;
  provider?: WebsocketProvider | null;
  userRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  user?: {
    name: string;
    color: string;
  } | null;
  typingUsers?: string[];
  onTyping?: (isTyping: boolean) => void;
  onSave?: (pageId: string, data: { title?: string; content?: string }) => Promise<void>;
  onOpenComments?: () => void;
  onOpenHistory?: () => void;
  commentsCount?: number;
  comments?: CommentThread[];
  activeCommentId?: string | null;
  onCommentClick?: (commentId: string) => void;
  onAddCommentToSelection?: (anchor: CommentAnchorData) => void;
  anchorToFocus?: CommentAnchorData | null;
  isHistoryPreviewing?: boolean;
  historyPreviewContent?: string | null;
  historyPreviewTitle?: string | null;
  onExitHistoryPreview?: () => void;
  onRestoreHistoryPreview?: () => void;
}

export function RichTextEditor({
  pageId,
  initialTitle = 'Untitled Document',
  initialIcon = '📝',
  initialContent,
  ydoc,
  provider,
  userRole = 'EDITOR',
  user,
  typingUsers = [],
  onTyping,
  onSave,
  onOpenComments,
  onOpenHistory,
  commentsCount = 0,
  comments = [],
  activeCommentId = null,
  onCommentClick,
  onAddCommentToSelection,
  anchorToFocus,
  isHistoryPreviewing = false,
  historyPreviewContent = null,
  historyPreviewTitle = null,
  onExitHistoryPreview,
  onRestoreHistoryPreview,
}: RichTextEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const activeCommentIdRef = useRef(activeCommentId);
  activeCommentIdRef.current = activeCommentId;

  const ydocRef = useRef(ydoc);
  ydocRef.current = ydoc;

  const onCommentClickRef = useRef(onCommentClick);
  onCommentClickRef.current = onCommentClick;

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  // Sync title when initialTitle changes from parent
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const defaultContent = initialContent || `<h1>${initialTitle}</h1>
<p>Start drafting your collaborative document or type <code>/</code> for block commands.</p>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Complete project setup</p></div></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Draft technical specification</p></div></li>
</ul>
<blockquote>"Ideas become reality when teams collaborate in real time."</blockquote>`;

  const editor = useEditor(
    {
      editable: canEdit,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          history: ydoc ? false : {},
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          autolink: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Placeholder.configure({
          placeholder: canEdit ? "Type '/' for commands or start writing..." : 'Read-only document',
        }),
        ...(ydoc
          ? [
              Collaboration.configure({
                document: ydoc,
              }),
            ]
          : []),
        ...(provider && ydoc && user
          ? [
              CollaborationCursor.configure({
                provider,
                user: {
                  name: user.name,
                  color: user.color,
                },
              }),
            ]
          : []),
        CommentExtension.configure({
          getComments: () => commentsRef.current,
          getActiveCommentId: () => activeCommentIdRef.current,
          getYdoc: () => ydocRef.current,
          onCommentClick: (id) => onCommentClickRef.current?.(id),
        }),
      ],
      content: ydoc ? undefined : defaultContent,
      editorProps: {
        attributes: {
          class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-200 text-sm leading-relaxed px-12 py-6',
        },
        handleKeyDown: (_view, event) => {
          if (!canEdit) return true;
          if (event.key !== 'Escape') {
            onTyping?.(true);
          }
          if (event.key === '/') {
            setTimeout(() => {
              if (!editor) return;
              const { from } = editor.state.selection;
              const coords = editor.view.coordsAtPos(from);
              setSlashMenuPos({ top: coords.bottom + 8, left: coords.left });
              setSlashMenuOpen(true);
            }, 10);
          } else if (event.key === 'Escape') {
            setSlashMenuOpen(false);
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        setSaveStatus('unsaved');
        onTyping?.(true);
        triggerDebouncedSave(title, editor.getHTML());
      },
    },
    [pageId, ydoc, provider, canEdit]
  );

  // Debounced auto-save function
  const triggerDebouncedSave = useCallback(
    (currentTitle: string, currentContent: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        if (!onSave) return;
        setSaveStatus('saving');
        try {
          await onSave(pageId, { title: currentTitle, content: currentContent });
          setSaveStatus('saved');
          setLastSavedAt(new Date());
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus('unsaved');
        }
      }, 1000);
    },
    [pageId, onSave]
  );

  // Trigger ProseMirror decoration updates when comments or activeCommentId changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.view.dispatch(editor.state.tr);
    }
  }, [comments, activeCommentId, editor]);

  // Scroll to anchor when requested
  useEffect(() => {
    if (!editor || !anchorToFocus) return;
    let from = anchorToFocus.from;
    let to = anchorToFocus.to;

    if (ydoc && anchorToFocus.startRelPos && anchorToFocus.endRelPos) {
      try {
        const fragment = ydoc.getXmlFragment('default');
        const startAbs = Y.createAbsolutePositionFromRelativePosition(
          Y.createRelativePositionFromJSON(anchorToFocus.startRelPos),
          ydoc
        );
        const endAbs = Y.createAbsolutePositionFromRelativePosition(
          Y.createRelativePositionFromJSON(anchorToFocus.endRelPos),
          ydoc
        );
        if (startAbs && endAbs && startAbs.index < endAbs.index) {
          from = startAbs.index;
          to = endAbs.index;
        }
      } catch {
        // fallback
      }
    }

    if (typeof from === 'number' && typeof to === 'number') {
      const docSize = editor.state.doc.content.size;
      const safeFrom = Math.max(1, Math.min(from, docSize));
      const safeTo = Math.max(safeFrom, Math.min(to, docSize));
      if (safeFrom < safeTo) {
        editor.chain().focus().setTextSelection({ from: safeFrom, to: safeTo }).scrollIntoView().run();
      }
    }
  }, [editor, anchorToFocus, ydoc]);

  const handleCommentSelection = useCallback(() => {
    if (!editor || !onAddCommentToSelection) return;
    const { from, to } = editor.state.selection;
    if (from >= to) return;

    const quote = editor.state.doc.textBetween(from, to, ' ');
    if (!quote.trim()) return;

    let startRelPos = null;
    let endRelPos = null;

    if (ydoc) {
      try {
        const fragment = ydoc.getXmlFragment('default');
        startRelPos = Y.relativePositionToJSON(
          Y.createRelativePositionFromTypeIndex(fragment, from)
        );
        endRelPos = Y.relativePositionToJSON(
          Y.createRelativePositionFromTypeIndex(fragment, to)
        );
      } catch (err) {
        console.warn('Yjs relative position calculation error:', err);
      }
    }

    onAddCommentToSelection({
      quote,
      from,
      to,
      startRelPos,
      endRelPos,
    });
  }, [editor, ydoc, onAddCommentToSelection]);

  // Manual save keyboard shortcut (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editor && onSave) {
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          setSaveStatus('saving');
          onSave(pageId, { title, content: editor.getHTML() })
            .then(() => {
              setSaveStatus('saved');
              setLastSavedAt(new Date());
            })
            .catch(() => setSaveStatus('unsaved'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, pageId, title, onSave]);

  const handleTitleChange = (newTitle: string) => {
    if (!canEdit) return;
    setTitle(newTitle);
    setSaveStatus('unsaved');
    onTyping?.(true);
    if (editor) {
      triggerDebouncedSave(newTitle, editor.getHTML());
    }
  };

  const handleManualSlashOpen = () => {
    if (!editor || !canEdit) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    setSlashMenuPos({ top: coords.bottom + 8, left: Math.max(20, coords.left) });
    setSlashMenuOpen(true);
  };

  if (!editor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-3" />
        <span className="text-xs">Initializing collaborative editor...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-y-auto relative">
      {/* Formatting & Controls Toolbar */}
      <EditorToolbar
        editor={editor}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onOpenComments={onOpenComments}
        onOpenHistory={onOpenHistory}
        onOpenSlashMenu={handleManualSlashOpen}
        commentsCount={commentsCount}
      />

      {/* Historical Snapshot Preview Banner */}
      {isHistoryPreviewing && (
        <div className="bg-amber-950/90 border-b border-amber-600/50 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 z-20 backdrop-blur sticky top-0 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-100">Historical Preview Mode:</span>
            <span>{historyPreviewTitle || 'Snapshot Checkpoint'} (Read-Only)</span>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && onRestoreHistoryPreview && (
              <button
                type="button"
                onClick={onRestoreHistoryPreview}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium transition shadow text-xs"
              >
                Restore this version
              </button>
            )}
            <button
              type="button"
              onClick={onExitHistoryPreview}
              className="px-2.5 py-1 rounded bg-surface-card hover:bg-surface text-slate-300 hover:text-white transition text-xs border border-slate-700"
            >
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* Main Document Content Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto py-10 px-6">
        {/* Document Header: Icon & Editable Title */}
        <div className="mb-6 px-12 group">
          <div className="text-4xl mb-3 select-none inline-block hover:scale-110 transition cursor-pointer">
            {initialIcon}
          </div>
          <input
            type="text"
            readOnly={!canEdit || isHistoryPreviewing}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Document"
            className="w-full text-3xl font-bold bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-slate-800 pb-1 transition disabled:opacity-75"
          />
        </div>

        {/* Floating Bubble Menu for Selection Actions */}
        {editor && !isHistoryPreviewing && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 150 }}
            shouldShow={({ editor, from, to }) => {
              return from < to && !editor.state.selection.empty;
            }}
            className="flex items-center gap-1 bg-surface border border-slate-700/90 rounded-lg p-1 shadow-2xl backdrop-blur-md z-30"
          >
            {userRole !== 'VIEWER' && (
              <button
                type="button"
                onClick={handleCommentSelection}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded transition"
                title="Add comment on selected text"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Comment</span>
              </button>
            )}
            <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-1.5 py-0.5 rounded text-xs transition ${editor.isActive('bold') ? 'bg-surface-card text-brand-400' : 'text-slate-300 hover:text-white'}`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-1.5 py-0.5 rounded text-xs transition ${editor.isActive('italic') ? 'bg-surface-card text-brand-400' : 'text-slate-300 hover:text-white'}`}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-1.5 py-0.5 rounded text-xs transition ${editor.isActive('underline') ? 'bg-surface-card text-brand-400' : 'text-slate-300 hover:text-white'}`}
              title="Underline"
            >
              <u>U</u>
            </button>
          </BubbleMenu>
        )}

        {/* TipTap Document Area or Historical Preview */}
        {isHistoryPreviewing && historyPreviewContent !== null ? (
          <div className="prose prose-invert max-w-none px-12 py-6 text-slate-200 text-sm leading-relaxed bg-surface-card/30 rounded-xl border border-amber-500/30 whitespace-pre-wrap select-text font-sans">
            {historyPreviewContent || '(Empty document in this snapshot checkpoint)'}
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </main>

      {/* Floating Slash Commands Menu */}
      <SlashCommandsMenu
        editor={editor}
        isOpen={slashMenuOpen}
        onClose={() => setSlashMenuOpen(false)}
        position={slashMenuPos}
      />

      {/* Live Active Editing / Typing Indicator Toast */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="fixed bottom-6 right-8 bg-surface/95 border border-slate-700/80 text-xs px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-slate-200 z-40 transition-all">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="font-medium text-[11px]">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is editing...`
              : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : ''} are editing...`}
          </span>
        </div>
      )}
    </div>
  );
}
