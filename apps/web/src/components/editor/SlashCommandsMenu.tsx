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
      icon: <Heading1 className="w-4 h-4 text-brand-400" />,
      keywords: ['h1', 'heading', 'title'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="w-4 h-4 text-brand-400" />,
      keywords: ['h2', 'heading', 'subtitle'],
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Small subsection heading',
      icon: <Heading3 className="w-4 h-4 text-brand-400" />,
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
      icon: <Minus className="w-4 h-4 text-slate-400" />,
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
      className="fixed z-50 w-72 bg-surface border border-slate-700/80 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
      style={{
        top: Math.min(position.top + 10, window.innerHeight - 380),
        left: Math.min(position.left, window.innerWidth - 320),
      }}
    >
      <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-brand-400" />
          <span>Basic Blocks</span>
        </span>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
          ESC to exit
        </span>
      </div>

      <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
        {filteredCommands.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-500">No matching commands</div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.title}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition ${
                  isSelected ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-surface-card'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md border flex items-center justify-center ${
                    isSelected ? 'bg-surface-card border-brand-500/50' : 'bg-surface-card/60 border-slate-800'
                  }`}
                >
                  {cmd.icon}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium text-slate-100">{cmd.title}</span>
                  <span className="text-[10px] text-slate-400 truncate">{cmd.description}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
