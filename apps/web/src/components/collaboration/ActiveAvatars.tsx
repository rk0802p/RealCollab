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
              className="w-8 h-8 rounded-full border-2 border-paper flex items-center justify-center text-xs font-bold text-white shadow-clay-sm transition-all group-hover:scale-110 group-hover:z-20 relative overflow-hidden"
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
                  className="relative inline-flex rounded-full h-3 w-3 border-2 border-paper"
                  style={{ backgroundColor: collab.color }}
                />
              </span>
            )}

            {/* Rich Hover Card / Tooltip */}
            <div
              className="absolute top-full left-1/2 mt-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none"
              style={{ transform: "translateX(-50%)" }}
            >
              <div className="clay clay-paper clay-card p-2.5 text-ink-1 text-xs border border-line/10 shadow-clay min-w-[140px] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink-1 truncate">{collab.name}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                    style={{
                      backgroundColor: `${collab.color}25`,
                      color: collab.color,
                    }}
                  >
                    {collab.role}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-ink-2 font-medium">
                  <span
                    className="w-2 h-2 rounded-full"
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
        <div className="clay clay-paper w-8 h-8 rounded-full border-2 border-paper flex items-center justify-center text-xs font-bold text-ink-2 shadow-clay-sm">
          +{remaining}
        </div>
      )}
    </div>
  );
}
