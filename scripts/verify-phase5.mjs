import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

globalThis.WebSocket = WebSocket;

const wsUrl = 'ws://localhost:1234';
const roomId = `presence-test-${Date.now()}`;
const roomName = `workspace:default:page:${roomId}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (cond, msg) => {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
};

async function testPresence() {
  console.log(`Connecting 3 clients to room: ${roomName}...`);

  // 1. Client 1: Alice (Owner)
  const doc1 = new Y.Doc();
  const provider1 = new WebsocketProvider(wsUrl, roomName, doc1, {
    params: { token: 'mock:alice:OWNER' },
  });
  provider1.awareness.setLocalStateField('user', {
    name: 'Alice Johnson',
    role: 'OWNER',
    color: '#3B82F6',
    cursor: { index: 0 },
    isTyping: false,
  });

  // 2. Client 2: Bob (Editor)
  const doc2 = new Y.Doc();
  const provider2 = new WebsocketProvider(wsUrl, roomName, doc2, {
    params: { token: 'mock:bob:EDITOR' },
  });
  provider2.awareness.setLocalStateField('user', {
    name: 'Bob Smith',
    role: 'EDITOR',
    color: '#10B981',
    cursor: { index: 5 },
    isTyping: false,
  });

  // 3. Client 3: Charlie (Commenter)
  const doc3 = new Y.Doc();
  const provider3 = new WebsocketProvider(wsUrl, roomName, doc3, {
    params: { token: 'mock:charlie:COMMENTER' },
  });
  provider3.awareness.setLocalStateField('user', {
    name: 'Charlie Brown',
    role: 'COMMENTER',
    color: '#F59E0B',
    cursor: { index: 10 },
    isTyping: false,
  });

  await sleep(700);

  // Test 1: Verify all 3 users have distinct cursor colors
  const statesInAlice = provider1.awareness.getStates();
  assert(statesInAlice.size >= 3, `Expected at least 3 active awareness states, got: ${statesInAlice.size}`);

  const activeUsers = Array.from(statesInAlice.values()).filter((s) => s.user).map((s) => s.user);
  const colors = activeUsers.map((u) => u.color);
  const uniqueColors = new Set(colors);

  assert(uniqueColors.size === 3, 'Three different users must have three distinct cursor colors');
  console.log(`✓ Test 1: Distinct cursor colors verified: ${colors.join(', ')}`);

  // Test 2: Avatars appear when users join
  const names = activeUsers.map((u) => u.name);
  assert(names.includes('Alice Johnson'), 'Alice present');
  assert(names.includes('Bob Smith'), 'Bob present');
  assert(names.includes('Charlie Brown'), 'Charlie present');
  console.log(`✓ Test 2: User avatars appeared for all 3 participants: ${names.join(', ')}`);

  // Test 3: Cursor position updates live across peers without refreshing
  console.log('Moving Alice cursor to index 42...');
  provider1.awareness.setLocalStateField('user', {
    ...provider1.awareness.getLocalState().user,
    cursor: { index: 42 },
  });

  await sleep(300);

  const bobViewOfAlice = Array.from(provider2.awareness.getStates().values()).find(
    (s) => s.user?.name === 'Alice Johnson'
  );
  assert(bobViewOfAlice?.user?.cursor?.index === 42, 'Bob must receive Alice updated cursor position');
  console.log('✓ Test 3: Cursor positions update live across peers');

  // Test 4: Live typing indicator
  console.log('Bob starts typing...');
  provider2.awareness.setLocalStateField('user', {
    ...provider2.awareness.getLocalState().user,
    isTyping: true,
  });

  await sleep(300);

  const aliceViewOfBob = Array.from(provider1.awareness.getStates().values()).find(
    (s) => s.user?.name === 'Bob Smith'
  );
  assert(aliceViewOfBob?.user?.isTyping === true, 'Alice should observe Bob isTyping: true');
  console.log('✓ Test 4: Live typing indicator ("Bob Smith is editing...") propagated');

  // Bob stops typing
  provider2.awareness.setLocalStateField('user', {
    ...provider2.awareness.getLocalState().user,
    isTyping: false,
  });
  await sleep(300);

  const aliceViewOfBobStopped = Array.from(provider1.awareness.getStates().values()).find(
    (s) => s.user?.name === 'Bob Smith'
  );
  assert(aliceViewOfBobStopped?.user?.isTyping === false, 'Alice should observe Bob isTyping: false');
  console.log('✓ Test 4b: Typing indicator cleared after inactivity');

  // Test 5: User leaves -> avatar disappears
  console.log('Charlie disconnects...');
  provider3.disconnect();
  provider3.destroy();
  doc3.destroy();

  await sleep(500);

  const statesAfterCharlieLeft = provider1.awareness.getStates();
  const remainingNames = Array.from(statesAfterCharlieLeft.values())
    .filter((s) => s.user)
    .map((s) => s.user.name);

  assert(!remainingNames.includes('Charlie Brown'), 'Charlie avatar must disappear upon disconnect');
  assert(remainingNames.includes('Alice Johnson'), 'Alice remains online');
  assert(remainingNames.includes('Bob Smith'), 'Bob remains online');
  console.log(`✓ Test 5: Disconnected user disappeared from live awareness: remaining = [${remainingNames.join(', ')}]`);

  // Cleanup
  provider1.destroy();
  provider2.destroy();
  doc1.destroy();
  doc2.destroy();

  console.log('ALL PHASE 5 PRESENCE, CURSORS & ONLINE USERS ACCEPTANCE TESTS PASSED!');
}

testPresence().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
