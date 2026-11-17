import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import * as Y from 'yjs';
import { CommentThread } from '@/types';

export const commentPluginKey = new PluginKey('commentDecorations');

export interface CommentExtensionOptions {
  getComments: () => CommentThread[];
  getActiveCommentId: () => string | null;
  getYdoc: () => Y.Doc | null | undefined;
  onCommentClick?: (commentId: string) => void;
}

export const CommentExtension = Extension.create<CommentExtensionOptions>({
  name: 'commentExtension',

  addOptions() {
    return {
      getComments: () => [],
      getActiveCommentId: () => null,
      getYdoc: () => null,
      onCommentClick: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: commentPluginKey,
        props: {
          decorations(state) {
            const comments = options.getComments();
            const activeCommentId = options.getActiveCommentId();
            const ydoc = options.getYdoc();

            if (!comments || comments.length === 0) return DecorationSet.empty;

            const decos: Decoration[] = [];
            const docSize = state.doc.content.size;

            comments.forEach((comment) => {
              if (comment.resolved || !comment.anchorData) return;

              let from: number | null = null;
              let to: number | null = null;

              // 1. Try Yjs relative position recovery if ydoc is present
              if (ydoc && comment.anchorData.startRelPos && comment.anchorData.endRelPos) {
                try {
                  const startAbs = Y.createAbsolutePositionFromRelativePosition(
                    Y.createRelativePositionFromJSON(comment.anchorData.startRelPos),
                    ydoc
                  );
                  const endAbs = Y.createAbsolutePositionFromRelativePosition(
                    Y.createRelativePositionFromJSON(comment.anchorData.endRelPos),
                    ydoc
                  );
                  if (startAbs && endAbs && startAbs.index < endAbs.index) {
                    from = startAbs.index;
                    to = endAbs.index;
                  }
                } catch {
                  // Fallback to numeric coordinates
                }
              }

              // 2. Fallback to numeric index range if Yjs relative position could not resolve
              if (
                from === null &&
                typeof comment.anchorData.from === 'number' &&
                typeof comment.anchorData.to === 'number'
              ) {
                from = comment.anchorData.from;
                to = comment.anchorData.to;
              }

              if (from !== null && to !== null && from < to) {
                const safeFrom = Math.max(1, Math.min(from, docSize));
                const safeTo = Math.max(safeFrom, Math.min(to, docSize));

                if (safeFrom < safeTo) {
                  const isActive = comment.id === activeCommentId;
                  decos.push(
                    Decoration.inline(safeFrom, safeTo, {
                      class: `comment-anchor-highlight ${isActive ? 'active-comment' : ''}`,
                      'data-comment-id': comment.id,
                    })
                  );
                }
              }
            });

            return DecorationSet.create(state.doc, decos);
          },
          handleClickOn(_view, _pos, _node, _nodePos, event) {
            const target = event.target as HTMLElement | null;
            if (target && target.closest('.comment-anchor-highlight')) {
              const el = target.closest('.comment-anchor-highlight') as HTMLElement;
              const commentId = el.getAttribute('data-comment-id');
              if (commentId && options.onCommentClick) {
                options.onCommentClick(commentId);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
