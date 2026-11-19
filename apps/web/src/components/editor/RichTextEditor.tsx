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
  isSynced?: boolean;
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
  isSynced = false,
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
  const isDirtyRef = useRef(false);
  const isSeedingRef = useRef(false);
  const hasSeededRef = useRef(false);

  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const activeCommentIdRef = useRef(activeCommentId);
  activeCommentIdRef.current = activeCommentId;

  const ydocRef = useRef(ydoc);
  ydocRef.current = ydoc;

  const onCommentClickRef = useRef(onCommentClick);
  onCommentClickRef.current = onCommentClick;

  const titleRef = useRef(title);
  titleRef.current = title;

  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

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
          class: 'prose max-w-none focus:outline-none min-h-[500px] text-ink-1 text-sm leading-relaxed px-12 py-6',
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
        if (isSeedingRef.current) return;
        isDirtyRef.current = true;
        setSaveStatus('unsaved');
        onTyping?.(true);
        triggerDebouncedSave(titleRef.current, editor.getHTML());
      },
    },
    [pageId, ydoc, provider, canEdit]
  );

  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Flush pending save immediately when pageId changes or component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (
        isDirtyRef.current &&
        !isSeedingRef.current &&
        editorRef.current &&
        !editorRef.current.isDestroyed &&
        onSaveRef.current &&
        pageIdRef.current
      ) {
        const html = editorRef.current.getHTML();
        if (html && html !== '<p></p>') {
          onSaveRef.current(pageIdRef.current, {
            title: titleRef.current,
            content: html,
          }).catch(console.error);
        }
        isDirtyRef.current = false;
      }
    };
  }, [pageId]);

  // If the Yjs document is empty and we have saved database content, seed it into the editor
  // ONLY after the provider has synced with the server (or timed out for offline mode)
  useEffect(() => {
    if (!editor || editor.isDestroyed || !initialContent || hasSeededRef.current) return;

    const seedIfEmpty = () => {
      if (hasSeededRef.current || !editor || editor.isDestroyed) return;
      if (ydoc) {
        const fragment = ydoc.getXmlFragment('default');
        // If shared fragment has no length and initialContent is not empty
        if (fragment.length === 0 && initialContent.trim().length > 0) {
          hasSeededRef.current = true;
          isSeedingRef.current = true;
          editor.commands.setContent(initialContent);
          isDirtyRef.current = false;
          setSaveStatus('saved');
          const timer = setTimeout(() => {
            isSeedingRef.current = false;
          }, 100);
          return () => clearTimeout(timer);
        } else if (fragment.length > 0) {
          // Document already has content synced from the server, do not duplicate!
          hasSeededRef.current = true;
        }
      }
    };

    // If provider is present and not yet synced, wait for sync (with a 1500ms safety timeout for offline)
    if (provider && !isSynced) {
      const timeout = setTimeout(() => {
        seedIfEmpty();
      }, 1500);
      return () => clearTimeout(timeout);
    }

    // Either no provider (standalone) or provider has completed sync with the server
    seedIfEmpty();
  }, [editor, ydoc, provider, isSynced, initialContent]);

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
          isDirtyRef.current = false;
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
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-ink-2">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-lavender animate-spin mb-3" />
        <span className="text-xs font-bold text-ink-2">Initializing collaborative editor...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative w-full">
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
        <div className="clay clay-butter rounded-tile px-5 py-3 mb-3 flex items-center justify-between text-xs text-ink-1 border border-butter-deep/30 shadow-clay-sm select-none sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-warn animate-pulse" />
            <span className="font-bold text-ink-1">Historical Preview Mode:</span>
            <span className="font-medium text-ink-2">{historyPreviewTitle || 'Snapshot Checkpoint'} (Read-Only)</span>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && onRestoreHistoryPreview && (
              <button
                type="button"
                onClick={onRestoreHistoryPreview}
                className="px-3 py-1 rounded-control bg-primary hover:bg-primary-deep text-white font-bold transition-all shadow-clay-sm text-xs"
              >
                Restore this version
              </button>
            )}
            <button
              type="button"
              onClick={onExitHistoryPreview}
              className="px-2.5 py-1 rounded-control clay clay-paper hover:bg-canvas text-ink-2 hover:text-ink-1 transition-all text-xs border border-line/10 shadow-clay-sm font-semibold"
            >
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* Main Document Content Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto pb-16">
        <div className="clay clay-paper rounded-panel p-8 md:p-12 border border-line/10 shadow-clay min-h-[600px]">
          {/* Document Header: Icon & Editable Title */}
          <div className="mb-6 group">
            <div className="text-4xl mb-3 select-none inline-block hover:scale-110 transition cursor-pointer">
              {initialIcon}
            </div>
            <input
              type="text"
              readOnly={!canEdit || isHistoryPreviewing}
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled Document"
              className="w-full text-3xl font-extrabold bg-transparent text-ink-1 placeholder-ink-3 focus:outline-none border-b-2 border-transparent focus:border-primary/30 pb-1 transition-all disabled:opacity-75"
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
              className="clay clay-paper clay-card flex items-center gap-1.5 p-1.5 border border-line/10 shadow-clay z-30 select-none"
            >
              {userRole !== 'VIEWER' && (
                <button
                  type="button"
                  onClick={handleCommentSelection}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-warn hover:bg-canvas rounded-control transition-all"
                  title="Add comment on selected text"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-warn" />
                  <span>Comment</span>
                </button>
              )}
              <div className="w-[1px] h-3.5 bg-line/15 mx-0.5" />
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 py-0.5 rounded-control text-xs font-bold transition-all ${
                  editor.isActive('bold')
                    ? 'clay clay-inset bg-lavender/40 text-primary-deep shadow-clay-press'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-canvas'
                }`}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 py-0.5 rounded-control text-xs font-bold transition-all ${
                  editor.isActive('italic')
                    ? 'clay clay-inset bg-lavender/40 text-primary-deep shadow-clay-press'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-canvas'
                }`}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-2 py-0.5 rounded-control text-xs font-bold transition-all ${
                  editor.isActive('underline')
                    ? 'clay clay-inset bg-lavender/40 text-primary-deep shadow-clay-press'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-canvas'
                }`}
                title="Underline"
              >
                <u>U</u>
              </button>
            </BubbleMenu>
          )}

          {/* TipTap Document Area or Historical Preview */}
          {isHistoryPreviewing && historyPreviewContent !== null ? (
            <div className="clay clay-inset bg-canvas p-6 rounded-card border border-line/10 text-ink-1 text-sm leading-relaxed whitespace-pre-wrap select-text font-mono">
              {historyPreviewContent || '(Empty document in this snapshot checkpoint)'}
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
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
        <div className="clay clay-paper rounded-full border border-line/10 px-4 py-2 shadow-clay fixed bottom-6 right-8 flex items-center gap-2.5 text-ink-1 z-40 transition-all select-none">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="font-bold text-[11px] text-ink-2">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is editing...`
              : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : ''} are editing...`}
          </span>
        </div>
      )}
    </div>
  );
}
