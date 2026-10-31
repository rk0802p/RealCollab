# RealCollab — API & Protocol Specification

## 1. REST API Endpoints (Next.js Application)

All requests to `/api/*` accept and return `application/json` unless otherwise specified.
Authentication uses secure, `httpOnly`, `SameSite=Lax` session cookies.

### 1.1 Authentication & Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account with email & password | No |
| `POST` | `/api/auth/login` | Authenticate user, issue session cookie | No |
| `POST` | `/api/auth/logout` | Invalidate active session cookie | Yes |
| `GET` | `/api/auth/me` | Fetch currently logged in user profile | Yes |

### 1.2 Workspaces
| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/workspaces` | Create a new workspace | Any User |
| `GET` | `/api/workspaces` | List all workspaces current user belongs to | Any User |
| `GET` | `/api/workspaces/:id` | Fetch workspace metadata & member list | Workspace Member |
| `PATCH` | `/api/workspaces/:id` | Update workspace name / settings | `OWNER` |
| `DELETE` | `/api/workspaces/:id` | Delete workspace and all associated pages | `OWNER` |
| `POST` | `/api/workspaces/:id/members` | Invite member via email with assigned role | `OWNER` |
| `PATCH` | `/api/workspaces/:id/members/:userId` | Change a member's role | `OWNER` |
| `DELETE` | `/api/workspaces/:id/members/:userId` | Remove member from workspace | `OWNER` |

### 1.3 Pages
| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/workspaces/:workspaceId/pages` | Create page in workspace | `OWNER`, `EDITOR` |
| `GET` | `/api/pages/:id` | Get page metadata and initial state summary | Member |
| `PATCH` | `/api/pages/:id` | Update page title, icon, or metadata | `OWNER`, `EDITOR` |
| `DELETE` | `/api/pages/:id` | Archive or soft-delete page | `OWNER`, `EDITOR` |

### 1.4 Comments & Discussions
| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pages/:id/comments` | List all comment threads for a page | Member |
| `POST` | `/api/pages/:id/comments` | Create anchored comment thread | `OWNER`, `EDITOR`, `COMMENTER` |
| `PATCH` | `/api/comments/:id` | Update comment content (author only) | Author |
| `DELETE` | `/api/comments/:id` | Delete comment thread | Author / `OWNER` |
| `POST` | `/api/comments/:id/replies` | Add reply to existing comment thread | `OWNER`, `EDITOR`, `COMMENTER` |
| `POST` | `/api/comments/:id/resolve` | Toggle resolved status of thread | `OWNER`, `EDITOR`, `COMMENTER` |

### 1.5 Version History & Snapshots
| Method | Endpoint | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pages/:id/snapshots` | List historical snapshot checkpoints | Member |
| `POST` | `/api/pages/:id/snapshots` | Create named manual snapshot checkpoint | `OWNER`, `EDITOR` |
| `GET` | `/api/snapshots/:id` | Retrieve encoded snapshot state for preview | Member |
| `POST` | `/api/snapshots/:id/restore` | Restore historical state to live document | `OWNER`, `EDITOR` |

---

## 2. Real-Time Collaboration WebSocket Protocol

The collaboration server listens at `ws://localhost:1234` (or production wss domain).

### 2.1 Connection URL & Handshake
Clients connect using the standard `y-websocket` protocol URL:
```
ws://<collab-host>/workspace:<workspaceId>:page:<pageId>?token=<session_or_jwt_token>
```

#### Handshake Validation Sequence:
1. Parse query params (`token`) or verify session cookie from HTTP upgrade header.
2. Verify token signature and extract `userId`.
3. Query database (or cached Redis session):
   - Verify user belongs to `workspaceId`.
   - Retrieve role: `OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`.
4. If unauthorized or lacking permission:
   - Terminate connection with WebSocket Close Code `4401` (Unauthorized) or `4403` (Forbidden).

### 2.2 Wire Messages & Framing
The server implements the Yjs binary sync protocol over WebSocket binary frames:
1. **Sync Protocol (`y-protocols/sync`)**:
   - `SyncStep1` (Type 0): Client transmits its local state vector.
   - `SyncStep2` (Type 1): Server responds with missing binary updates needed by client.
   - `Update` (Type 2): Incremental binary update broadcast.
2. **Awareness Protocol (`y-protocols/awareness`)**:
   - Client sends ephemeral updates:
   ```json
   {
     "user": {
       "name": "Jane Doe",
       "color": "#10B981",
       "avatar": "https://avatar.url/jane.png"
     },
     "cursor": {
       "anchor": 128,
       "head": 128
     }
   }
   ```
   - Server distributes awareness to all other connected peers in the room.

### 2.3 Write Protection Enforcement
- If a client with `VIEWER` or `COMMENTER` role transmits a `SyncStep2` or `Update` frame modifying the `Y.Doc`, the collaboration server discards the update and emits an error event:
```json
{
  "type": "error",
  "code": "INSUFFICIENT_PERMISSIONS",
  "message": "Viewers and Commenters are not permitted to edit document content."
}
```
