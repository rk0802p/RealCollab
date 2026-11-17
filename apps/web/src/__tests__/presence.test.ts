import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { generateUserColor } from '../lib/utils';

describe('Phase 5 — Presence, Colored Cursors & Online Users Unit Tests', () => {
  it('generates consistent and distinct colors for different user identities', () => {
    const colorAlice = generateUserColor('user-alice-101');
    const colorBob = generateUserColor('user-bob-202');
    const colorCharlie = generateUserColor('user-charlie-303');

    expect(typeof colorAlice).toBe('string');
    expect(colorAlice.startsWith('#')).toBe(true);

    // Consistency: same ID yields identical color
    expect(generateUserColor('user-alice-101')).toBe(colorAlice);

    // Differentiation across users
    const uniqueColors = new Set([colorAlice, colorBob, colorCharlie]);
    expect(uniqueColors.size).toBeGreaterThanOrEqual(2);
  });

  it('tracks three simultaneous users with distinct names, roles, and cursor colors', () => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    // Simulate 3 clients connecting
    const client1Id = 1001;
    const client2Id = 1002;
    const client3Id = 1003;

    awareness.setLocalStateField('user', {
      name: 'Alice Johnson',
      role: 'OWNER',
      color: '#3B82F6',
    });

    // Receive simulated awareness states from client 2 & 3
    const states = awareness.getStates();
    states.set(client2Id, {
      user: { name: 'Bob Smith', role: 'EDITOR', color: '#10B981' },
    });
    states.set(client3Id, {
      user: { name: 'Charlie Brown', role: 'VIEWER', color: '#F59E0B' },
    });

    expect(states.size).toBe(3);

    const user1 = states.get(awareness.clientID)?.user;
    const user2 = states.get(client2Id)?.user;
    const user3 = states.get(client3Id)?.user;

    expect(user1?.name).toBe('Alice Johnson');
    expect(user2?.name).toBe('Bob Smith');
    expect(user3?.name).toBe('Charlie Brown');

    // Distinct colors
    expect(user1?.color).not.toBe(user2?.color);
    expect(user2?.color).not.toBe(user3?.color);
  });

  it('removes offline clients from awareness state when they disconnect', () => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);

    const remoteClientId = 2002;
    awareness.getStates().set(remoteClientId, {
      user: { name: 'Dave', color: '#8B5CF6' },
    });

    expect(awareness.getStates().has(remoteClientId)).toBe(true);

    // Client disconnects
    awarenessProtocol.removeAwarenessStates(awareness, [remoteClientId], 'disconnect');
    expect(awareness.getStates().has(remoteClientId)).toBe(false);
  });

  it('propagates real-time typing indicators in ephemeral awareness', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const awarenessA = new awarenessProtocol.Awareness(docA);
    const awarenessB = new awarenessProtocol.Awareness(docB);

    awarenessA.setLocalStateField('user', {
      name: 'Alice',
      isTyping: true,
      lastActive: Date.now(),
    });

    // Sync awareness from A to B
    const update = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [awarenessA.clientID]);
    awarenessProtocol.applyAwarenessUpdate(awarenessB, update, 'network');

    const stateInB = awarenessB.getStates().get(awarenessA.clientID);
    expect(stateInB?.user.isTyping).toBe(true);

    // Alice stops typing
    awarenessA.setLocalStateField('user', {
      name: 'Alice',
      isTyping: false,
      lastActive: Date.now(),
    });

    const updateStop = awarenessProtocol.encodeAwarenessUpdate(awarenessA, [awarenessA.clientID]);
    awarenessProtocol.applyAwarenessUpdate(awarenessB, updateStop, 'network');

    const updatedStateInB = awarenessB.getStates().get(awarenessA.clientID);
    expect(updatedStateInB?.user.isTyping).toBe(false);
  });

  it('ensures cursor movements and selections do not pollute the persistent document content', () => {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    const text = doc.getText('content');
    text.insert(0, 'Multiplayer document content.');

    // Move cursor across multiple positions
    awareness.setLocalStateField('cursor', { anchor: 5, head: 5 });
    awareness.setLocalStateField('cursor', { anchor: 12, head: 18 }); // Selection

    // Document text content must remain strictly unpolluted
    expect(text.toString()).toBe('Multiplayer document content.');
    expect(doc.share.size).toBe(1); // Only 'content' exists, no ephemeral cursor leakage
  });
});
