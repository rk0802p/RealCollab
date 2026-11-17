'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { ManageMembersModal } from '@/components/workspace/ManageMembersModal';
import { Collaborator, ConnectionStatus } from '@/types';
import { WorkspaceRole, WorkspaceSummary, UserSummary } from '@realcollab/shared';

export default function WorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [activePageId, setActivePageId] = useState<string>('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [loading, setLoading] = useState(true);

  // Load active user and workspaces on mount
  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const { user } = await authRes.json();
        setCurrentUser(user);

        const wsRes = await fetch('/api/workspaces');
        if (wsRes.ok) {
          const { workspaces } = await wsRes.json();
          setWorkspaces(workspaces);
          if (workspaces.length > 0) {
            setActiveWorkspaceId(workspaces[0].id);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // Load workspace details when activeWorkspaceId changes
  useEffect(() => {
    if (!activeWorkspaceId) return;

    async function loadWorkspaceDetails() {
      try {
        const res = await fetch(`/api/workspaces/${activeWorkspaceId}`);
        if (res.ok) {
          const { workspace } = await res.json();
          setCurrentWorkspace(workspace);
          if (workspace.pages?.length > 0) {
            setActivePageId(workspace.pages[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
      }
    }
    loadWorkspaceDetails();
  }, [activeWorkspaceId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreatePage = async () => {
    if (!activeWorkspaceId) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Collaborative Page', icon: '📄' }),
      });
      if (res.ok) {
        const { page } = await res.json();
        if (currentWorkspace) {
          setCurrentWorkspace({
            ...currentWorkspace,
            pages: [...(currentWorkspace.pages || []), page],
          });
        }
        setActivePageId(page.id);
      }
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  };

  const activePage = currentWorkspace?.pages?.find((p: any) => p.id === activePageId) || {
    id: 'default',
    title: 'Collaborative Document',
    icon: '📝',
  };

  // Convert workspace members to collaborator badges
  const collaborators: Collaborator[] = (currentWorkspace?.members || []).map((m: any, idx: number) => ({
    clientId: idx + 1,
    name: m.user.name,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][idx % 4],
    role: m.role,
  }));

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-slate-400">
        <div className="w-8 h-8 rounded-full border-b-2 border-brand-500 animate-spin mb-3" />
        <span className="text-xs">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar
        currentWorkspaceName={currentWorkspace?.name || 'Workspace'}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        pages={currentWorkspace?.pages || []}
        activePageId={activePageId}
        user={currentUser}
        onSelectPage={setActivePageId}
        onCreatePage={handleCreatePage}
        onSelectWorkspace={setActiveWorkspaceId}
        onOpenCreateWorkspace={() => setCreateWsOpen(true)}
        onOpenMembersModal={() => setMembersModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main editor and collaboration area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <WorkspaceHeader
          pageTitle={activePage.title}
          icon={activePage.icon}
          collaborators={collaborators}
          connectionStatus={connectionStatus}
          role={currentWorkspace?.currentUserRole || 'EDITOR'}
          onShare={() => setMembersModalOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <RichTextEditor
            pageId={activePageId}
            onOpenComments={() => setCommentsOpen(!commentsOpen)}
            onOpenHistory={() => alert('Version history: loaded in Phase 7.')}
            commentsCount={0}
          />

          <CommentsSidebar
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            onAddComment={(text) => alert(`Added comment: "${text}"`)}
            onResolveComment={(id) => alert(`Toggled resolved for comment ${id}`)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={createWsOpen}
        onClose={() => setCreateWsOpen(false)}
        onCreated={(newWs) => {
          setWorkspaces([...workspaces, { ...newWs, role: 'OWNER' }]);
          setActiveWorkspaceId(newWs.id);
        }}
      />

      <ManageMembersModal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        workspaceId={activeWorkspaceId}
        members={currentWorkspace?.members || []}
        currentUserRole={currentWorkspace?.currentUserRole}
        onMemberUpdated={async () => {
          if (!activeWorkspaceId) return;
          const res = await fetch(`/api/workspaces/${activeWorkspaceId}`);
          if (res.ok) {
            const { workspace } = await res.json();
            setCurrentWorkspace(workspace);
          }
        }}
      />
    </div>
  );
}
