/**
 * Input sanitization utilities for RealCollab.
 * Protects against Stored XSS, HTML injection, and buffer abuse.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes unsafe HTML characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips all HTML tags and control characters, trimming leading/trailing whitespace.
 */
export function stripHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Remove ASCII control characters
    .trim();
}

/**
 * Sanitizes page and workspace titles.
 * Disallows HTML, truncates to maxLength, provides fallback if empty.
 */
export function sanitizeTitle(title: string, maxLength = 120, fallback = 'Untitled'): string {
  if (!title || typeof title !== 'string') return fallback;
  const stripped = stripHtml(title);
  if (!stripped) return fallback;
  return stripped.slice(0, maxLength);
}

/**
 * Sanitizes rich text or comments while stripping malicious script/iframe tags.
 */
export function sanitizeComment(content: string, maxLength = 5000): string {
  if (!content || typeof content !== 'string') return '';
  const stripped = stripHtml(content);
  return stripped.slice(0, maxLength);
}

/**
 * Sanitizes user display names.
 */
export function sanitizeName(name: string, maxLength = 50): string {
  if (!name || typeof name !== 'string') return 'Anonymous';
  const stripped = stripHtml(name);
  return (stripped || 'Anonymous').slice(0, maxLength);
}
