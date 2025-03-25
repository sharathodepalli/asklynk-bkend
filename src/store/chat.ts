// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';
// import { useAuthStore } from './auth';
// import { useSessionStore } from './session';

// interface ChatMessage {
//   id: string;
//   content: string;
//   type: 'ai' | 'public' | 'anonymous';
//   user_id: string;
//   session_id: string;
//   votes: number;
//   created_at: string;
//   delivered_at: string | null;
//   read_at: string | null;
//   status: 'sent' | 'delivered' | 'read';
//   anonymous_name?: string;
//   user_full_name?: string;
// }

// interface ChatState {
//   messages: ChatMessage[];
//   isLoading: boolean;
//   error: string | null;
//   typingUsers: Set<string>;
//   sendMessage: (content: string, type?: 'public' | 'anonymous' | 'ai') => Promise<void>;
//   upvoteMessage: (messageId: string) => Promise<void>;
//   markAsDelivered: (messageId: string) => Promise<void>;
//   markAsRead: (messageId: string) => Promise<void>;
//   setTyping: (isTyping: boolean) => Promise<void>;
//   subscribeToChat: () => void;
//   unsubscribeFromChat: () => void;
//   loadMoreMessages: () => Promise<void>;
// }

// export const useChatStore = create<ChatState>((set, get) => ({
//   messages: [],
//   isLoading: false,
//   error: null,
//   typingUsers: new Set(),

//   sendMessage: async (content, type = 'public') => {
//     const session = useSessionStore.getState().session;
//     const user = useAuthStore.getState().user;
    
//     if (!session || !user) return;

//     try {
//       let anonymousName;
//       if (type === 'anonymous') {
//         // Get or generate anonymous name
//         const { data: nameData, error: nameError } = await supabase
//           .rpc('generate_anonymous_name', {
//             p_session_id: session.id,
//             p_user_id: user.id
//           });

//         if (nameError) throw nameError;
//         anonymousName = nameData;
//       }

//       const { error } = await supabase
//         .from('messages')
//         .insert({
//           content,
//           type,
//           session_id: session.id,
//           user_id: user.id,
//           status: 'sent',
//           anonymous_name: anonymousName,
//           votes: 0
//         });

//       if (error) throw error;
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },

//   upvoteMessage: async (messageId: string) => {
//     try {
//       const { error } = await supabase
//         .from('messages')
//         .update({ votes: supabase.sql`votes + 1` })
//         .eq('id', messageId);

//       if (error) throw error;
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },

//   markAsDelivered: async (messageId: string) => {
//     try {
//       const { error } = await supabase
//         .from('messages')
//         .update({
//           status: 'delivered',
//           delivered_at: new Date().toISOString()
//         })
//         .eq('id', messageId)
//         .is('delivered_at', null);

//       if (error) throw error;
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },

//   markAsRead: async (messageId: string) => {
//     try {
//       const { error } = await supabase
//         .from('messages')
//         .update({
//           status: 'read',
//           read_at: new Date().toISOString()
//         })
//         .eq('id', messageId)
//         .is('read_at', null);

//       if (error) throw error;
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },

//   setTyping: async (isTyping: boolean) => {
//     const session = useSessionStore.getState().session;
//     const user = useAuthStore.getState().user;
    
//     if (!session || !user) return;

//     try {
//       await supabase.rpc('set_typing_status', {
//         p_session_id: session.id,
//         p_user_id: user.id,
//         p_is_typing: isTyping
//       });
//     } catch (error) {
//       console.error('Failed to update typing status:', error);
//     }
//   },

//   subscribeToChat: () => {
//     const session = useSessionStore.getState().session;
//     if (!session) return;

//     // Load initial messages
//     set({ isLoading: true });
//     supabase
//       .from('messages_with_users')
//       .select('*')
//       .eq('session_id', session.id)
//       .order('created_at', { ascending: true })
//       .then(({ data, error }) => {
//         if (error) {
//           set({ error: error.message });
//         } else {
//           set({ messages: data || [] });
//         }
//         set({ isLoading: false });
//       });

//     // Subscribe to new messages and updates
//     const messageSubscription = supabase
//       .channel(`chat:${session.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'messages',
//           filter: `session_id=eq.${session.id}`,
//         },
//         async (payload) => {
//           if (payload.eventType === 'INSERT') {
//             // Fetch the complete message with user details
//             const { data: messageData } = await supabase
//               .from('messages_with_users')
//               .select('*')
//               .eq('id', payload.new.id)
//               .single();

//             if (messageData) {
//               set({ messages: [...get().messages, messageData] });
//             }
//           } else if (payload.eventType === 'UPDATE') {
//             set({
//               messages: get().messages.map((msg) =>
//                 msg.id === payload.new.id
//                   ? { ...msg, ...payload.new }
//                   : msg
//               ),
//             });
//           }
//         }
//       )
//       .subscribe();

//     // Subscribe to typing status updates
//     const typingSubscription = supabase
//       .channel(`typing:${session.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'typing_status',
//           filter: `session_id=eq.${session.id}`,
//         },
//         (payload) => {
//           const typingUsers = new Set(get().typingUsers);
//           if (payload.new.is_typing) {
//             typingUsers.add(payload.new.user_id);
//           } else {
//             typingUsers.delete(payload.new.user_id);
//           }
//           set({ typingUsers });
//         }
//       )
//       .subscribe();

//     return () => {
//       messageSubscription.unsubscribe();
//       typingSubscription.unsubscribe();
//     };
//   },

//   unsubscribeFromChat: () => {
//     const session = useSessionStore.getState().session;
//     if (session) {
//       supabase.channel(`chat:${session.id}`).unsubscribe();
//       supabase.channel(`typing:${session.id}`).unsubscribe();
//     }
//   },

//   loadMoreMessages: async () => {
//     const session = useSessionStore.getState().session;
//     if (!session || get().isLoading) return;

//     const oldestMessage = get().messages[0];
//     if (!oldestMessage) return;

//     set({ isLoading: true });

//     try {
//       const { data, error } = await supabase
//         .from('messages_with_users')
//         .select('*')
//         .eq('session_id', session.id)
//         .lt('created_at', oldestMessage.created_at)
//         .order('created_at', { ascending: false })
//         .limit(50);

//       if (error) throw error;

//       set({
//         messages: [...(data || []).reverse(), ...get().messages],
//         isLoading: false,
//       });
//     } catch (error) {
//       set({
//         error: (error as Error).message,
//         isLoading: false,
//       });
//     }
//   },
// }));
// src/store/chat.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSessionStore } from './session';

// Modify ChatMessage to be compatible with PrivateMessage
export interface ChatMessage {
  id: string;
  content: string;
  type: 'public' | 'question' | 'anonymous';
  created_at: string;
  updated_at: string | null;
  user_id: string;
  session_id: string;
  anonymous_name?: string;
  anonymous_thread_id?: string;
  sender_id?: string; // Add this for compatibility
  receiver_id?: string; // Add this for compatibility
  delivered_at?: string | null; // Add this for compatibility
  read_at?: string | null; // Add this for compatibility
  sender?: {
    full_name: string;
  };
  // Add other compatibility fields
  votes?: number;           // Add this for compatibility
  user_full_name?: string;  // Add this for compatibility
  status?: 'sent' | 'delivered' | 'read'; // Add this for compatibility
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, type: 'public' | 'question' | 'anonymous') => Promise<void>;
  subscribeToChat: () => void;
  unsubscribeFromChat: () => void;
  
  // Add these missing methods
  markAsDelivered: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  upvoteMessage: (messageId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (content, type) => {
    const session = useSessionStore.getState().session;
    if (!session) return;
    
    set({ isLoading: true });
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      let anonymousName;
      if (type === 'anonymous') {
        // Get or generate anonymous name
        const { data: nameData, error: nameError } = await supabase
          .rpc('generate_anonymous_name', {
            p_session_id: session.id,
            p_user_id: userData.user.id
          });
          
        if (nameError) throw nameError;
        anonymousName = nameData;
      }
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content,
          type,
          session_id: session.id,
          user_id: userData.user.id,
          anonymous_name: anonymousName,
          anonymous_thread_id: type === 'anonymous' ? crypto.randomUUID() : null,
          status: 'sent' // Add status field
        });
        
      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Implement markAsDelivered
  markAsDelivered: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .is('delivered_at', null);

      if (error) throw error;
      
      // Update local state
      set({
        messages: get().messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, delivered_at: new Date().toISOString(), status: 'delivered' }
            : msg
        )
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Implement markAsRead
  markAsRead: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .is('read_at', null);

      if (error) throw error;
      
      // Update local state
      set({
        messages: get().messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString(), status: 'read' }
            : msg
        )
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Implement loadMoreMessages
  loadMoreMessages: async () => {
    const session = useSessionStore.getState().session;
    if (!session || get().isLoading || !get().messages.length) return;

    const oldestMessage = get().messages[0];
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('session_id', session.id)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        // Transform the data to include sender property
        const olderMessages = data.map(msg => ({
          ...msg,
          sender: msg.profiles ? { full_name: msg.profiles.full_name } : undefined,
          sender_id: msg.user_id,
          receiver_id: session.professor_id
        })).reverse();
        
        set({
          messages: [...olderMessages, ...get().messages],
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false
      });
    }
  },

  // Implement upvoteMessage
  upvoteMessage: async (messageId: string) => {
    try {
      // First, get the current message to get its votes
      const { data: messageData, error: fetchError } = await supabase
        .from('chat_messages')
        .select('votes')
        .eq('id', messageId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Calculate the new vote count
      const currentVotes = messageData?.votes || 0;
      const newVotes = currentVotes + 1;
      
      // Update the message with the new vote count
      const { error } = await supabase
        .from('chat_messages')
        .update({ votes: newVotes })
        .eq('id', messageId);

      if (error) throw error;
      
      // Update local state
      set({
        messages: get().messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, votes: newVotes }
            : msg
        )
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Implement setTyping
  setTyping: async (isTyping: boolean) => {
    const session = useSessionStore.getState().session;
    if (!session) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error('User not authenticated');
      }
      
      await supabase
        .from('typing_status')
        .upsert({
          session_id: session.id,
          user_id: userData.user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  },

  subscribeToChat: () => {
    const session = useSessionStore.getState().session;
    if (!session) return;
    
    set({ isLoading: true });
    
    // Load initial messages
    supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          set({ error: error.message });
        } else {
          // Transform the data to include sender property and keep TypeScript happy
          const messages = (data || []).map(msg => ({
            ...msg,
            sender: msg.profiles ? { full_name: msg.profiles.full_name } : undefined,
            // Add the following for compatibility
            sender_id: msg.user_id,
            receiver_id: session.professor_id, // Default to professor
            user_full_name: msg.profiles ? msg.profiles.full_name : undefined // Add this for compatibility
          }));
          
          set({ messages });
        }
        set({ isLoading: false });
      });
      
    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`chat:${session.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${session.id}`
      }, async (payload) => {
        // Fetch the user's name
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', payload.new.user_id)
          .single();
          
        const message = {
          ...payload.new,
          sender: data ? { full_name: data.full_name } : undefined,
          // Add the following for compatibility
          sender_id: payload.new.user_id,
          receiver_id: session.professor_id,
          user_full_name: data ? data.full_name : undefined
        } as ChatMessage;
        
        set({ messages: [...get().messages, message] });
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  },

  unsubscribeFromChat: () => {
    const session = useSessionStore.getState().session;
    if (session) {
      supabase.channel(`chat:${session.id}`).unsubscribe();
    }
  }
}));