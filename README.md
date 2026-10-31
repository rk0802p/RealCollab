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

## 🗺️ Implementation Roadmap

- [x] **Phase 0 — Product Planning & Architecture**: CRDT research, system topology, database design, and protocol specification.
- [x] **Phase 1 — Project Initialization & Monorepo Setup**: Workspaces, Docker compose, Prisma models, Next.js UI scaffolding, and WebSocket daemon foundation.
- [ ] **Phase 2 — Database Architecture & Authentication**: Sessions, bcrypt password hashing, workspace tenancy, and RBAC guards.
- [ ] **Phase 3 — TipTap Rich-Text Editor**: Headings, lists, codeblocks, checklists, and local autosave.
- [ ] **Phase 4 — Yjs Real-Time Collaboration**: y-websocket integration, binary update persistence, and concurrent edit convergence.
- [ ] **Phase 5 — Presence, Colored Cursors & Avatars**: Ephemeral awareness, live user carets, and active typing badges.
- [ ] **Phase 6 — Threaded Comments & Inline Anchors**: RelativePosition anchors, comment threads, replies, and resolution.
- [ ] **Phase 7 — Version History & Snapshots**: Named snapshots, version preview, and non-destructive rollbacks.
- [ ] **Phase 8 — Security & Permission Enforcement**: Server-side write validation, invitation tokens, and rate limiting.
- [ ] **Phase 9 — Multi-Instance Redis Scaling**: Redis Pub/Sub channels for cross-instance horizontal synchronization.
- [ ] **Phase 10 — QA, Stress Testing & Production Deployment**: Multi-browser Playwright test matrix and load-test benchmarks.

---

## 📜 License
MIT
