import React from 'react';
import { ActiveAvatars } from '../collaboration/ActiveAvatars';
import { ConnectionIndicator } from '../collaboration/ConnectionIndicator';
import { Collaborator, ConnectionStatus } from '@/types';
import { Share2, Lock } from 'lucide-react';

interface WorkspaceHeaderProps {
  pageTitle: string;
  icon?: string;
  collaborators: Collaborator[];
  connectionStatus: ConnectionStatus;
  role?: string;
  onShare?: () => void;
}

export function WorkspaceHeader({
  pageTitle,
  icon = '📝',
  collaborators,
  connectionStatus,
  role = 'OWNER',
  onShare,
}: WorkspaceHeaderProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-surface/50 backdrop-blur px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h1 className="font-semibold text-base text-slate-100">{pageTitle}</h1>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-400 font-mono">
          <Lock className="w-3 h-3" />
          <span>{role}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Presence & synchronization indicators */}
        <ActiveAvatars collaborators={collaborators} />
        <ConnectionIndicator status={connectionStatus} />

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-md text-xs font-medium shadow-sm transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}
