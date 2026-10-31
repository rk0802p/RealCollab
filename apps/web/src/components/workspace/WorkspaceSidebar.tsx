import React from 'react';
import {
  FileText,
  Plus,
  Settings,
  Users,
  FolderOpen,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface WorkspaceSidebarProps {
  currentWorkspaceName?: string;
  pages?: Array<{ id: string; title: string; icon?: string }>;
  activePageId?: string;
  onSelectPage?: (pageId: string) => void;
  onCreatePage?: () => void;
}

export function WorkspaceSidebar({
  currentWorkspaceName = 'Engineering Hub',
  pages = [
    { id: 'page-1', title: 'Product Specification', icon: '📝' },
    { id: 'page-2', title: 'CRDT Sync Architecture', icon: '⚡' },
    { id: 'page-3', title: 'Sprint Backlog', icon: '🎯' },
  ],
  activePageId = 'page-1',
  onSelectPage,
  onCreatePage,
}: WorkspaceSidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-surface flex flex-col h-screen select-none">
      {/* Workspace Switcher */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between hover:bg-surface-card/50 cursor-pointer transition">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center font-bold text-xs text-white">
            RC
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-slate-100 truncate w-36">
              {currentWorkspaceName}
            </span>
            <span className="text-[11px] text-slate-400">Team Workspace</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {/* Navigation section */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Documents
            </span>
            <button
              onClick={onCreatePage}
              className="p-1 text-slate-400 hover:text-white hover:bg-surface-card rounded transition"
              title="Create page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {pages.map((p) => {
              const isActive = p.id === activePageId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPage?.(p.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition text-left ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-100 font-medium'
                      : 'text-slate-300 hover:bg-surface-card hover:text-white'
                  }`}
                >
                  <span className="text-sm">{p.icon || '📄'}</span>
                  <span className="truncate flex-1">{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-card transition">
          <Users className="w-4 h-4" />
          <span>Members & Roles</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-card transition">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
