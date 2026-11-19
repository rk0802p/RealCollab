import React from 'react';
import { ConnectionStatus } from '@/types';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const config = {
    connected: {
      color: 'bg-emerald-500',
      text: 'Synchronized',
      ping: 'bg-emerald-400',
    },
    connecting: {
      color: 'bg-amber-500',
      text: 'Connecting...',
      ping: 'bg-amber-400',
    },
    disconnected: {
      color: 'bg-rose-500',
      text: 'Offline (Buffered)',
      ping: 'bg-rose-400',
    },
    error: {
      color: 'bg-rose-600',
      text: 'Connection error',
      ping: 'bg-rose-400',
    },
  }[status];

  return (
    <div className="clay clay-paper rounded-full px-3 py-1 flex items-center gap-2 text-xs font-semibold text-ink-2 shadow-clay-sm border border-line/10">
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      <span>{config.text}</span>
    </div>
  );
}
