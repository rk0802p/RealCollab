import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Settings,
  Users,
  ChevronDown,
  LogOut,
  FolderPlus,
  Check,
} from 'lucide-react';
import { WorkspaceSummary, UserSummary } from '@realcollab/shared';

interface WorkspaceSidebarProps {
  currentWorkspaceName?: string;
  workspaces?: WorkspaceSummary[];
  activeWorkspaceId?: string;
  pages?: Array<{ id: string; title: string; icon?: string }>;
  activePageId?: string;
  user?: UserSummary | null;
  onSelectPage?: (pageId: string) => void;
  onCreatePage?: () => void;
  onSelectWorkspace?: (workspaceId: string) => void;
  onOpenCreateWorkspace?: () => void;
  onOpenMembersModal?: () => void;
  onLogout?: () => void;
}

export function WorkspaceSidebar({
  currentWorkspaceName = 'Engineering Hub',
  workspaces = [],
  activeWorkspaceId,
  pages = [],
  activePageId,
  user,
  onSelectPage,
  onCreatePage,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  onOpenMembersModal,
  onLogout,
}: WorkspaceSidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <aside className="w-64 border-r border-slate-800 bg-surface flex flex-col h-screen select-none">
      {/* Workspace Switcher Header */}
      <div className="relative">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-3 border-b border-slate-800 flex items-center justify-between hover:bg-surface-card/50 cursor-pointer transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center font-bold text-xs text-white">
              RC
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-slate-100 truncate w-36">
                {currentWorkspaceName}
              </span>
              <span className="text-[11px] text-slate-400">Workspace</span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Workspace Dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-surface-card border border-slate-700 rounded-lg shadow-2xl p-1.5 z-40 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider block">
              Workspaces
            </span>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onSelectWorkspace?.(ws.id);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-surface hover:text-white rounded transition text-left"
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && <Check className="w-3.5 h-3.5 text-brand-400" />}
              </button>
            ))}

            <div className="pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenCreateWorkspace?.();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-brand-400 hover:bg-surface rounded transition text-left"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pages Navigation */}
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

      {/* Footer controls & User profile */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          onClick={onOpenMembersModal}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs text-slate-300 hover:text-slate-100 hover:bg-surface-card transition"
        >
          <Users className="w-4 h-4 text-slate-400" />
          <span>Members & Roles</span>
        </button>

        {user && (
          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center font-bold text-[10px] text-white">
                {user.name[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-slate-200 truncate w-32 font-medium">{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
