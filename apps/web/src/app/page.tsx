'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { ManageMembersModal } from '@/components/workspace/ManageMembersModal';
import { Collaborator, ConnectionStatus } from '@/types';
import { WorkspaceSummary, UserSummary } from '@realcollab/shared';
import { useCollaboration } from '@/hooks/useCollaboration';

export default function WorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [activePageId, setActivePageId] = useState<string>('');
  const [activePageDetails, setActivePageDetails] = useState<any>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
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
          } else {
            setActivePageId('');
            setActivePageDetails(null);
          }
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
      }
    }
    loadWorkspaceDetails();
  }, [activeWorkspaceId]);

  // Load active page details (content, icon, permissions) when activePageId changes
  useEffect(() => {
    if (!activePageId) return;

    async function loadPage() {
      try {
        const res = await fetch(`/api/pages/${activePageId}`);
        if (res.ok) {
          const data = await res.json();
          setActivePageDetails(data.page);
        }
      } catch (err) {
        console.error('Error loading page details:', err);
      }
    }
    loadPage();
  }, [activePageId]);

  // Real-time Yjs Collaboration & Awareness hook
  const {
    ydoc,
    provider,
    status: wsStatus,
    collaborators: liveCollaborators,
    typingUsers,
    userColor,
    setLocalTyping,
  } = useCollaboration({
    workspaceId: activeWorkspaceId,
    pageId: activePageId,
    user: currentUser,
    userRole: currentWorkspace?.currentUserRole,
  });

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
        body: JSON.stringify({ title: 'Untitled Document', icon: '📝' }),
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
        setActivePageDetails(page);
      }
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  };

  const handleSavePage = useCallback(
    async (pageId: string, data: { title?: string; content?: string }) => {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save document');
      }

      const { page } = await res.json();
      setActivePageDetails((prev: any) => ({ ...prev, ...page }));

      // Update title in sidebar list
      if (data.title && currentWorkspace) {
        setCurrentWorkspace((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            pages: (prev.pages || []).map((p: any) =>
              p.id === pageId ? { ...p, title: data.title } : p
            ),
          };
        });
      }
    },
    [currentWorkspace]
  );

  const activePage = activePageDetails || currentWorkspace?.pages?.find((p: any) => p.id === activePageId) || {
    id: activePageId || 'default',
    title: 'Collaborative Document',
    icon: '📝',
    content: null,
  };

  // Convert workspace members to fallback collaborator presence badges if no live websocket peers
  const fallbackCollaborators: Collaborator[] = (currentWorkspace?.members || []).map((m: any, idx: number) => ({
    clientId: idx + 1,
    name: m.user.name,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][idx % 4],
    role: m.role,
  }));

  const activeCollaborators = liveCollaborators.length > 0 ? liveCollaborators : fallbackCollaborators;

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

      {/* Main editor and canvas area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <WorkspaceHeader
          pageTitle={activePage.title}
          icon={activePage.icon}
          collaborators={activeCollaborators}
          connectionStatus={wsStatus}
          role={currentWorkspace?.currentUserRole || 'EDITOR'}
          onShare={() => setMembersModalOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <RichTextEditor
            key={`${activePageId}-${activeWorkspaceId}`}
            pageId={activePageId}
            initialTitle={activePage.title}
            initialIcon={activePage.icon}
            initialContent={activePage.content}
            ydoc={ydoc}
            provider={provider}
            userRole={currentWorkspace?.currentUserRole}
            user={currentUser ? { name: currentUser.name, color: userColor } : null}
            typingUsers={typingUsers}
            onTyping={setLocalTyping}
            onSave={handleSavePage}
            onOpenComments={() => setCommentsOpen(!commentsOpen)}
            onOpenHistory={() => alert('Version history: will be connected in Phase 7.')}
            commentsCount={0}
          />

          <CommentsSidebar
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            onAddComment={(text) => alert(`Comment thread created: "${text}"`)}
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
