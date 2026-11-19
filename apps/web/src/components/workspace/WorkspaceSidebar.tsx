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
    <aside className="clay clay-lavender rounded-panel w-64 md:w-72 flex flex-col h-full select-none p-3.5 border border-lavender-deep/20 shadow-clay flex-shrink-0 overflow-hidden">
      {/* Workspace Switcher Header */}
      <div className="relative mb-3 flex-shrink-0">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="clay clay-paper clay-card p-2.5 flex items-center justify-between cursor-pointer border border-line/10 hover:shadow-clay-sm transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-control bg-primary flex items-center justify-center font-bold text-xs text-white shadow-clay-sm flex-shrink-0">
              RC
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-ink-1 truncate w-32 md:w-36">
                {currentWorkspaceName}
              </span>
              <span className="text-[11px] font-semibold text-ink-3">Workspace</span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-ink-2 transition-transform duration-200 flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Workspace Dropdown */}
        {dropdownOpen && (
          <div className="clay clay-paper clay-card absolute top-full left-0 right-0 mt-2 border border-line/10 shadow-clay p-1.5 z-40 space-y-1">
            <span className="text-[10px] font-bold text-ink-3 px-2 py-1 uppercase tracking-wider block">
              Workspaces
            </span>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onSelectWorkspace?.(ws.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-control transition-all text-left ${
                  ws.id === activeWorkspaceId
                    ? 'clay clay-inset bg-lavender/40 text-primary-deep font-bold'
                    : 'text-ink-1 hover:bg-canvas'
                }`}
              >
                <span className="truncate">{ws.name}</span>
                {ws.id === activeWorkspaceId && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            ))}

            <div className="pt-1 border-t border-line/10">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenCreateWorkspace?.();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-canvas rounded-control transition-all text-left"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pages Navigation */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-3 min-h-0">
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">
              Documents
            </span>
            <button
              onClick={onCreatePage}
              className="p-1 text-ink-2 hover:text-ink-1 hover:bg-paper/70 rounded-control transition-all"
              title="Create page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {pages.map((p) => {
              const isActive = p.id === activePageId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPage?.(p.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-card text-sm transition-all text-left ${
                    isActive
                      ? 'clay clay-paper text-primary-deep font-bold shadow-clay-sm border border-primary/20'
                      : 'text-ink-1 font-semibold hover:bg-paper/50'
                  }`}
                >
                  <span className="text-sm">{p.icon || '📄'}</span>
                  <span className="truncate flex-1">{p.title}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer controls & User profile */}
      <div className="pt-2 border-t border-lavender-deep/20 space-y-1.5 flex-shrink-0">
        <button
          onClick={onOpenMembersModal}
          className="clay clay-paper clay-card p-2.5 flex items-center gap-2.5 text-xs font-bold text-ink-2 hover:text-ink-1 border border-line/10 hover:shadow-clay-sm transition-all w-full text-left"
        >
          <Users className="w-4 h-4 text-ink-3" />
          <span>Members & Roles</span>
        </button>

        {user && (
          <div className="clay clay-paper clay-card p-2 flex items-center justify-between border border-line/10 shadow-clay-sm">
            <div className="flex items-center gap-2 truncate min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-[11px] text-white shadow-clay-sm flex-shrink-0">
                {user.name[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-ink-1 truncate w-28 md:w-32 font-bold">{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-ink-3 hover:text-err transition-all rounded-control flex-shrink-0"
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
