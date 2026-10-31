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
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface text-xs font-medium text-slate-300 border border-slate-800">
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
