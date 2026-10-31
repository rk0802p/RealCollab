'use client';

import React, { useState } from 'react';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { Collaborator, ConnectionStatus } from '@/types';

export default function WorkspacePage() {
  const [activePageId, setActivePageId] = useState('page-1');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  // Simulated active online collaborators
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      clientId: 1,
      name: 'Alice Johnson',
      color: '#3B82F6',
      role: 'OWNER',
    },
    {
      clientId: 2,
      name: 'Bob Smith',
      color: '#10B981',
      role: 'EDITOR',
    },
    {
      clientId: 3,
      name: 'Charlie Brown',
      color: '#F59E0B',
      role: 'COMMENTER',
    },
  ]);

  const [pages, setPages] = useState([
    { id: 'page-1', title: 'Product Architecture Spec', icon: '📝' },
    { id: 'page-2', title: 'CRDT & Yjs Synchronization', icon: '⚡' },
    { id: 'page-3', title: 'Redis Pub/Sub Scaling', icon: '📡' },
    { id: 'page-4', title: 'Security & RBAC Matrix', icon: '🛡️' },
  ]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handleCreatePage = () => {
    const newId = `page-${pages.length + 1}`;
    const newPage = {
      id: newId,
      title: 'New Collaborative Document',
      icon: '📄',
    };
    setPages([...pages, newPage]);
    setActivePageId(newId);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Workspace left navigation */}
      <WorkspaceSidebar
        currentWorkspaceName="Engineering Hub"
        pages={pages}
        activePageId={activePageId}
        onSelectPage={setActivePageId}
        onCreatePage={handleCreatePage}
      />

      {/* Main editor and collaboration area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <WorkspaceHeader
          pageTitle={activePage.title}
          icon={activePage.icon}
          collaborators={collaborators}
          connectionStatus={connectionStatus}
          role="OWNER"
          onShare={() => alert('Share dialog: invite team members with Editor/Commenter/Viewer roles.')}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <RichTextEditor
            pageId={activePageId}
            onOpenComments={() => setCommentsOpen(!commentsOpen)}
            onOpenHistory={() => alert('Version history: loading snapshots from database...')}
            commentsCount={1}
          />

          <CommentsSidebar
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            onAddComment={(text) => alert(`Added comment: "${text}"`)}
            onResolveComment={(id) => alert(`Toggled resolved status for comment ${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
