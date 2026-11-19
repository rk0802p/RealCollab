import React from 'react';
import { ActiveAvatars } from '../collaboration/ActiveAvatars';
import { ConnectionIndicator } from '../collaboration/ConnectionIndicator';
import { Collaborator, ConnectionStatus } from '@/types';
import { Share2, Lock } from 'lucide-react';
import { Button } from '@/components/ui';

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
    <header className="clay clay-butter rounded-tile px-5 py-3 flex items-center justify-between gap-4 border border-butter-deep/25 shadow-clay-sm select-none">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <h1 className="font-bold text-base text-ink-1 truncate">{pageTitle}</h1>
        <div className="clay clay-paper rounded-full px-2.5 py-0.5 flex items-center gap-1.5 text-[11px] font-mono font-bold text-ink-2 shadow-clay-sm border border-line/10 flex-shrink-0">
          <Lock className="w-3 h-3 text-ink-3" />
          <span>{role}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Presence & synchronization indicators */}
        <ActiveAvatars collaborators={collaborators} />
        <ConnectionIndicator status={connectionStatus} />

        <Button
          variant="primary"
          size="sm"
          onClick={onShare}
          className="gap-1.5 text-xs font-bold"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>
      </div>
    </header>
  );
}
