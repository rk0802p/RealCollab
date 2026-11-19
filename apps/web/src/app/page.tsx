'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CommentsSidebar } from '@/components/comments/CommentsSidebar';
import { VersionHistorySidebar } from '@/components/history/VersionHistorySidebar';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { ManageMembersModal } from '@/components/workspace/ManageMembersModal';
import { Collaborator, ConnectionStatus, CommentAnchorData } from '@/types';
import { WorkspaceSummary, UserSummary } from '@realcollab/shared';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useComments } from '@/hooks/useComments';
import { useVersionHistory } from '@/hooks/useVersionHistory';

export default function WorkspacePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [activePageId, setActivePageId] = useState<string>('');
  const [activePageDetails, setActivePageDetails] = useState<any>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [createWsOpen, setCreateWsOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingAnchor, setPendingAnchor] = useState<CommentAnchorData | null>(null);
  const [anchorToFocus, setAnchorToFocus] = useState<CommentAnchorData | null>(null);

  // Real-time Comments hook for active page
  const {
    comments,
    activeComments,
    activeCommentId,
    setActiveCommentId,
    filter: commentsFilter,
    setFilter: setCommentsFilter,
    addComment,
    updateComment,
    deleteComment,
    addReply,
    toggleResolve,
  } = useComments({
    pageId: activePageId || null,
  });

  // Version History & Snapshots hook for active page
  const {
    snapshots,
    previewingSnapshot,
    previewContent,
    createNamedSnapshot,
    previewSnapshot,
    exitPreview,
    restoreSnapshot,
  } = useVersionHistory({
    pageId: activePageId || null,
  });

  // Load active user and workspaces on mount
  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const { user, token } = await authRes.json();
        setCurrentUser(user);
        if (token) setAuthToken(token);

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
    token: authToken,
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-canvas text-ink-1">
        <div className="clay clay-paper clay-card p-8 flex flex-col items-center gap-4 text-center border border-line/10 shadow-clay">
          <div className="w-10 h-10 border-4 border-primary border-t-lavender rounded-full animate-spin" />
          <span className="text-xs font-bold text-ink-2">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink-1 p-3 md:p-4 gap-3 md:gap-4 select-none">
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
      <div className="flex-1 flex flex-col min-w-0 h-full gap-3 md:gap-4 relative overflow-hidden">
        <WorkspaceHeader
          pageTitle={activePage.title}
          icon={activePage.icon}
          collaborators={activeCollaborators}
          connectionStatus={wsStatus}
          role={currentWorkspace?.currentUserRole || 'EDITOR'}
          onShare={() => setMembersModalOpen(true)}
        />

        <div className="flex-1 flex overflow-hidden relative gap-3 md:gap-4 min-h-0">
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
            onOpenComments={() => {
              setCommentsOpen(!commentsOpen);
              if (historyOpen) setHistoryOpen(false);
            }}
            onOpenHistory={() => {
              setHistoryOpen(!historyOpen);
              if (commentsOpen) setCommentsOpen(false);
            }}
            isHistoryPreviewing={Boolean(previewingSnapshot)}
            historyPreviewContent={previewContent}
            historyPreviewTitle={previewingSnapshot?.description}
            onExitHistoryPreview={exitPreview}
            onRestoreHistoryPreview={() => {
              if (previewingSnapshot) restoreSnapshot(previewingSnapshot.id);
            }}
            commentsCount={activeComments.length}
            comments={comments}
            activeCommentId={activeCommentId}
            onCommentClick={(id) => {
              setActiveCommentId(id);
              setCommentsOpen(true);
              setHistoryOpen(false);
            }}
            onAddCommentToSelection={(anchor) => {
              setPendingAnchor(anchor);
              setCommentsOpen(true);
              setHistoryOpen(false);
            }}
            anchorToFocus={anchorToFocus}
          />

          <CommentsSidebar
            isOpen={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            comments={comments}
            activeCommentId={activeCommentId}
            onSelectComment={setActiveCommentId}
            filter={commentsFilter}
            onFilterChange={setCommentsFilter}
            pendingAnchor={pendingAnchor}
            onClearPendingAnchor={() => setPendingAnchor(null)}
            onAddComment={addComment}
            onAddReply={addReply}
            onToggleResolve={toggleResolve}
            onDeleteComment={deleteComment}
            onUpdateComment={updateComment}
            onScrollToAnchor={(anchor) => setAnchorToFocus(anchor)}
            currentUser={currentUser}
            userRole={currentWorkspace?.currentUserRole}
          />

          <VersionHistorySidebar
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            snapshots={snapshots}
            previewingSnapshot={previewingSnapshot}
            onPreviewSnapshot={previewSnapshot}
            onExitPreview={exitPreview}
            onRestoreSnapshot={restoreSnapshot}
            onCreateCheckpoint={createNamedSnapshot}
            userRole={currentWorkspace?.currentUserRole}
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
