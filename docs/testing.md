# RealCollab — Testing Strategy & Quality Assurance

This document details the multi-tier testing methodology required for validating real-time multiplayer consistency, resilience, and security.

---

## 1. Testing Pyramid

| Level | Scope | Tools | Purpose |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | CRDT state transformations, password hashing, token validation | Vitest | Fast verification of deterministic functions |
| **Integration Tests** | REST API endpoints, database cascades, workspace authorization | Vitest + Supertest | Validate backend data integrity & access rules |
| **Real-time Sync Tests** | Dual WebSocket clients editing concurrent blocks | Vitest + `ws` + Yjs | Programmatic verification of CRDT convergence |
| **End-to-End Tests** | Multi-browser simultaneous editing, live cursors, comments | Playwright | Full browser-level verification of UX & sync |
| **Load & Stress Tests** | 20+ simultaneous simulated WebSocket connections per room | Custom Node script / Artillery | Measure latency, memory footprint, throughput |

---

## 2. Core Scenarios & Acceptance Criteria

### 2.1 Concurrent Overlapping Edits (No Silent Overwrite)
- **Scenario**: Two users (User A and User B) type into the same paragraph simultaneously.
- **Verification**:
  1. Initialize page with text: `"The quick brown fox jumps over the lazy dog."`
  2. User A inserts `"extremely "` before `"lazy"`.
  3. User B simultaneously inserts `"and agile "` after `"quick"`.
  4. Both clients exchange `Y.Update` packets.
  5. **Pass Criteria**: Both clients converge to identical text:
     `"The quick and agile brown fox jumps over the extremely lazy dog."`
     Neither change is overwritten or dropped.

### 2.2 Offline Resilience & Reconnection
- **Scenario**: User A goes offline, edits several paragraphs, then reconnects.
- **Verification**:
  1. User A disconnects network / WebSocket connection.
  2. User B makes 5 edits while User A is offline.
  3. User A makes 3 edits locally in offline buffer.
  4. User A reconnects.
  5. State vectors are exchanged via `SyncStep1` and `SyncStep2`.
  6. **Pass Criteria**: Both User A and User B arrive at equivalent document state.

### 2.3 Server Crash & Persistence Recovery
- **Scenario**: Collaboration server process is killed abruptly while documents are open.
- **Verification**:
  1. Users write to document.
  2. Debounced updates are saved in PostgreSQL `DocumentUpdate`.
  3. Kill collaboration server process (`SIGKILL`).
  4. Restart server.
  5. Clients reconnect.
  6. **Pass Criteria**: All persisted updates are loaded and verified matching pre-crash state.

### 2.4 Server-Side Permission Enforcement (Tamper Resistance)
- **Scenario**: A user with `VIEWER` role opens browser DevTools and directly transmits a binary `Y.Update` frame over WebSocket.
- **Pass Criteria**: Server validates user role on the incoming update frame, ignores/rejects the update, does NOT broadcast it to other clients, and logs an audit security event.

---

## 3. Playwright Multi-Session Browser Matrix

```typescript
// Sample Playwright multi-session pattern
test('Multi-user simultaneous typing', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  
  // Login User A & B
  await login(pageA, 'alice@example.com');
  await login(pageB, 'bob@example.com');
  
  // Navigate both to the same document
  await pageA.goto('/workspace/w1/page/p1');
  await pageB.goto('/workspace/w1/page/p1');
  
  // Type in parallel
  await Promise.all([
    pageA.locator('.tiptap').type('Alice text '),
    pageB.locator('.tiptap').type('Bob text ')
  ]);
  
  // Verify convergence on both screens
  await expect(pageA.locator('.tiptap')).toContainText('Alice text');
  await expect(pageA.locator('.tiptap')).toContainText('Bob text');
  await expect(pageB.locator('.tiptap')).toContainText('Alice text');
  await expect(pageB.locator('.tiptap')).toContainText('Bob text');
});
```
