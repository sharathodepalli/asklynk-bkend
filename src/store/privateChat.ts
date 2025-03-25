// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';
// import { useAuthStore } from './auth';
// import { useSessionStore } from './session';

// interface PrivateMessage {
//   id: string;
//   content: string;
//   type: 'private' | 'anonymous';
//   status: 'sent' | 'delivered' | 'read';
//   sender_id: string;
//   receiver_id: string;
//   session_id: string;
//   created_at: string;
//   delivered_at: string | null;
//   read_at: string | null;
//   anonymous_name?: string;
//   anonymous_thread_id?: string;
//   sender?: {
//     full_name: string;
//   };
//   receiver?: {
//     full_name: string;
//   };
// }

// interface PrivateChatState {
//   messages: PrivateMessage[];
//   isLoading: boolean;
//   error: string | null;
//   sendMessage: (receiverId: string, content: string, isAnonymous?: boolean, anonymousThreadId?: string) => Promise<void>;
//   markAsDelivered: (messageId: string) => Promise<void>;
//   markAsRead: (messageId: string) => Promise<void>;
//   subscribeToPrivateChat: () => void;
//   unsubscribeFromPrivateChat: () => void;
// }

// export const usePrivateChatStore = create<PrivateChatState>((set, get) => ({
//   messages: [],
//   isLoading: false,
//   error: null,

//   sendMessage: async (receiverId: string, content: string, isAnonymous = false, anonymousThreadId?: string) => {
//     const session = useSessionStore.getState().session;
//     const user = useAuthStore.getState().user;
    
//     if (!session || !user) return;

//     try {
//       let anonymousName;
//       if (isAnonymous || anonymousThreadId) {
//         // If replying to an anonymous thread, get the original anonymous name
//         if (anonymousThreadId) {
//           const { data: threadMessage } = await supabase
//             .from('private_messages')
//             .select('anonymous_name')
//             .eq('anonymous_thread_id', anonymousThreadId)
//             .single();
          
//           anonymousName = threadMessage?.anonymous_name;
//         } else {
//           // Get or generate anonymous name for new thread
//           const { data: nameData, error: nameError } = await supabase
//             .rpc('generate_anonymous_name', {
//               p_session_id: session.id,
//               p_user_id: user.id
//             });

//           if (nameError) throw nameError;
//           anonymousName = nameData;
//         }
//       }

//       const { error } = await supabase
//         .from('private_messages')
//         .insert({
//           content,
//           session_id: session.id,
//           sender_id: user.id,
//           receiver_id: receiverId,
//           type: isAnonymous || anonymousThreadId ? 'anonymous' : 'private',
//           anonymous_name: anonymousName,
//           anonymous_thread_id: anonymousThreadId || (isAnonymous ? crypto.randomUUID() : null),
//           status: 'sent'
//         });

//       if (error) throw error;
//     } catch (error) {
//       set({ error: (error as Error).message });
//     }
//   },

//   markAsDelivered: async (messageId: string) => {
//     try {
//       const { error } = await supabase
//         .from('private_messages')
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
//         .from('private_messages')
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

//   subscribeToPrivateChat: () => {
//     const session = useSessionStore.getState().session;
//     const user = useAuthStore.getState().user;
//     if (!session || !user) return;

//     // Load initial messages
//     set({ isLoading: true });
//     supabase
//       .from('private_messages')
//       .select(`
//         *,
//         sender:profiles!private_messages_sender_id_fkey(full_name),
//         receiver:profiles!private_messages_receiver_id_fkey(full_name)
//       `)
//       .eq('session_id', session.id)
//       .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
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
//     const subscription = supabase
//       .channel(`private-chat:${session.id}:${user.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'private_messages',
//           filter: `session_id=eq.${session.id}`,
//         },
//         async (payload) => {
//           if (payload.eventType === 'INSERT') {
//             const message = payload.new as PrivateMessage;
//             if (message.sender_id === user.id || message.receiver_id === user.id) {
//               // Fetch user details
//               const { data: userData } = await supabase
//                 .from('profiles')
//                 .select('id, full_name')
//                 .in('id', [message.sender_id, message.receiver_id]);

//               const sender = userData?.find(u => u.id === message.sender_id);
//               const receiver = userData?.find(u => u.id === message.receiver_id);

//               const newMessage = {
//                 ...message,
//                 sender: sender ? { full_name: sender.full_name } : undefined,
//                 receiver: receiver ? { full_name: receiver.full_name } : undefined,
//               };

//               set({ messages: [...get().messages, newMessage] });
//             }
//           } else if (payload.eventType === 'UPDATE') {
//             set({
//               messages: get().messages.map((msg) =>
//                 msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
//               ),
//             });
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       subscription.unsubscribe();
//     };
//   },

//   unsubscribeFromPrivateChat: () => {
//     const session = useSessionStore.getState().session;
//     const user = useAuthStore.getState().user;
//     if (session && user) {
//       supabase.channel(`private-chat:${session.id}:${user.id}`).unsubscribe();
//     }
//   },
// }));
// Mock Private Chat Store for Chrome Extension
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './auth';
import { useSessionStore } from './session';

// In src/store/privateChat.ts
// Add the export keyword
export interface PrivateMessage {
  id: string;
  content: string;
  type: 'private' | 'anonymous';
  status: 'sent' | 'delivered' | 'read';
  sender_id: string;
  receiver_id: string;
  session_id: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  anonymous_name?: string;
  anonymous_thread_id?: string;
  sender?: {
    full_name: string;
  };
  receiver?: {
    full_name: string;
  };
}

interface PrivateChatState {
  messages: PrivateMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (receiverId: string, content: string, isAnonymous?: boolean, anonymousThreadId?: string) => Promise<void>;
  markAsDelivered: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  subscribeToPrivateChat: () => void;
  unsubscribeFromPrivateChat: () => void;
  loadMoreMessages: () => Promise<void>; // Added this method
}

export const usePrivateChatStore = create<PrivateChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: async (receiverId: string, content: string, isAnonymous = false, anonymousThreadId?: string) => {
    const session = useSessionStore.getState().session;
    const user = useAuthStore.getState().user;
    
    if (!session || !user) return;

    try {
      let anonymousName;
      if (isAnonymous || anonymousThreadId) {
        // If replying to an anonymous thread, get the original anonymous name
        if (anonymousThreadId) {
          const { data: threadMessage } = await supabase
            .from('private_messages')
            .select('anonymous_name')
            .eq('anonymous_thread_id', anonymousThreadId)
            .single();
          
          anonymousName = threadMessage?.anonymous_name;
        } else {
          // Get or generate anonymous name for new thread
          const { data: nameData, error: nameError } = await supabase
            .rpc('generate_anonymous_name', {
              p_session_id: session.id,
              p_user_id: user.id
            });

          if (nameError) throw nameError;
          anonymousName = nameData;
        }
      }

      const { error } = await supabase
        .from('private_messages')
        .insert({
          content,
          session_id: session.id,
          sender_id: user.id,
          receiver_id: receiverId,
          type: isAnonymous || anonymousThreadId ? 'anonymous' : 'private',
          anonymous_name: anonymousName,
          anonymous_thread_id: anonymousThreadId || (isAnonymous ? crypto.randomUUID() : null),
          status: 'sent'
        });

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  markAsDelivered: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .is('delivered_at', null);

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  markAsRead: async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadMoreMessages: async () => {
    const session = useSessionStore.getState().session;
    const user = useAuthStore.getState().user;
    const currentMessages = get().messages;
    
    if (!session || !user || !currentMessages.length || get().isLoading) return;
    
    // Get the oldest message timestamp to load messages before it
    const oldestMessageTime = currentMessages.reduce(
      (oldest, message) => {
        const messageDate = new Date(message.created_at);
        return messageDate < oldest ? messageDate : oldest;
      },
      new Date()
    );
    
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:profiles!private_messages_sender_id_fkey(full_name),
          receiver:profiles!private_messages_receiver_id_fkey(full_name)
        `)
        .eq('session_id', session.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .lt('created_at', oldestMessageTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Add messages at the beginning
        set({ 
          messages: [...data.reverse(), ...currentMessages],
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

  subscribeToPrivateChat: () => {
    const session = useSessionStore.getState().session;
    const user = useAuthStore.getState().user;
    if (!session || !user) return;

    // Load initial messages
    set({ isLoading: true });
    supabase
      .from('private_messages')
      .select(`
        *,
        sender:profiles!private_messages_sender_id_fkey(full_name),
        receiver:profiles!private_messages_receiver_id_fkey(full_name)
      `)
      .eq('session_id', session.id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          set({ error: error.message });
        } else {
          set({ messages: data || [] });
        }
        set({ isLoading: false });
      });

    // Subscribe to new messages and updates
    const subscription = supabase
      .channel(`private-chat:${session.id}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
          filter: `session_id=eq.${session.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const message = payload.new as PrivateMessage;
            if (message.sender_id === user.id || message.receiver_id === user.id) {
              // Fetch user details
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', [message.sender_id, message.receiver_id]);

              const sender = userData?.find(u => u.id === message.sender_id);
              const receiver = userData?.find(u => u.id === message.receiver_id);

              const newMessage = {
                ...message,
                sender: sender ? { full_name: sender.full_name } : undefined,
                receiver: receiver ? { full_name: receiver.full_name } : undefined,
              };

              set({ messages: [...get().messages, newMessage] });
            }
          } else if (payload.eventType === 'UPDATE') {
            set({
              messages: get().messages.map((msg) =>
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

  unsubscribeFromPrivateChat: () => {
    const session = useSessionStore.getState().session;
    const user = useAuthStore.getState().user;
    if (session && user) {
      supabase.channel(`private-chat:${session.id}:${user.id}`).unsubscribe();
    }
  },
}));