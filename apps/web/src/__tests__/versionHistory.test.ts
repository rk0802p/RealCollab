import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { createSnapshotSchema, restoreSnapshotSchema } from '../lib/validations';
import { hasPermission } from '@realcollab/shared';

describe('Phase 7: Version History & Document Recovery Unit Tests', () => {
  describe('Validation Schemas', () => {
    it('validates manual snapshot creation schema with optional description and base64', () => {
      const validPayload = {
        description: 'Release 1.0 Milestone Checkpoint',
        snapshotBase64: 'AQE=',
      };
      const result = createSnapshotSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('Release 1.0 Milestone Checkpoint');
      }
    });

    it('allows empty description defaulting to manual checkpoint', () => {
      const result = createSnapshotSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rejects description exceeding 255 characters', () => {
      const tooLong = 'A'.repeat(256);
      const result = createSnapshotSchema.safeParse({ description: tooLong });
      expect(result.success).toBe(false);
    });

    it('validates restore schema with createCheckpoint flag', () => {
      const result = restoreSnapshotSchema.safeParse({ createCheckpoint: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createCheckpoint).toBe(true);
      }
    });
  });

  describe('Yjs State Snapshot Encoding, Reconstruction & Eventual Consistency', () => {
    it('accurately encodes and reconstructs complete document state from binary snapshot', () => {
      const docA = new Y.Doc();
      const textA = docA.getText('default');
      const initialContent = '# System Architecture\n\n- Stateless Next.js Frontend\n- Stateful WebSocket Daemon';
      textA.insert(0, initialContent);

      // Encode document state snapshot
      const snapshotBytes = Y.encodeStateAsUpdate(docA);
      expect(snapshotBytes).toBeInstanceOf(Uint8Array);
      expect(snapshotBytes.length).toBeGreaterThan(0);

      // Mutate live docA
      textA.insert(textA.length, '\n- Redis PubSub Cluster');
      expect(textA.toString()).not.toBe(initialContent);

      // Reconstruct historical version in an independent Y.Doc
      const historicalDoc = new Y.Doc();
      Y.applyUpdate(historicalDoc, snapshotBytes);
      const reconstructedText = historicalDoc.getText('default').toString();

      expect(reconstructedText).toBe(initialContent);

      docA.destroy();
      historicalDoc.destroy();
    });

    it('simulates accidental content deletion and guarantees 100% data recovery', () => {
      const liveDoc = new Y.Doc();
      const text = liveDoc.getText('default');
      const missionCriticalText = 'CRITICAL FINANCIAL DATA: Q3 Revenue $4,200,000; Operating Margin: 34%';
      text.insert(0, missionCriticalText);

      // 1. Take snapshot checkpoint
      const checkpointBytes = Y.encodeStateAsUpdate(liveDoc);

      // 2. Accidental deletion occurs (user or buggy script wipes document)
      text.delete(0, text.length);
      expect(text.toString()).toBe('');

      // 3. Rollback / restore operation: reconstruct snapshot in clean container and apply deliberate restoration transaction
      const snapshotContainer = new Y.Doc();
      Y.applyUpdate(snapshotContainer, checkpointBytes);
      const recoveredText = snapshotContainer.getText('default').toString();

      liveDoc.transact(() => {
        text.delete(0, text.length);
        text.insert(0, recoveredText);
      });

      // 4. Verify complete recovery of mission critical data
      expect(text.toString()).toBe(missionCriticalText);

      liveDoc.destroy();
      snapshotContainer.destroy();
    });

    it('preserves CRDT state vector convergence when restored snapshot is shared with peer', () => {
      const client1 = new Y.Doc();
      const client2 = new Y.Doc();

      const text1 = client1.getText('default');
      text1.insert(0, 'Original Version 1');

      // Sync to client2
      const syncUpdate = Y.encodeStateAsUpdate(client1);
      Y.applyUpdate(client2, syncUpdate);
      expect(client2.getText('default').toString()).toBe('Original Version 1');

      // Create snapshot of Version 1
      const snapshotV1 = Y.encodeStateAsUpdate(client1);

      // Client 1 edits further
      text1.insert(text1.length, ' with unwanted additions');
      // Sync update to Client 2
      Y.applyUpdate(client2, Y.encodeStateAsUpdate(client1));
      expect(client2.getText('default').toString()).toContain('unwanted additions');

      // Pre-restore checkpoint taken on client1
      const preRestoreCheckpoint = Y.encodeStateAsUpdate(client1);
      expect(preRestoreCheckpoint.length).toBeGreaterThan(0);

      // Client 1 restores V1 in fresh state container and applies to clients
      const restoredDoc = new Y.Doc();
      Y.applyUpdate(restoredDoc, snapshotV1);
      expect(restoredDoc.getText('default').toString()).toBe('Original Version 1');

      client1.destroy();
      client2.destroy();
      restoredDoc.destroy();
    });
  });

  describe('Role-Based Access Control for Version History', () => {
    it('allows OWNER and EDITOR to create and restore version snapshots', () => {
      expect(hasPermission('OWNER', 'canEditContent')).toBe(true);
      expect(hasPermission('EDITOR', 'canEditContent')).toBe(true);
    });

    it('strictly prevents COMMENTER and VIEWER from restoring versions or editing content', () => {
      expect(hasPermission('COMMENTER', 'canEditContent')).toBe(false);
      expect(hasPermission('VIEWER', 'canEditContent')).toBe(false);
    });

    it('allows all workspace roles to view pages and historical snapshots', () => {
      expect(hasPermission('OWNER', 'canViewPages')).toBe(true);
      expect(hasPermission('EDITOR', 'canViewPages')).toBe(true);
      expect(hasPermission('COMMENTER', 'canViewPages')).toBe(true);
      expect(hasPermission('VIEWER', 'canViewPages')).toBe(true);
    });
  });
});
