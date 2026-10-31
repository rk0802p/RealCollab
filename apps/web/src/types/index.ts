export interface Collaborator {
  clientId: number;
  name: string;
  color: string;
  avatar?: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
