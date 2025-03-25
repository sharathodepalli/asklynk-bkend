// src/utils/messageUtils.ts

import type { PrivateMessage } from '../store/privateChat';
import type { ChatMessage } from '../store/chat';

// Type guard to check if a message is a PrivateMessage
export function isPrivateMessage(message: PrivateMessage | ChatMessage): message is PrivateMessage {
  return message.type === 'private' || message.type === 'anonymous';
}

// Type guard to check if a message is a ChatMessage
export function isChatMessage(message: PrivateMessage | ChatMessage): message is ChatMessage {
  return message.type === 'public' || message.type === 'question' || message.type === 'anonymous';
}

// Safe property access helpers
export function getSenderId(message: PrivateMessage | ChatMessage): string {
  return isPrivateMessage(message) ? message.sender_id : (message.sender_id || message.user_id);
}

export function getReceiverId(message: PrivateMessage | ChatMessage): string | undefined {
  return isPrivateMessage(message) ? message.receiver_id : message.receiver_id;
}

export function getAnonymousThreadId(message: PrivateMessage | ChatMessage): string | undefined {
  return message.anonymous_thread_id;
}

export function getUserId(message: PrivateMessage | ChatMessage): string {
  return isChatMessage(message) ? message.user_id : message.sender_id;
}

// Function to safely check if a message is read
export function isMessageRead(message: PrivateMessage | ChatMessage): boolean {
  return !!message.read_at;
}

// Function to safely get the message name
export function getMessageSenderName(message: PrivateMessage | ChatMessage): string {
  if (message.type === 'anonymous') {
    return message.anonymous_name || 'Anonymous Student';
  }
  
  return message.sender?.full_name || 'Unknown User';
}