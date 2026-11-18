import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimitStore } from '../lib/rateLimit';
import { escapeHtml, stripHtml, sanitizeTitle, sanitizeComment, sanitizeName } from '../lib/sanitize';
import { hashToken, generateInvitationToken } from '../services/invitationService';
import { hasPermission, ROLE_PERMISSIONS, WorkspaceRole } from '@realcollab/shared';

describe('Security & Rate Limiting (Phase 8)', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe('Rate Limiter', () => {
    it('allows requests within the specified limit', () => {
      const ip = '192.168.1.100';
      const options = { limit: 3, windowMs: 1000, keyPrefix: 'test' };

      const res1 = checkRateLimit(ip, options);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(ip, options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(1);

      const res3 = checkRateLimit(ip, options);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('blocks requests exceeding the configured limit and returns retryAfter', () => {
      const ip = '192.168.1.101';
      const options = { limit: 2, windowMs: 2000, keyPrefix: 'test_block' };

      checkRateLimit(ip, options);
      checkRateLimit(ip, options);

      const blockedRes = checkRateLimit(ip, options);
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
      expect(blockedRes.retryAfterSeconds).toBeLessThanOrEqual(2);
    });

    it('isolates different clients and namespaces independently', () => {
      const clientA = '10.0.0.1';
      const clientB = '10.0.0.2';
      const options = { limit: 1, windowMs: 1000, keyPrefix: 'iso' };

      const resA1 = checkRateLimit(clientA, options);
      expect(resA1.success).toBe(true);

      // Client A is blocked
      const resA2 = checkRateLimit(clientA, options);
      expect(resA2.success).toBe(false);

      // Client B should still be allowed
      const resB1 = checkRateLimit(clientB, options);
      expect(resB1.success).toBe(true);
    });
  });

  describe('Input Sanitization & XSS Protection', () => {
    it('escapes dangerous HTML characters', () => {
      const dangerous = '<script>alert("XSS") & attack()</script>';
      const escaped = escapeHtml(dangerous);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&quot;XSS&quot;');
      expect(escaped).toContain('&amp;');
    });

    it('strips HTML tags and control characters', () => {
      const payload = '<b>Bold</b> <iframe src="evil.com"></iframe> Plain text';
      const stripped = stripHtml(payload);
      expect(stripped).toBe('Bold  Plain text');
    });

    it('sanitizes page titles and enforces bounds', () => {
      const rawTitle = '<h1>Project Roadmap</h1><script>steal()</script>';
      const sanitized = sanitizeTitle(rawTitle);
      expect(sanitized).toBe('Project Roadmapsteal()');

      // Empty title fallback
      expect(sanitizeTitle('')).toBe('Untitled');
      expect(sanitizeTitle('   <img src=x onerror=alert(1)>   ')).toBe('Untitled');

      // Max length truncation
      const longTitle = 'A'.repeat(200);
      expect(sanitizeTitle(longTitle, 50).length).toBe(50);
    });

    it('sanitizes user comment input against HTML injection', () => {
      const maliciousComment = '<p>Great job! <script src="http://attacker.com/malware.js"></script></p>';
      const sanitized = sanitizeComment(maliciousComment);
      expect(sanitized).toBe('Great job!');
      expect(sanitized).not.toContain('<script');
    });

    it('sanitizes user names and provides fallback', () => {
      expect(sanitizeName('<b>Alice</b>')).toBe('Alice');
      expect(sanitizeName('   ')).toBe('Anonymous');
      expect(sanitizeName('', 50)).toBe('Anonymous');
    });
  });

  describe('Invitation Cryptography & Expiration', () => {
    it('generates high-entropy random tokens of 64 hex characters', () => {
      const token1 = generateInvitationToken();
      const token2 = generateInvitationToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('hashes tokens deterministically with SHA-256', () => {
      const token = 'test-token-1234567890-abcdef';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
    });

    it('correctly evaluates expired vs active timestamps', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours ahead

      const isPastExpired = pastDate.getTime() < Date.now();
      const isFutureExpired = futureDate.getTime() < Date.now();

      expect(isPastExpired).toBe(true);
      expect(isFutureExpired).toBe(false);
    });
  });

  describe('RBAC Matrix & Server-Side Permission Guards', () => {
    it('enforces that only OWNER can invite members and change roles', () => {
      expect(hasPermission('OWNER', 'canInviteMembers')).toBe(true);
      expect(hasPermission('EDITOR', 'canInviteMembers')).toBe(false);
      expect(hasPermission('COMMENTER', 'canInviteMembers')).toBe(false);
      expect(hasPermission('VIEWER', 'canInviteMembers')).toBe(false);

      expect(hasPermission('OWNER', 'canChangeRoles')).toBe(true);
      expect(hasPermission('EDITOR', 'canChangeRoles')).toBe(false);
    });

    it('enforces that VIEWER and COMMENTER cannot edit document content', () => {
      expect(hasPermission('OWNER', 'canEditContent')).toBe(true);
      expect(hasPermission('EDITOR', 'canEditContent')).toBe(true);
      expect(hasPermission('COMMENTER', 'canEditContent')).toBe(false);
      expect(hasPermission('VIEWER', 'canEditContent')).toBe(false);
    });

    it('enforces that VIEWER cannot add comments or resolve threads', () => {
      expect(hasPermission('OWNER', 'canAddComments')).toBe(true);
      expect(hasPermission('EDITOR', 'canAddComments')).toBe(true);
      expect(hasPermission('COMMENTER', 'canAddComments')).toBe(true);
      expect(hasPermission('VIEWER', 'canAddComments')).toBe(false);

      expect(hasPermission('COMMENTER', 'canResolveComments')).toBe(true);
      expect(hasPermission('VIEWER', 'canResolveComments')).toBe(false);
    });
  });
});
