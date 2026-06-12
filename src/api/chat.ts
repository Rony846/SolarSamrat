import api, { TOKEN_KEY } from './client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

export interface ChatChannel {
  id: string;
  name: string;
  topic?: string | null;
  type: 'group' | 'dm';
  is_public: boolean;
  members: string[];
  last_message?: { sender?: string; body?: string; at?: string } | null;
  last_at?: string;
  unread: number;
  other_user_id?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  member_id: string;
  user_id_sender: string;
  sender_name?: string;
  sender_rank?: string;
  sender_role?: string;
  body: string;
  image_url?: string | null;
  created_at: string;
}

export async function listChannels(): Promise<{ channels: ChatChannel[]; online: string[] }> {
  return (await api.get('/samrat/chat/channels')).data;
}

export async function createGroup(name: string, topic?: string, is_public = true): Promise<ChatChannel> {
  return (await api.post('/samrat/chat/groups', { name, topic, is_public })).data;
}

export async function joinChannel(id: string): Promise<void> {
  await api.post(`/samrat/chat/channels/${id}/join`);
}

export async function openDm(memberId: string): Promise<ChatChannel> {
  return (await api.post(`/samrat/chat/dm/${memberId}`)).data;
}

export async function getMessages(channelId: string, before?: string): Promise<{ channel: ChatChannel; messages: ChatMessage[] }> {
  return (await api.get(`/samrat/chat/channels/${channelId}/messages`, { params: before ? { before } : {} })).data;
}

export async function sendMessage(channelId: string, body: string, image_url?: string): Promise<ChatMessage> {
  return (await api.post(`/samrat/chat/channels/${channelId}/messages`, { body, image_url })).data;
}

export async function markRead(channelId: string): Promise<void> {
  await api.post(`/samrat/chat/channels/${channelId}/read`);
}

/** wss URL for the realtime receive socket, with the bearer token as a query param. */
export async function chatSocketUrl(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;
  const base = API_URL.replace(/^http/, 'ws'); // http→ws, https→wss
  return `${base}/samrat/chat/ws?token=${encodeURIComponent(token)}`;
}
