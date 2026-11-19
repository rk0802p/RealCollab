# RealCollab — Real-Time Collaborative Workspace (FS-02)

> **FS-02 Problem Statement**: Build a high-performance, real-time multiplayer document workspace inspired by Notion and Figma's collaboration layer. Built with Next.js 14, TipTap, Yjs (CRDT), WebSockets, PostgreSQL, Prisma ORM, and Redis Pub/Sub.

[![Live Demo](https://img.shields.io/badge/Production-Live%20Demo-success?style=for-the-badge&logo=vercel)](https://realcollab-livid.vercel.app)
[![Collab Server](https://img.shields.io/badge/Render-WebSocket%20Server-blue?style=for-the-badge&logo=render)](https://realcollab-pl3z.onrender.com/health)
[![Test Suite](https://img.shields.io/badge/Vitest-52%2F52%20Passing-brightgreen?style=for-the-badge&logo=vitest)](https://github.com/rk0802p/RealCollab)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](#-license)

---

## 🌐 Live Deployments

- **Web Application (Vercel)**: [https://realcollab-livid.vercel.app](https://realcollab-livid.vercel.app)
- **Collaboration Server (Render)**: [wss://realcollab-pl3z.onrender.com](https://realcollab-pl3z.onrender.com)
  - Server Health Check: [https://realcollab-pl3z.onrender.com/health](https://realcollab-pl3z.onrender.com/health)

---

## 📸 Product Screenshots & Visual Tour

All high-resolution production captures are stored under the [`screenshots/`](./screenshots) directory:

| Feature | Screenshot |
| :--- | :--- |
| **01. Authentication & Security**<br>Bento/Claymorphic secure login portal with session handling and rate limiting. | ![Login](./screenshots/01-auth-login.png) |
| **02. User Registration**<br>New user onboarding with automatic personal workspace provisioning. | ![Signup](./screenshots/02-auth-signup.png) |
| **03. Collaborative Workspace & Editor**<br>TipTap editor, slash commands (`/`), task checklist, and real-time multiplayer presence. | ![Editor](./screenshots/03-workspace-editor.png) |
| **04. Version History & Checkpoints**<br>Chronological document snapshots with read-only preview and non-destructive restore. | ![History](./screenshots/04-version-history.png) |
| **05. Inline Anchored Comments**<br>Selection-anchored highlights with threaded discussions, replies, and resolution workflow. | ![Comments](./screenshots/05-threaded-comments.png) |
| **06. Cryptographic Workspace Sharing**<br>Role-based invitations (OWNER, EDITOR, COMMENTER, VIEWER) with 7-day secure tokens. | ![Share](./screenshots/06-manage-members-modal.png) |

---

## 🏛️ System Architecture

RealCollab utilizes a decoupled architecture separating the **stateless presentation/API layer** from the **stateful, long-lived multiplayer collaboration daemon**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                    Client Browser Window                    │
 │   ┌───────────────────────┐     ┌───────────────────────┐   │
 │   │  Next.js 14 Frontend  │     │   TipTap Rich Editor  │   │
 │   │  App Router & React   │     │   (y-prosemirror)     │   │
 │   └──────────┬────────────┘     └───────────┬───────────┘   │
 └──────────────┼──────────────────────────────┼───────────────┘
                │ HTTPS (REST & SSR)           │ WSS (Binary Yjs CRDT)
                ▼                              ▼
 ┌───────────────────────────┐    ┌────────────────────────────┐
 │  Vercel Edge & Serverless │    │  Render Collaboration Host │
 │  Next.js App Router       │    │  y-websocket + ws Server   │
 │  - /api/auth/*            │    │  - Room Management         │
 │  - /api/workspaces/*      │    │  - JWT Connection Auth     │
 │  - /api/pages/*           │    │  - Yjs CRDT Convergence   │
 │  - /api/comments/*        │    │  - Ephemeral Awareness     │
 │  - /api/snapshots/*       │    │  - Debounced Persistence   │
 └──────────────┬────────────┘    └────────────┬───────────────┘
                │                              │
                │ Prisma Client                │ Binary Delta Persistence
                ▼                              ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                PostgreSQL Relational Database               │
 │  Users | Workspaces | Pages | Comments | Snapshots | Updates│
 └──────────────────────────────┬──────────────────────────────┘
                                │ Redis Pub/Sub (Multi-Node Sync)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   Redis In-Memory Bus                       │
 └─────────────────────────────────────────────────────────────┘
```

### Architectural Highlights

1. **Conflict-Free Replicated Data Types (CRDTs)**:
   - Uses `Yjs` binary encoding (lib0 protocol) to mathematically guarantee eventual consistency across concurrent edits.
   - Overlapping edits inside identical paragraphs merge deterministically without locks or data loss.

2. **Stateless vs. Stateful Separation**:
   - Next.js handles user authentication, workspace hierarchy, comments, and permissions.
   - A dedicated Node.js service maintains in-memory active document rooms and broadcasts delta updates over persistent WebSocket channels.

3. **Ephemeral Awareness vs. Persistent State**:
   - Caret positions, selection ranges, user presence avatars, and typing indicators are distributed via Yjs Awareness protocol.
   - Ephemeral presence state never touches or bloats the database.

4. **Dual Write-Path Persistence**:
   - High-frequency keystrokes are batched and written to `DocumentUpdate` binary rows with a 400ms debounce.
   - Milestone checkpoints are compressed into `DocumentSnapshot` blobs for fast cold starts and version history rollbacks.

5. **Cross-Origin Authentication**:
   - WebSockets connect cross-domain (Vercel to Render) using signed JSON Web Tokens (`HS256`) passed in connection parameters, preventing cross-site cookie blocking.

---

## 📁 Repository Structure

```
RealCollab/
├── apps/
│   ├── web/                        # Next.js 14 App Router Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router pages and API routes
│   │   │   ├── components/         # Claymorphic + Bento UI modules
│   │   │   │   ├── collaboration/  # Presence avatars & connection indicators
│   │   │   │   ├── comments/       # Threaded discussion sidebar
│   │   │   │   ├── editor/         # TipTap editor, toolbar, slash commands
│   │   │   │   ├── history/        # Version history & rollback sidebar
│   │   │   │   ├── ui/             # Claymorphism design primitives
│   │   │   │   └── workspace/      # Sidebar, header, invite modals
│   │   │   ├── hooks/              # useCollaboration, useVersionHistory
│   │   │   ├── lib/                # JWT auth, rate limiting, sanitization
│   │   │   └── types/              # TypeScript interface definitions
│   │   └── package.json
│   │
│   └── collaboration-server/       # Long-Lived WebSocket Daemon
│       ├── src/
│       │   ├── server.ts           # Express + WebSocket HTTP Upgrade server
│       │   ├── auth/               # JWT token handshake & workspace guard
│       │   ├── middleware/         # URL parser & room connection guard
│       │   ├── persistence/        # Binary update batching & snapshotting
│       │   └── redis/              # Multi-instance Pub/Sub horizontal scale
│       └── package.json
│
├── packages/
│   └── shared/                     # Monorepo Shared Package
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema definition
│       │   └── seed.ts             # Demo data generator
│       ├── src/
│       │   ├── index.ts            # Permissions & RBAC matrix
│       │   └── permissions.ts      # Permission evaluation helpers
│       └── package.json
│
├── screenshots/                    # High-Resolution Product Screenshots
│   ├── 01-auth-login.png
│   ├── 02-auth-signup.png
│   ├── 03-workspace-editor.png
│   ├── 04-version-history.png
│   ├── 05-threaded-comments.png
│   └── 06-manage-members-modal.png
│
├── scripts/                        # Automated Verification & Test Scripts
│   ├── verify-full-system.mjs      # 10-step full system regression runner
│   ├── verify-phase4.mjs           # Yjs CRDT concurrency verification
│   ├── verify-phase5.mjs           # Live presence & cursor tracking test
│   ├── verify-phase6.mjs           # Anchored comments & discussion test
│   ├── verify-phase7.mjs           # Snapshot & non-destructive rollback test
│   ├── verify-phase8.mjs           # Security, invitations & RBAC test
│   ├── capture-screenshots.mjs     # Automated Playwright screenshot script
│   └── local-pg.ps1                # Local PostgreSQL daemon helper
│
├── docs/                           # Architecture Specifications
│   ├── architecture.md             # Topology & data flow specification
│   ├── database.md                 # Database schema documentation
│   ├── api.md                      # REST & WebSocket protocol documentation
│   └── testing.md                  # Verification methodology
│
├── docker-compose.yml              # PostgreSQL 16 & Redis 7 local services
├── .env.example                    # Environment variable template
├── vercel.json                     # Vercel deployment build definition
├── package.json                    # Monorepo root workspaces configuration
└── README.md                       # Master Documentation
```

---

## ⚡ Feature Breakdown

### 1. TipTap Rich-Text Editor & Formatting
- **Block Types**: Headings (H1, H2, H3), bulleted lists, numbered lists, task checklists with checkboxes, blockquotes, and code blocks.
- **Inline Styling**: Bold, italic, strikethrough, inline code, and hyperlinks.
- **Slash Commands Menu**: Typing `/` triggers a contextual floating command menu for rapid block insertion.
- **Floating Bubble Menu**: Text selection brings up immediate text formatting controls.
- **Autosave Engine**: Active edits are debounced (1000ms) with clean flush on unmount to prevent data loss.

### 2. Multi-Client Real-Time Collaboration (CRDTs)
- **Conflict-Free Merge**: Powered by Yjs, simultaneous edits from multiple tabs or users merge without overwriting.
- **Offline / Catch-Up Sync**: State vectors compute the exact minimum binary delta required to catch up reconnecting clients.
- **Room Isolation**: Formatted strictly as `workspace:{workspaceId}:page:{pageId}` to prevent cross-document collision.

### 3. Ephemeral Presence & Awareness
- **Live User Avatars**: Header avatar cluster showing all active participants currently reading or editing the document.
- **Colored Remote Cursors**: Each collaborator receives a deterministic, distinct color with real-time cursor label and caret position.
- **Typing Indicators**: Displays real-time typing indicators (`"User is editing..."`) with automatic 1.5s idle reset.
- **Disconnect Cleanup**: Dropped WebSocket connections automatically clean up presence state.

### 4. Inline Selection-Anchored Comments
- **Relative Position Anchors**: Comments link to text selections using Yjs `RelativePosition`, ensuring highlights follow text insertions and deletions.
- **Threaded Discussions**: Nested comment threads supporting multiple replies per comment.
- **Resolution Workflow**: Comments can be marked as resolved, filtering them from the active document view.

### 5. Document Version History & Recovery
- **Milestone Checkpoints**: Named snapshots (`DocumentSnapshot`) capturing point-in-time document states.
- **Diff Preview**: Safe, read-only preview of previous states without mutating the active collaborative session.
- **Non-Destructive Restoration**: Rolling back restores earlier content while automatically archiving the pre-restore state.

### 6. Workspaces & Role-Based Access Control (RBAC)
- **Multi-Tenancy**: Users can create, switch between, and manage multiple workspaces.
- **Role Hierarchy**:
  - `OWNER`: Full control, member invitation, role management, workspace deletion.
  - `EDITOR`: Full document editing, snapshot creation, and rollback.
  - `COMMENTER`: Read-only text access with inline comment and reply capabilities.
  - `VIEWER`: Read-only document access.
- **Cryptographic Invitations**: Secure 7-day single-use invite tokens hashed with SHA-256 in the database.
- **Security Defenses**: Rate limiting on sensitive endpoints (auth, invitations) and HTML stripping against XSS injection.

---

## 🛠️ Installation & Local Setup

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS
- **npm**: v10+
- **PostgreSQL**: Local cluster or hosted URL (e.g. Supabase, Neon)
- **Redis** *(optional)*: For multi-instance horizontal scaling (in-memory fallback runs automatically if omitted)

### 2. Clone Repository
```bash
git clone https://github.com/rk0802p/RealCollab.git
cd RealCollab
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/realcollab"
JWT_SECRET="your-secure-jwt-secret-key-at-least-32-chars"
AUTH_SECRET="your-secure-auth-secret-key-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_COLLAB_WS_URL="ws://localhost:1234"
COLLAB_PORT=1234
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Setup & Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 6. Start Development Servers
Run both frontend and WebSocket collaboration server concurrently:
```bash
npm run dev
```
- **Next.js Web Application**: [http://localhost:3000](http://localhost:3000)
- **Collaboration Server**: [ws://localhost:1234](ws://localhost:1234)
- **Health Check**: [http://localhost:1234/health](http://localhost:1234/health)

---

## 🧪 Testing & Verification

### Unit Test Suite (Vitest)
Run all 52 unit tests across 7 test suites:
```bash
npm test
```

### End-to-End System Verification
Run the 10-step full system regression verification suite:
```bash
node scripts/verify-full-system.mjs
```

### Phase Acceptance Verification Scripts
```bash
node scripts/verify-phase4.mjs  # Multi-client CRDT sync over WebSockets
node scripts/verify-phase5.mjs  # Live awareness, cursors, and typing indicators
node scripts/verify-phase6.mjs  # Anchored comments, replies, and RBAC
node scripts/verify-phase7.mjs  # Named checkpoints and non-destructive rollbacks
node scripts/verify-phase8.mjs  # Cryptographic invitations, rate limiting, and RBAC
```

---

## 📜 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.
