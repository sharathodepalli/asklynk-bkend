import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSessionStore } from './session';

interface Message {
  id: string;
  content: string;
  type: 'ai' | 'public' | 'anonymous';
  user_id: string;
  created_at: string;
  votes: number;
  status: 'sent' | 'delivered' | 'read';
}

interface MessagesState {
  messages: Message[];
  addMessage: (content: string, type: Message['type']) => Promise<void>;
  voteMessage: (messageId: string) => Promise<void>;
  subscribeToMessages: () => (() => void) | void;
  unsubscribeFromMessages: () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],

  addMessage: async (content, type) => {
    const sessionId = useSessionStore.getState().session?.id;
    if (!sessionId) return;

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          content,
          type,
          session_id: sessionId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (message) {
      set({ messages: [...get().messages, message] });
    }
  },

  voteMessage: async (messageId) => {
    // Fix for the sql issue - use raw SQL instead
    const { error } = await supabase
      .from('messages')
      .update({ votes: supabase.rpc('increment_votes', { row_id: messageId }) })
      .eq('id', messageId);

    if (error) throw error;
  },

  subscribeToMessages: () => {
    const sessionId = useSessionStore.getState().session?.id;
    if (!sessionId) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const messages = get().messages;
          
          if (payload.eventType === 'INSERT') {
            set({ messages: [...messages, payload.new as Message] });
          } else if (payload.eventType === 'UPDATE') {
            set({
              messages: messages.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  unsubscribeFromMessages: () => {
    supabase.channel('messages').unsubscribe();
  },
}));