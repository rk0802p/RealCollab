import React from 'react';
import { Collaborator } from '@/types';

interface ActiveAvatarsProps {
  collaborators: Collaborator[];
}

export function ActiveAvatars({ collaborators }: ActiveAvatarsProps) {
  const maxVisible = 4;
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
            title={`${collab.name} (${collab.role})`}
            className="relative group cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-semibold text-white shadow-sm transition-transform hover:scale-110 hover:z-10"
              style={{ backgroundColor: collab.color }}
            >
              {collab.avatar ? (
                <img
                  src={collab.avatar}
                  alt={collab.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30">
              <span className="bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                {collab.name} <span className="text-slate-400">({collab.role})</span>
              </span>
            </div>
          </div>
        );
      })}

      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-card flex items-center justify-center text-xs font-medium text-slate-300">
          +{remaining}
        </div>
      )}
    </div>
  );
}
