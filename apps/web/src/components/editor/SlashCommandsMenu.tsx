'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Editor } from '@tiptap/react';

interface SlashCommandsMenuProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  keywords: string[];
}

export function SlashCommandsMenu({
  editor,
  isOpen,
  onClose,
  position = { top: 0, left: 0 },
}: SlashCommandsMenuProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: <Heading1 className="w-4 h-4 text-primary" />,
      keywords: ['h1', 'heading', 'title'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-4 h-4 text-primary" />,
      keywords: ['h2', 'heading', 'subtitle'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small subsection heading',
      icon: <Heading3 className="w-4 h-4 text-primary" />,
      keywords: ['h3', 'heading', 'sub'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bulleted List',
      description: 'Create a simple bulleted list',
      icon: <List className="w-4 h-4 text-emerald-400" />,
      keywords: ['bullet', 'list', 'ul'],
      action: (ed) => ed.chain().focus().toggleBulletList().run(),
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: <ListOrdered className="w-4 h-4 text-emerald-400" />,
      keywords: ['number', 'ordered', 'ol'],
      action: (ed) => ed.chain().focus().toggleOrderedList().run(),
    },
    {
      title: 'Checklist',
      description: 'Track tasks with checkboxes',
      icon: <CheckSquare className="w-4 h-4 text-amber-400" />,
      keywords: ['todo', 'check', 'task', 'checklist'],
      action: (ed) => ed.chain().focus().toggleTaskList().run(),
    },
    {
      title: 'Quote',
      description: 'Capture a quote or callout',
      icon: <Quote className="w-4 h-4 text-purple-400" />,
      keywords: ['quote', 'blockquote', 'callout'],
      action: (ed) => ed.chain().focus().toggleBlockquote().run(),
    },
    {
      title: 'Code Block',
      description: 'Display code with syntax styling',
      icon: <Code className="w-4 h-4 text-sky-400" />,
      keywords: ['code', 'codeblock', 'pre'],
      action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: 'Divider',
      description: 'Visually divide blocks with a rule',
      icon: <Minus className="w-4 h-4 text-ink-2" />,
      keywords: ['divider', 'hr', 'line', 'separator'],
      action: (ed) => ed.chain().focus().setHorizontalRule().run(),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !editor) return null;

  const executeCommand = (cmd: CommandItem) => {
    // Delete the triggering slash character if present before cursor
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
    const slashIndex = textBefore.lastIndexOf('/');
    if (slashIndex !== -1) {
      const deleteCount = textBefore.length - slashIndex;
      editor.commands.deleteRange({ from: from - deleteCount, to: from });
    }
    cmd.action(editor);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="clay clay-paper clay-card fixed z-50 w-72 border border-line/10 shadow-clay p-2 animate-in fade-in zoom-in-95 duration-100 select-none"
      style={{
        top: Math.min(position.top + 10, window.innerHeight - 380),
        left: Math.min(position.left, window.innerWidth - 320),
      }}
    >
      <div className="px-2.5 py-1.5 border-b border-line/10 flex items-center justify-between text-[11px] text-ink-2">
        <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Basic Blocks</span>
        </span>
        <span className="text-[10px] clay clay-inset bg-canvas px-2 py-0.5 rounded-full text-ink-3 font-mono font-bold">
          ESC to exit
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto py-1 space-y-1">
        {filteredCommands.length === 0 ? (
          <div className="p-3 text-center text-xs font-semibold text-ink-3">No matching commands</div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.title}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-control text-left transition-all ${
                  isSelected
                    ? 'clay clay-paper text-primary-deep font-bold shadow-clay-sm border border-primary/20'
                    : 'text-ink-1 hover:bg-canvas'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-control border flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'clay clay-paper border-primary/30 text-primary shadow-clay-sm'
                      : 'clay clay-inset bg-canvas border-line/10 text-ink-2'
                  }`}
                >
                  {cmd.icon}
                </div>
                <div className="flex flex-col truncate min-w-0">
                  <span className="text-xs font-bold text-ink-1 truncate">{cmd.title}</span>
                  <span className="text-[10px] text-ink-2 truncate">{cmd.description}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
