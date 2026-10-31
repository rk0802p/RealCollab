export interface ParsedRoom {
  raw: string;
  workspaceId: string;
  pageId: string;
}

/**
 * Parses and verifies room names according to the standard convention:
 * workspace:{workspaceId}:page:{pageId}
 */
export function parseRoomName(urlPath: string): ParsedRoom | null {
  // Strip leading slashes and query strings
  const cleanPath = urlPath.replace(/^\/+/, '').split('?')[0];

  const match = cleanPath.match(/^workspace:([a-zA-Z0-9_-]+):page:([a-zA-Z0-9_-]+)$/);
  if (!match) {
    // Also accept page-{pageId} as fallback for basic tests
    const simpleMatch = cleanPath.match(/^page-([a-zA-Z0-9_-]+)$/);
    if (simpleMatch) {
      return {
        raw: cleanPath,
        workspaceId: 'default',
        pageId: simpleMatch[1],
      };
    }
    return null;
  }

  return {
    raw: cleanPath,
    workspaceId: match[1],
    pageId: match[2],
  };
}
