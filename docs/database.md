# RealCollab — Database Schema & Data Modeling

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    USER ||--o{ WORKSPACE : "owns"
    USER ||--o{ WORKSPACEMEMBER : "belongs to"
    USER ||--o{ COMMENT : "writes"
    USER ||--o{ COMMENTREPLY : "authors"
    USER ||--o{ DOCUMENTSNAPSHOT : "creates"
    USER ||--o{ INVITATION : "issues"

    WORKSPACE ||--o{ WORKSPACEMEMBER : "contains"
    WORKSPACE ||--o{ PAGE : "contains"
    WORKSPACE ||--o{ INVITATION : "issues"

    PAGE ||--o{ PAGE : "parent of"
    PAGE ||--o{ DOCUMENTUPDATE : "stores updates"
    PAGE ||--o{ DOCUMENTSNAPSHOT : "has snapshots"
    PAGE ||--o{ COMMENT : "has comments"

    COMMENT ||--o{ COMMENTREPLY : "has replies"

    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    WORKSPACE {
        string id PK
        string name
        string description
        string ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    WORKSPACEMEMBER {
        string id PK
        string workspaceId FK
        string userId FK
        enum role "OWNER | EDITOR | COMMENTER | VIEWER"
        datetime joinedAt
    }

    PAGE {
        string id PK
        string workspaceId FK
        string parentId FK
        string title
        string icon
        string coverImage
        boolean isArchived
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    DOCUMENTUPDATE {
        string id PK
        string pageId FK
        bytes updateBytes "Binary Y.Update delta"
        datetime createdAt
    }

    DOCUMENTSNAPSHOT {
        string id PK
        string pageId FK
        bytes snapshotBytes "Compacted Y.encodeStateAsUpdate"
        string createdById FK
        string description
        datetime createdAt
    }

    COMMENT {
        string id PK
        string pageId FK
        string authorId FK
        string content
        json anchorData "Relative Yjs anchor & selection preview"
        boolean resolved
        datetime createdAt
        datetime updatedAt
    }

    COMMENTREPLY {
        string id PK
        string commentId FK
        string authorId FK
        string content
        datetime createdAt
        datetime updatedAt
    }

    INVITATION {
        string id PK
        string workspaceId FK
        string email
        enum role "EDITOR | COMMENTER | VIEWER"
        string tokenHash UK
        string inviterId FK
        datetime expiresAt
        datetime createdAt
    }
```

---

## 2. Models & Field Specifications

### 2.1 User
Represents authenticated identities.
- `id`: CUID or UUID string.
- `email`: Normalized unique email address.
- `passwordHash`: Argon2id or bcrypt hash (never plaintext).
- `name`: Display name.
- `avatarUrl`: Optional link to user avatar.
- `createdAt` / `updatedAt`: Standard audit timestamps.

### 2.2 Workspace & WorkspaceMember
Provides organizational tenant boundary.
- A user can own multiple workspaces and belong to many workspaces.
- Roles are strictly per-workspace (`OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`).
- Unique compound constraint on `(workspaceId, userId)`.

### 2.3 Page
Hierarchical document node in a workspace.
- `parentId`: Nullable self-reference allowing nested sub-pages.
- `workspaceId`: Foreign key to `Workspace` (cascades on delete).
- `title`: Page header title (default: "Untitled").
- `isArchived`: Soft-delete flag.

### 2.4 DocumentUpdate & DocumentSnapshot (Yjs CRDT Storage)
- **`DocumentUpdate`**: Stores incremental binary operations (`Bytes`).
  - Inserted by the collaboration server in debounced batches.
  - Indexed by `pageId` and `createdAt` for fast chronological replay.
- **`DocumentSnapshot`**: Compacted historical checkpoints.
  - Contains complete document state encoded via `Y.encodeStateAsUpdate(ydoc)`.
  - Enables version preview, rollback, and pruning of historic individual updates.

### 2.5 Comment & CommentReply
Threaded discussions attached to documents.
- `anchorData`: Stored as JSON with Yjs RelativePosition representation (`{ from: ..., to: ..., quote: "..." }`).
- `resolved`: Boolean flag for thread closure.
- `CommentReply`: Threaded responses ordered chronologically.

### 2.6 Invitation
Time-bounded workspace invite tokens.
- Securely hashed tokens (`tokenHash`).
- Automatic expiration checking (`expiresAt`).

---

## 3. Indexes & Performance Optimization

```prisma
// Sample indexing strategy in schema.prisma:
@@index([workspaceId])
@@index([pageId, createdAt])
@@index([email])
@@unique([workspaceId, userId])
```
1. Fast lookups of all pages for a workspace.
2. Fast sequential loading of binary document updates for a page room.
3. Fast membership role queries upon WebSocket handshake.
