import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

describe('Phase 4 — Yjs CRDT Synchronization & Convergence Unit Tests', () => {
  it('converges two documents editing simultaneously to identical state', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const textA = docA.getText('content');
    const textB = docB.getText('content');

    // Both start with initial paragraph
    textA.insert(0, 'Initial paragraph text.');
    const initUpdate = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, initUpdate);

    expect(textB.toString()).toBe('Initial paragraph text.');

    // User A edits at start
    textA.insert(0, 'Alice: ');
    const updateA = Y.encodeStateAsUpdate(docA);

    // User B edits at end concurrently
    textB.insert(textB.length, ' - Bob review.');
    const updateB = Y.encodeStateAsUpdate(docB);

    // Cross-sync updates via CRDT merge
    Y.applyUpdate(docB, updateA);
    Y.applyUpdate(docA, updateB);

    // Both converge to the identical state without lock contention or silent overwrite
    expect(textA.toString()).toBe(textB.toString());
    expect(textA.toString()).toBe('Alice: Initial paragraph text. - Bob review.');
  });

  it('handles simultaneous overlapping edits in the same paragraph without data loss', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const t1 = doc1.getText('prose');
    const t2 = doc2.getText('prose');

    t1.insert(0, 'The fox jumps over the dog.');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Client 1 inserts "brown " before "fox" (index 4)
    t1.insert(4, 'brown ');

    // Client 2 inserts "lazy " before "dog" (index 23 in original)
    t2.insert(23, 'lazy ');

    // Sync updates between clients
    const delta1 = Y.encodeStateAsUpdate(doc1);
    const delta2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc2, delta1);
    Y.applyUpdate(doc1, delta2);

    // Verify both changes are preserved and converged
    expect(t1.toString()).toBe(t2.toString());
    expect(t1.toString()).toBe('The brown fox jumps over the lazy dog.');
  });

  it('computes missing deltas efficiently using state vectors', () => {
    const serverDoc = new Y.Doc();
    const clientDoc = new Y.Doc();

    const serverText = serverDoc.getText('code');
    serverText.insert(0, 'const port = 1234;');

    // Client knows nothing: state vector is empty
    const clientVector = Y.encodeStateVector(clientDoc);

    // Server encodes only the delta client is missing
    const missingDelta = Y.encodeStateAsUpdate(serverDoc, clientVector);
    Y.applyUpdate(clientDoc, missingDelta);

    const clientText = clientDoc.getText('code');
    expect(clientText.toString()).toBe('const port = 1234;');
  });

  it('encodes and synchronizes ephemeral user awareness state', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const awarenessA = new awarenessProtocol.Awareness(docA);
    const awarenessB = new awarenessProtocol.Awareness(docB);

    awarenessA.setLocalStateField('user', {
      name: 'Alice Johnson',
      color: '#3B82F6',
      cursor: { anchor: 10, head: 10 },
    });

    const update = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [awarenessA.clientID]);
    awarenessProtocol.applyAwarenessUpdate(awarenessB, update, 'remote');

    const stateInB = awarenessB.getStates().get(awarenessA.clientID);
    expect(stateInB).toBeDefined();
    expect(stateInB?.user.name).toBe('Alice Johnson');
    expect(stateInB?.user.color).toBe('#3B82F6');
    expect(stateInB?.user.cursor.anchor).toBe(10);
  });
});
