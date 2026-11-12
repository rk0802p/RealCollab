import { describe, it, expect } from 'vitest';
import { updatePageSchema, createPageSchema } from '../lib/validations';
import { hasPermission } from '@realcollab/shared';

describe('Phase 3 — Rich-Text Editor & Content Persistence Tests', () => {
  it('validates page creation with custom title and icon', () => {
    const valid = createPageSchema.safeParse({
      title: 'Sprint Planning Document',
      icon: '🚀',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.title).toBe('Sprint Planning Document');
      expect(valid.data.icon).toBe('🚀');
    }
  });

  it('validates content update payload containing HTML formatted rich text', () => {
    const htmlContent = `
      <h1>Architecture Review</h1>
      <p>This is a <strong>bold</strong> and <em>italic</em> paragraph.</p>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true"><p>Completed task</p></li>
      </ul>
      <blockquote>"Collaborative editing with CRDTs"</blockquote>
      <pre><code>const ydoc = new Y.Doc();</code></pre>
    `;

    const result = updatePageSchema.safeParse({
      title: 'Updated Title',
      content: htmlContent,
      icon: '📝',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toContain('Architecture Review');
      expect(result.data.content).toContain('data-type="taskList"');
    }
  });

  it('enforces that only OWNER and EDITOR roles are permitted to save content', () => {
    expect(hasPermission('OWNER', 'canEditContent')).toBe(true);
    expect(hasPermission('EDITOR', 'canEditContent')).toBe(true);
    expect(hasPermission('COMMENTER', 'canEditContent')).toBe(false);
    expect(hasPermission('VIEWER', 'canEditContent')).toBe(false);
  });

  it('rejects empty title when explicitly provided as empty string', () => {
    const result = createPageSchema.safeParse({
      title: '',
    });
    expect(result.success).toBe(false);
  });
});
