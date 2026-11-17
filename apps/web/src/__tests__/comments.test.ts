import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  createCommentSchema,
  createReplySchema,
  updateCommentSchema,
} from '../lib/validations';
import { hasPermission } from '@realcollab/shared';

describe('Phase 6: Comments & Discussion System Unit Tests', () => {
  describe('Comment & Reply Schemas', () => {
    it('validates valid comment with anchor data', () => {
      const validPayload = {
        content: 'Should we support automatic conflict recovery?',
        anchorData: {
          quote: 'offline editing',
          from: 24,
          to: 39,
          startRelPos: { client: 1, clock: 24 },
          endRelPos: { client: 1, clock: 39 },
        },
      };

      const result = createCommentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Should we support automatic conflict recovery?');
        expect(result.data.anchorData?.quote).toBe('offline editing');
      }
    });

    it('validates page-level comment without anchor data', () => {
      const result = createCommentSchema.safeParse({
        content: 'Great overview of the technical roadmap!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.anchorData).toBeUndefined();
      }
    });

    it('rejects empty comment or empty reply', () => {
      const emptyComment = createCommentSchema.safeParse({ content: '' });
      expect(emptyComment.success).toBe(false);

      const emptyReply = createReplySchema.safeParse({ content: '' });
      expect(emptyReply.success).toBe(false);

      const validReply = createReplySchema.safeParse({ content: 'I agree, let us add it.' });
      expect(validReply.success).toBe(true);
    });

    it('validates comment update schema', () => {
      const result = updateCommentSchema.safeParse({ content: 'Updated comment text.' });
      expect(result.success).toBe(true);

      const empty = updateCommentSchema.safeParse({ content: '' });
      expect(empty.success).toBe(false);
    });
  });

  describe('Comment RBAC Permissions', () => {
    it('allows OWNER, EDITOR, and COMMENTER to add and resolve comments', () => {
      expect(hasPermission('OWNER', 'canAddComments')).toBe(true);
      expect(hasPermission('EDITOR', 'canAddComments')).toBe(true);
      expect(hasPermission('COMMENTER', 'canAddComments')).toBe(true);

      expect(hasPermission('OWNER', 'canResolveComments')).toBe(true);
      expect(hasPermission('EDITOR', 'canResolveComments')).toBe(true);
      expect(hasPermission('COMMENTER', 'canResolveComments')).toBe(true);
    });

    it('strictly forbids VIEWER from adding or resolving comments', () => {
      expect(hasPermission('VIEWER', 'canAddComments')).toBe(false);
      expect(hasPermission('VIEWER', 'canResolveComments')).toBe(false);
      expect(hasPermission('VIEWER', 'canEditContent')).toBe(false);
      // VIEWER can view pages/comments
      expect(hasPermission('VIEWER', 'canViewPages')).toBe(true);
    });
  });

  describe('Yjs Relative Position Anchor Recovery Across Concurrent Edits', () => {
    it('accurately preserves anchored text position when document is edited beforehand', () => {
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText('content');

      // Original document: "The system must support offline editing."
      const originalText = 'The system must support offline editing.';
      ytext.insert(0, originalText);

      // Selected text: "offline editing" (from index 24 to 39)
      const quote = 'offline editing';
      const from = originalText.indexOf(quote); // 24
      const to = from + quote.length; // 39
      expect(from).toBe(24);
      expect(to).toBe(39);
      expect(ytext.toString().slice(from, to)).toBe(quote);

      // Create Yjs relative positions for start and end
      const startRelPos = Y.createRelativePositionFromTypeIndex(ytext, from);
      const endRelPos = Y.createRelativePositionFromTypeIndex(ytext, to);

      // Serialize to JSON (as stored in database anchorData)
      const serializedStart = Y.relativePositionToJSON(startRelPos);
      const serializedEnd = Y.relativePositionToJSON(endRelPos);

      // Concurrent edit: Another user inserts a prefix at index 0
      const prefix = 'CRITICAL REQUIREMENT: ';
      ytext.insert(0, prefix);

      // Document has grown, but the relative positions must track the exact text
      const newDocText = ytext.toString();
      expect(newDocText.startsWith('CRITICAL REQUIREMENT: The system must')).toBe(true);

      // Deserialize and calculate absolute positions on the mutated document
      const recoveredStartRel = Y.createRelativePositionFromJSON(serializedStart);
      const recoveredEndRel = Y.createRelativePositionFromJSON(serializedEnd);

      const recoveredStartAbs = Y.createAbsolutePositionFromRelativePosition(recoveredStartRel, ydoc);
      const recoveredEndAbs = Y.createAbsolutePositionFromRelativePosition(recoveredEndRel, ydoc);

      expect(recoveredStartAbs).not.toBeNull();
      expect(recoveredEndAbs).not.toBeNull();

      if (recoveredStartAbs && recoveredEndAbs) {
        // New absolute indices have shifted forward by prefix.length (22 chars)
        expect(recoveredStartAbs.index).toBe(24 + prefix.length);
        expect(recoveredEndAbs.index).toBe(39 + prefix.length);

        // Extracting text at the recovered coordinates matches the original quoted selection
        const recoveredSlice = newDocText.slice(recoveredStartAbs.index, recoveredEndAbs.index);
        expect(recoveredSlice).toBe(quote);
      }
    });

    it('handles text deletion before the anchor correctly', () => {
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText('content');
      ytext.insert(0, 'Hello World! This is a collaborative test document.');

      const quote = 'collaborative test';
      const from = ytext.toString().indexOf(quote);
      const to = from + quote.length;

      const startRel = Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(ytext, from));
      const endRel = Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(ytext, to));

      // Delete "Hello World! " from the beginning (13 characters)
      ytext.delete(0, 13);

      const recoveredStart = Y.createAbsolutePositionFromRelativePosition(
        Y.createRelativePositionFromJSON(startRel),
        ydoc
      );
      const recoveredEnd = Y.createAbsolutePositionFromRelativePosition(
        Y.createRelativePositionFromJSON(endRel),
        ydoc
      );

      expect(recoveredStart).not.toBeNull();
      expect(recoveredEnd).not.toBeNull();

      if (recoveredStart && recoveredEnd) {
        const slice = ytext.toString().slice(recoveredStart.index, recoveredEnd.index);
        expect(slice).toBe(quote);
      }
    });
  });
});
