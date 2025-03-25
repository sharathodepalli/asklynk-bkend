// import { create } from 'zustand';
// import { supabase } from '../lib/supabase';

// interface Session {
//   id: string;
//   code: string;
//   title: string;
//   description: string | null;
//   status: 'active' | 'ended';
//   metadata: Record<string, any>;
//   created_at: string;
//   ended_at: string | null;
//   student_count?: number;
//   message_count?: number;
//   ai_interaction_count?: number;
//   poll_count?: number;
//   anonymous_message_count?: number;
//   professor_id: string;
// }

// interface SessionState {
//   session: Session | null;
//   sessions: Session[];
//   isLoading: boolean;
//   error: string | null;
//   setSession: (session: Session) => void;
//   clearSession: () => void;
//   joinSession: (code: string) => Promise<void>;
//   createSession: (title: string, description?: string) => Promise<void>;
//   endSession: () => Promise<void>;
//   updateSessionMetadata: (metadata: Record<string, any>) => Promise<void>;
//   subscribeToSessionUpdates: () => void;
//   unsubscribeFromSession: () => void;
//   loadSessions: () => Promise<void>;
// }

// export const useSessionStore = create<SessionState>((set, get) => ({
//   session: null,
//   sessions: [],
//   isLoading: false,
//   error: null,

//   setSession: (session) => set({ session, error: null }),
  
//   clearSession: () => {
//     set({ session: null, error: null });
//     get().unsubscribeFromSession();
//   },
  
//   joinSession: async (code) => {
//     set({ isLoading: true, error: null });
//     try {
//       // First check if session exists and is active
//       const { data: session, error: sessionError } = await supabase
//         .from('sessions')
//         .select('*')
//         .eq('code', code.toUpperCase())
//         .eq('status', 'active')
//         .single();

//       if (sessionError) {
//         throw new Error('Invalid session code or session has ended');
//       }

//       if (!session) {
//         throw new Error('Session not found');
//       }

//       // Set the session
//       set({ session });

//       // Subscribe to real-time updates
//       get().subscribeToSessionUpdates();

//     } catch (error) {
//       set({ error: (error as Error).message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },
  
//   createSession: async (title, description) => {
//     set({ isLoading: true, error: null });
//     try {
//       const code = Math.random().toString(36).substring(2, 8).toUpperCase();
//       const user = (await supabase.auth.getUser()).data.user;
      
//       if (!user) throw new Error('Not authenticated');

//       const { data, error } = await supabase
//         .from('sessions')
//         .insert([
//           {
//             title,
//             description,
//             code,
//             professor_id: user.id,
//             metadata: {},
//           },
//         ])
//         .select()
//         .single();

//       if (error) throw error;
//       if (data) {
//         set({ session: data });
//         get().subscribeToSessionUpdates();
//         await get().loadSessions();
//       }
//     } catch (error) {
//       set({ error: (error as Error).message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   endSession: async () => {
//     const session = get().session;
//     if (!session) return;

//     set({ isLoading: true, error: null });
//     try {
//       const { error } = await supabase
//         .from('sessions')
//         .update({
//           status: 'ended',
//           ended_at: new Date().toISOString(),
//         })
//         .eq('id', session.id)
//         .eq('status', 'active'); // Only update if still active

//       if (error) throw error;
      
//       const updatedSession = { 
//         ...session, 
//         status: 'ended', 
//         ended_at: new Date().toISOString() 
//       };
      
//       set({ 
//         session: updatedSession,
//         sessions: get().sessions.map(s => 
//           s.id === session.id ? updatedSession : s
//         ),
//         error: null 
//       });
      
//       await get().loadSessions();
//     } catch (error) {
//       set({ error: (error as Error).message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   updateSessionMetadata: async (metadata) => {
//     const session = get().session;
//     if (!session) return;

//     set({ isLoading: true, error: null });
//     try {
//       const { error } = await supabase
//         .from('sessions')
//         .update({
//           metadata: { ...session.metadata, ...metadata },
//         })
//         .eq('id', session.id)
//         .eq('status', 'active'); // Only update if active

//       if (error) throw error;
//       set({
//         session: {
//           ...session,
//           metadata: { ...session.metadata, ...metadata },
//         },
//       });
//     } catch (error) {
//       set({ error: (error as Error).message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   loadSessions: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       const { data: sessions, error } = await supabase
//         .from('session_history')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       set({ sessions: sessions || [] });
//     } catch (error) {
//       set({ error: (error as Error).message });
//     } finally {
//       set({ isLoading: false });
//     }
//   },

//   subscribeToSessionUpdates: () => {
//     const session = get().session;
//     if (!session) return;

//     const subscription = supabase
//       .channel(`session:${session.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'sessions',
//           filter: `id=eq.${session.id}`,
//         },
//         (payload) => {
//           if (payload.eventType === 'UPDATE') {
//             const updatedSession = { ...get().session!, ...payload.new };
//             set({ session: updatedSession });
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       subscription.unsubscribe();
//     };
//   },

//   unsubscribeFromSession: () => {
//     const session = get().session;
//     if (session) {
//       supabase.channel(`session:${session.id}`).unsubscribe();
//     }
//   },
// }));


import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Session {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: 'active' | 'ended';
  metadata: Record<string, any>;
  created_at: string;
  ended_at: string | null;
  student_count?: number;
  message_count?: number;
  ai_interaction_count?: number;
  poll_count?: number;
  anonymous_message_count?: number;
  professor_id: string;
}

interface SessionState {
  session: Session | null;
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
  joinSession: (code: string) => Promise<void>;
  createSession: (title: string, description?: string) => Promise<void>;
  endSession: () => Promise<void>;
  updateSessionMetadata: (metadata: Record<string, any>) => Promise<void>;
  subscribeToSessionUpdates: () => void;
  unsubscribeFromSession: () => void;
  loadSessions: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  sessions: [],
  isLoading: false,
  error: null,

  setSession: (session) => set({ session, error: null }),
  
  clearSession: () => {
    set({ session: null, error: null });
    get().unsubscribeFromSession();
  },
  
  joinSession: async (code) => {
    set({ isLoading: true, error: null });
    try {
      // First check if session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'active')
        .single();

      if (sessionError) {
        throw new Error('Invalid session code or session has ended');
      }

      if (!session) {
        throw new Error('Session not found');
      }

      // Ensure the session has the correct status type
      const typedSession: Session = {
        ...session,
        status: session.status as 'active' | 'ended'
      };

      // Set the session
      set({ session: typedSession });

      // Subscribe to real-time updates
      get().subscribeToSessionUpdates();

    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  createSession: async (title, description) => {
    set({ isLoading: true, error: null });
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            title,
            description,
            code,
            professor_id: user.id,
            metadata: {},
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Ensure the session has the correct status type
        const typedSession: Session = {
          ...data,
          status: data.status as 'active' | 'ended'
        };
        
        set({ session: typedSession });
        get().subscribeToSessionUpdates();
        await get().loadSessions();
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  endSession: async () => {
    const session = get().session;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('status', 'active'); // Only update if still active

      if (error) throw error;
      
      // Create updated session with properly typed status
      const updatedSession: Session = { 
        ...session, 
        status: 'ended' as const, 
        ended_at: new Date().toISOString() 
      };
      
      // Update both session and sessions array
      set({ 
        session: updatedSession,
        // Map through sessions and update the correct one with properly typed status
        sessions: get().sessions.map(s => 
          s.id === session.id ? updatedSession : s
        ),
        error: null 
      });
      
      await get().loadSessions();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSessionMetadata: async (metadata) => {
    const session = get().session;
    if (!session) return;

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          metadata: { ...session.metadata, ...metadata },
        })
        .eq('id', session.id)
        .eq('status', 'active'); // Only update if active

      if (error) throw error;
      set({
        session: {
          ...session,
          metadata: { ...session.metadata, ...metadata },
        },
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: sessionsData, error } = await supabase
        .from('session_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to ensure status is properly typed
      const typedSessions: Session[] = (sessionsData || []).map(session => ({
        ...session,
        status: session.status as 'active' | 'ended'
      }));
      
      set({ sessions: typedSessions });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToSessionUpdates: () => {
    const session = get().session;
    if (!session) return;

    const subscription = supabase
      .channel(`session:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Ensure we maintain the correct status type
            const updatedSession: Session = { 
              ...get().session!, 
              ...payload.new,
              status: (payload.new as any).status as 'active' | 'ended'
            };
            set({ session: updatedSession });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  unsubscribeFromSession: () => {
    const session = get().session;
    if (session) {
      supabase.channel(`session:${session.id}`).unsubscribe();
    }
  },
}));