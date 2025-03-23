export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  avatar?: string;
  timestamp: Date;
}

export interface ActiveUsers {
  count: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: Date;
}
