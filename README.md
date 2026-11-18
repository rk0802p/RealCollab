# RealCollab — Real-Time Collaborative Workspace

> A high-performance, real-time multiplayer document workspace inspired by Notion and Figma's collaboration layer. Built with Next.js, TipTap, Yjs (CRDT), WebSockets, PostgreSQL, Prisma, and Redis.

---

## 🚀 Key Highlights & Architectural Pillars

- **Conflict-Free Replicated Data Types (CRDTs)**: Powered by `Yjs` and lib0 binary encoding to guarantee strong eventual consistency across concurrent edits without data loss.
- **Stateful WebSocket Service vs. Stateless Frontend**: Complete architectural separation between the Next.js App Router (business logic, auth, permissions) and the persistent collaboration server (`y-websocket`).
- **Ephemeral Awareness & Live Cursors**: User presence, caret positions, avatar rings, and selections are handled via Yjs Awareness (never polluting the persistent database).
- **Durable Document Persistence**: Dual write-path featuring debounced incremental binary updates (`DocumentUpdate`) and historical compacted checkpoints (`DocumentSnapshot`).
- **Multi-Instance Horizontal Scaling**: Redis Pub/Sub channels distribute room updates across multiple collaboration server instances.
- **Enterprise-Grade Role-Based Access Control (RBAC)**: Strict server-side enforcement across `OWNER`, `EDITOR`, `COMMENTER`, and `VIEWER` roles.

---

## 📁 Repository Structure

```
RealCollab/
├── apps/
│   ├── web/                        # Next.js 14/15 App Router Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router pages and route handlers
│   │   │   ├── components/         # Modular UI (editor, workspace, comments, presence)
│   │   │   ├── hooks/              # Custom React hooks (useCollab, useAwareness)
│   │   │   ├── lib/                # Utilities and API clients
│   │   │   ├── services/           # Backend services
│   │   │   └── types/              # Frontend types
│   │   └── package.json
│   │
│   └── collaboration-server/       # Long-lived WebSocket Collaboration Daemon
│       ├── src/
│       │   ├── server.ts           # Entrypoint (Express + ws)
│       │   ├── auth/               # Connection auth & RBAC validation
│       │   ├── persistence/        # Prisma update persistence & snapshotting
│       │   ├── middleware/         # Handshake & origin verification
│       │   └── redis/              # Redis Pub/Sub multi-instance scaling
│       └── package.json
│
├── packages/
│   └── shared/                     # Shared Prisma schema, types, and constants
│       ├── prisma/
│       │   ├── schema.prisma       # Complete PostgreSQL database schema
│       │   └── seed.ts             # Demo data generator
│       ├── src/                    # Exported TypeScript types and validation schemas
│       └── package.json
│
├── docs/                           # Technical Specifications & Blueprints
│   ├── architecture.md             # System architecture & CRDT data flow
│   ├── database.md                 # ER diagrams & schema specification
│   ├── api.md                      # REST API & WebSocket protocol spec
│   └── testing.md                  # QA, Playwright, and load-test strategies
│
├── docker-compose.yml              # Local PostgreSQL 16 & Redis 7 services
├── .env.example                    # Template environment variables
├── README.md                       # Main documentation (this file)
└── package.json                    # Monorepo workspaces definition
```

---

## 🛠️ Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS
- **npm**: v10+
- **Docker & Docker Compose** (optional for containerized PostgreSQL & Redis)

### 2. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env
```

### 3. Start Database & Redis (Docker)
```bash
docker compose up -d
```
*(Alternatively, configure your local or hosted PostgreSQL and Redis instances in `.env`)*

### 4. Install Dependencies & Generate Database Client
```bash
npm install
npm run prisma:generate
```

### 5. Run Database Migrations and Seed Demo Data
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 6. Start Development Servers
Run both frontend and collaboration server in parallel:
```bash
npm run dev
```
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Collaboration WebSocket Server**: [ws://localhost:1234](ws://localhost:1234) (Health: [http://localhost:1234/health](http://localhost:1234/health))

---

## 🌐 Production & Vercel Deployment

RealCollab employs a modern decoupled architecture:
1. **Frontend & Next.js App Router (`apps/web`)** is deployed to **Vercel** (stateless, global edge caching, SSR).
2. **Collaboration Server (`apps/collaboration-server`)** is deployed to a persistent runtime (e.g. **Railway, Render, Fly.io, or VPS**) because WebSockets require a long-lived persistent process.

### Deploying the Web App to Vercel

The repository includes a ready-to-use [`vercel.json`](./vercel.json) at the root:

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure **Environment Variables** in the Vercel Dashboard:
   - `DATABASE_URL`: Hosted PostgreSQL connection URL (e.g. Supabase, Neon, AWS RDS, or Railway).
   - `JWT_SECRET`: Random 32+ character secure secret string.
   - `AUTH_SECRET`: Random 32+ character secure secret string.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel domain (e.g. `https://realcollab.vercel.app`).
   - `NEXT_PUBLIC_COLLAB_WS_URL`: The WebSocket URL of your deployed collaboration server (e.g. `wss://collab.yourdomain.com`).
3. Deploy! Vercel automatically runs `npm run build:web` (which generates Prisma client and builds the optimized Next.js bundle).

### Deploying the Collaboration Server (Docker / Railway / Render)

Run the stateful WebSocket server using the Node.js runtime:
```bash
npm run build:collab
node apps/collaboration-server/dist/server.js
```
Provide the following environment variables:
- `DATABASE_URL`: Same PostgreSQL database URL.
- `REDIS_URL`: Redis connection URL for multi-instance sync (optional, operates standalone if omitted).
- `JWT_SECRET`: Matching JWT secret for handshake validation.
- `COLLAB_PORT`: Port to listen on (default `1234` or `$PORT`).

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite:
```bash
npm run test --workspace=@realcollab/web
```
Current test suite status: **38/38 passing**
- `auth.test.ts` (7 tests): Password hashing, session creation, token validation, and RBAC matrix.
- `editor.test.ts` (4 tests): Formatting states, task lists, and slash commands.
- `collaboration.test.ts` (4 tests): Multi-client CRDT convergence and conflict-free editing.
- `presence.test.ts` (5 tests): Distinct cursor colors, 3-client awareness tracking, typing indicators, and disconnect cleanup.
- `comments.test.ts` (8 tests): Anchored selection stability across concurrent document mutations, threaded replies, and resolve/reopen status.
- `versionHistory.test.ts` (10 tests): Snapshot encoding, state reconstruction, accidental deletion recovery, and pre-restore backup preservation.

Run end-to-end phase verification scripts:
```bash
node scripts/verify-phase4.mjs  # Multi-client CRDT sync over WebSockets
node scripts/verify-phase5.mjs  # Live awareness, cursors, and typing indicators
node scripts/verify-phase6.mjs  # Anchored comments, replies, and RBAC against PostgreSQL
node scripts/verify-phase7.mjs  # Named checkpoints, previewing, and non-destructive rollbacks
```

---

## 🗺️ Implementation Roadmap

- [x] **Phase 0 — Product Planning & Architecture**: CRDT research, system topology, database design, and protocol specification.
- [x] **Phase 1 — Project Initialization & Monorepo Setup**: Workspaces, Docker compose, Prisma models, Next.js UI scaffolding, and WebSocket daemon foundation.
- [x] **Phase 2 — Database Architecture & Authentication**: Sessions, bcrypt password hashing, workspace tenancy, and RBAC guards.
- [x] **Phase 3 — TipTap Rich-Text Editor**: Headings, lists, codeblocks, checklists, and local autosave.
- [x] **Phase 4 — Yjs Real-Time Collaboration**: `y-websocket` integration, binary update persistence, and concurrent edit convergence.
- [x] **Phase 5 — Presence, Colored Cursors & Avatars**: Ephemeral awareness, live user carets, and active typing badges.
- [x] **Phase 6 — Threaded Comments & Inline Anchors**: `RelativePosition` anchors, comment threads, replies, and resolution.
- [x] **Phase 7 — Version History & Snapshots**: Named snapshots, version preview, and non-destructive rollbacks.
- [ ] **Phase 8 — Security & Permission Enforcement**: Server-side write validation, invitation tokens, and rate limiting.
- [ ] **Phase 9 — Multi-Instance Redis Scaling**: Redis Pub/Sub channels for cross-instance horizontal synchronization.
- [ ] **Phase 10 — QA, Stress Testing & Production Deployment**: Multi-browser Playwright test matrix and load-test benchmarks.

---

## 📜 License
MIT
