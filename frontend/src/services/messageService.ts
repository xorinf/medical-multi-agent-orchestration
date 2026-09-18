import type { DirectMessage, UserRole } from '../types';
import { mockDirectMessages } from './mockData';

let messagesState = [...mockDirectMessages];

export const messageService = {
  async getMessages(userId: string): Promise<DirectMessage[]> {
    return messagesState.filter(m => m.sender_id === userId || m.recipient_id === userId);
  },

  async sendMessage(data: {
    sender_id: string;
    sender_name: string;
    sender_role: UserRole;
    recipient_id: string;
    recipient_name: string;
    content: string;
  }): Promise<DirectMessage> {
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: `dm-${[data.sender_id, data.recipient_id].sort().join('-')}`,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      sender_role: data.sender_role,
      recipient_id: data.recipient_id,
      recipient_name: data.recipient_name,
      content: data.content,
      created_at: new Date().toISOString(),
      read: false,
    };
    messagesState.push(newMsg);
    return newMsg;
  }
};
