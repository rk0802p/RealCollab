'use client';

import { useEffect, useState, useMemo } from 'react';
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
}

export function useCollaboration({
  workspaceId = 'default',
  pageId,
  user,
  userRole = 'EDITOR',
}: UseCollaborationOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isSynced, setIsSynced] = useState(false);

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

    const wsUrl = process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234';
    const roomName = `workspace:${workspaceId}:page:${pageId}`;

    const doc = new Y.Doc();
    const prov = new WebsocketProvider(wsUrl, roomName, doc, {
      connect: true,
    });

    // Set local presence awareness
    prov.awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous User',
      color: userColor,
      avatar: user?.avatarUrl || undefined,
      role: userRole,
      userId: user?.id,
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
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#3B82F6',
            avatar: state.user.avatar,
            role: state.user.role || 'EDITOR',
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
  }, [workspaceId, pageId, user?.id, user?.name, user?.avatarUrl, userRole, userColor]);

  return {
    ydoc: collabInstances?.ydoc || null,
    provider: collabInstances?.provider || null,
    status,
    collaborators,
    isSynced,
    userColor,
  };
}
