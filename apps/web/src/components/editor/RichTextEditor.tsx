'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from './EditorToolbar';

interface RichTextEditorProps {
  pageId?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onOpenComments?: () => void;
  onOpenHistory?: () => void;
  commentsCount?: number;
}

export function RichTextEditor({
  pageId = 'page-1',
  initialContent = `<h1>Real-Time Collaborative Workspace (FS-02)</h1>
<p>Welcome to <strong>RealCollab</strong>! This workspace demonstrates <em>conflict-free concurrent editing</em>, ephemeral awareness, and durable persistence.</p>
<blockquote>"The best way to solve multiplayer concurrency is not locking, but mathematically provable convergence." — CRDT Principles</blockquote>
<h3>Implementation Highlights</h3>
<ul>
  <li><strong>Yjs CRDT Engine</strong>: Merges concurrent edits deterministically.</li>
  <li><strong>Live Cursors</strong>: Real-time caret tracking with lib0 and Awareness protocol.</li>
  <li><strong>Stateful WebSocket Daemon</strong>: Decoupled from serverless Next.js edge.</li>
  <li><strong>Redis Pub/Sub</strong>: Horizontal clustering across collaboration instances.</li>
</ul>
<pre><code>// Connecting TipTap to Yjs
import { WebsocketProvider } from 'y-websocket';
const provider = new WebsocketProvider(COLLAB_WS_URL, roomName, ydoc);
</code></pre>`,
  onContentChange,
  onOpenComments,
  onOpenHistory,
  commentsCount = 1,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-200 text-sm leading-relaxed p-6',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  if (!mounted || !editor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-3" />
        <span className="text-xs">Initializing editor engine...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-y-auto">
      <EditorToolbar
        onToggleBold={() => editor.chain().focus().toggleBold().run()}
        onToggleItalic={() => editor.chain().focus().toggleItalic().run()}
        onToggleH1={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        onToggleH2={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        onToggleH3={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        onToggleBulletList={() => editor.chain().focus().toggleBulletList().run()}
        onToggleOrderedList={() => editor.chain().focus().toggleOrderedList().run()}
        onToggleBlockquote={() => editor.chain().focus().toggleBlockquote().run()}
        onToggleCodeBlock={() => editor.chain().focus().toggleCodeBlock().run()}
        onOpenComments={onOpenComments}
        onOpenHistory={onOpenHistory}
        commentsCount={commentsCount}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-6">
        <EditorContent editor={editor} />
      </main>
    </div>
  );
}
