'use client';

import React from 'react';
import { Collaborator } from '@/types';

interface ActiveAvatarsProps {
  collaborators: Collaborator[];
}

export function ActiveAvatars({ collaborators }: ActiveAvatarsProps) {
  const maxVisible = 5;
  const visible = collaborators.slice(0, maxVisible);
  const remaining = Math.max(0, collaborators.length - maxVisible);

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((collab) => {
        const initials = collab.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={collab.clientId}
            className="relative group cursor-pointer"
          >
            {/* Avatar Circle */}
            <div
              className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-semibold text-white shadow-md transition-all group-hover:scale-110 group-hover:z-20 relative overflow-hidden"
              style={{ backgroundColor: collab.color }}
            >
              {collab.avatar ? (
                <img
                  src={collab.avatar}
                  alt={collab.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Live Typing Pulse Indicator */}
            {collab.isTyping && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 z-30">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: collab.color }}
                />
                <span
                  className="relative inline-flex rounded-full h-3 w-3 border-2 border-surface"
                  style={{ backgroundColor: collab.color }}
                />
              </span>
            )}

            {/* Rich Hover Card / Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none">
              <div className="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg shadow-2xl min-w-[140px] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100 truncate">{collab.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium"
                    style={{
                      backgroundColor: `${collab.color}25`,
                      color: collab.color,
                    }}
                  >
                    {collab.role}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: collab.color }}
                  />
                  <span>{collab.isTyping ? 'Typing now...' : 'Active in document'}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-card flex items-center justify-center text-xs font-semibold text-slate-300 shadow-md">
          +{remaining}
        </div>
      )}
    </div>
  );
}
