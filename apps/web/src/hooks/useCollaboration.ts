'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Collaborator, ConnectionStatus } from '@/types';
import { generateUserColor } from '@/lib/utils';

interface UseCollaborationOptions {
  workspaceId?: string;
  pageId?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  userRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  token?: string | null;
}

export function useCollaboration({
  workspaceId = 'default',
  pageId,
  user,
  userRole = 'EDITOR',
  token,
}: UseCollaborationOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userColor = useMemo(() => {
    return user ? generateUserColor(user.id || user.name) : '#3B82F6';
  }, [user]);

  // Create stable instances of Y.Doc and WebsocketProvider
  const [collabInstances, setCollabInstances] = useState<{
    ydoc: Y.Doc;
    provider: WebsocketProvider;
  } | null>(null);

  useEffect(() => {
    if (!pageId) {
      setCollabInstances(null);
      return;
    }

    let wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234';
    // If frontend is running over HTTPS, ensure secure wss protocol
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsUrl.startsWith('ws://') && !wsUrl.includes('localhost')) {
      wsUrl = wsUrl.replace(/^ws:/, 'wss:');
    }

    const roomName = `workspace:${workspaceId}:page:${pageId}`;

    const doc = new Y.Doc();
    const prov = new WebsocketProvider(wsUrl, roomName, doc, {
      connect: true,
      params: token ? { token } : {},
    });

    // Set local presence awareness
    prov.awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous User',
      color: userColor,
      avatar: user?.avatarUrl || undefined,
      role: userRole,
      userId: user?.id,
      isTyping: false,
      lastActive: Date.now(),
    });

    const handleStatus = ({ status }: { status: string }) => {
      if (status === 'connected') setStatus('connected');
      else if (status === 'connecting') setStatus('connecting');
      else setStatus('disconnected');
    };

    const handleSync = (synced: boolean) => {
      setIsSynced(synced);
    };

    const handleAwareness = () => {
      const states = prov.awareness.getStates();
      const active: Collaborator[] = [];
      states.forEach((state, clientId) => {
        if (state.user) {
          active.push({
            clientId,
            userId: state.user.userId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#3B82F6',
            avatar: state.user.avatar,
            role: state.user.role || 'EDITOR',
            isTyping: Boolean(state.user.isTyping),
            lastActive: state.user.lastActive,
          });
        }
      });
      setCollaborators(active);
    };

    prov.on('status', handleStatus);
    prov.on('sync', handleSync);
    prov.awareness.on('change', handleAwareness);

    setCollabInstances({ ydoc: doc, provider: prov });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      prov.off('status', handleStatus);
      prov.off('sync', handleSync);
      prov.awareness.off('change', handleAwareness);
      prov.disconnect();
      prov.destroy();
      doc.destroy();
      setCollabInstances(null);
      setIsSynced(false);
      setStatus('disconnected');
    };
  }, [workspaceId, pageId, user?.id, user?.name, user?.avatarUrl, userRole, userColor, token]);

  // Set typing indicator with auto-reset after 1.5 seconds of inactivity
  const setLocalTyping = useCallback(
    (isTyping: boolean) => {
      if (!collabInstances?.provider) return;
      const awareness = collabInstances.provider.awareness;
      const current = awareness.getLocalState()?.user || {};

      awareness.setLocalStateField('user', {
        ...current,
        isTyping,
        lastActive: Date.now(),
      });

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          const fresh = awareness.getLocalState()?.user || {};
          awareness.setLocalStateField('user', {
            ...fresh,
            isTyping: false,
            lastActive: Date.now(),
          });
        }, 1500);
      }
    },
    [collabInstances]
  );

  // List of other users who are currently typing
  const typingUsers = useMemo(() => {
    if (!collabInstances?.provider) return [];
    const myClientId = collabInstances.provider.awareness.clientID;
    return collaborators
      .filter((c) => c.clientId !== myClientId && c.isTyping)
      .map((c) => c.name);
  }, [collaborators, collabInstances]);

  return {
    ydoc: collabInstances?.ydoc || null,
    provider: collabInstances?.provider || null,
    status,
    collaborators,
    typingUsers,
    isSynced,
    userColor,
    setLocalTyping,
  };
}
