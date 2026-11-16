import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

// Assign WebSocket polyfill for node environment
globalThis.WebSocket = WebSocket;

const wsUrl = 'ws://localhost:1234';
const roomId = `test-page-${Date.now()}`;
const roomName = `workspace:default:page:${roomId}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (cond, msg) => {
  if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
};

async function testCollaboration() {
  console.log(`Connecting to room: ${roomName}...`);

  // 1. Initialize Client A
  const docA = new Y.Doc();
  const providerA = new WebsocketProvider(wsUrl, roomName, docA, {
    params: { token: 'mock:alice:OWNER' },
  });

  // 2. Initialize Client B
  const docB = new Y.Doc();
  const providerB = new WebsocketProvider(wsUrl, roomName, docB, {
    params: { token: 'mock:bob:EDITOR' },
  });

  // Wait for initial sync
  await sleep(600);
  assert(providerA.wsconnected, 'Client A should be connected');
  assert(providerB.wsconnected, 'Client B should be connected');
  console.log('✓ Both Client A and Client B connected over WebSocket');

  // Test 1: Single user edit syncs to peer
  const textA = docA.getText('content');
  const textB = docB.getText('content');

  textA.insert(0, 'Hello ');
  await sleep(300);
  assert(textB.toString() === 'Hello ', `Expected textB to have "Hello ", got: "${textB.toString()}"`);
  console.log('✓ Test 1: Client A edits appear in Client B');

  // Test 2: Client B edits, Client A syncs
  textB.insert(6, 'World!');
  await sleep(300);
  assert(textA.toString() === 'Hello World!', `Expected textA to have "Hello World!", got: "${textA.toString()}"`);
  assert(textB.toString() === 'Hello World!', `Expected textB to have "Hello World!", got: "${textB.toString()}"`);
  console.log('✓ Test 2: Client B edits sync back to Client A');

  // Test 3: Concurrent edits in the same paragraph without silent overwrite
  textA.insert(6, 'Beautiful ');
  textB.insert(textB.length, ' It works!');
  await sleep(400);

  assert(textA.toString() === textB.toString(), 'Documents must converge after concurrent edits');
  assert(textA.toString().includes('Beautiful'), 'Should retain Client A concurrent change');
  assert(textA.toString().includes('It works!'), 'Should retain Client B concurrent change');
  console.log(`✓ Test 3: Concurrent edits merged deterministically -> "${textA.toString()}"`);

  // Test 4: Ephemeral Awareness presence sync
  providerA.awareness.setLocalStateField('user', {
    name: 'Alice',
    color: '#3B82F6',
    cursor: { index: 12 },
  });
  await sleep(300);

  const statesInB = providerB.awareness.getStates();
  let foundAlice = false;
  statesInB.forEach((state) => {
    if (state.user && state.user.name === 'Alice') {
      foundAlice = true;
      assert(state.user.color === '#3B82F6', 'Color should match');
      assert(state.user.cursor.index === 12, 'Cursor index should match');
    }
  });
  assert(foundAlice, 'Client B should receive Alice awareness presence');
  console.log('✓ Test 4: Live awareness & cursor presence synchronized');

  // Test 5: Offline disconnect and reconnection catch-up
  console.log('Disconnecting Client A to simulate network drop...');
  providerA.disconnect();
  await sleep(200);

  // Client B continues editing offline from Client A
  textB.insert(textB.length, ' [Offline update]');
  await sleep(200);

  console.log('Reconnecting Client A...');
  providerA.connect();
  await sleep(500);

  assert(textA.toString() === textB.toString(), 'Reconnected Client A must catch up with missing updates');
  assert(textA.toString().includes('[Offline update]'), 'Client A should have offline updates from Client B');
  console.log('✓ Test 5: Reconnecting client catches up with missing deltas');

  // Test 6: Persistence test (reconstructed from clean connection)
  await sleep(600); // Allow debounced persistence to finish

  const docC = new Y.Doc();
  const providerC = new WebsocketProvider(wsUrl, roomName, docC, {
    params: { token: 'mock:charlie:VIEWER' },
  });
  await sleep(600);

  const textC = docC.getText('content');
  assert(textC.toString() === textB.toString(), 'New client C must receive full reconstructed document state');
  console.log('✓ Test 6: New connecting client reconstructs state from server persistence');

  // Cleanup connections
  providerA.destroy();
  providerB.destroy();
  providerC.destroy();
  docA.destroy();
  docB.destroy();
  docC.destroy();

  console.log('ALL PHASE 4 REAL-TIME COLLABORATION ACCEPTANCE TESTS PASSED!');
}

testCollaboration().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
