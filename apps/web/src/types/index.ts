export interface Collaborator {
  clientId: number;
  userId?: string;
  name: string;
  color: string;
  avatar?: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  isTyping?: boolean;
  lastActive?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
