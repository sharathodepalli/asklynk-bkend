import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSessionStore } from './session';
import { useAuthStore } from './auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface Poll {
  id: string;
  question: string;
  options: string[];
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
  voice_transcript?: string;
  duration?: number;
}

interface PollVote {
  poll_id: string;
  option_index: number;
  user_id: string;
}

interface PollsState {
  polls: Poll[];
  votes: Record<string, number[]>;
  isLoading: boolean;
  error: string | null;
  createPoll: (question: string, options: string[], voiceTranscript?: string, duration?: number) => Promise<void>;
  endPoll: (pollId: string) => Promise<void>;
  vote: (pollId: string, optionIndex: number) => Promise<void>;
  subscribeToPollUpdates: () => void;
  unsubscribeFromPolls: () => void;
  generatePollFromTopic: (topic: string) => Promise<{ question: string; options: string[] }>;
}

export const usePollsStore = create<PollsState>((set, get) => ({
  polls: [],
  votes: {},
  isLoading: false,
  error: null,

  generatePollFromTopic: async (topic: string) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
    const prompt = `Generate an engaging multiple choice poll question about ${topic}. 
      Return a JSON object with:
      - question: the poll question (make it engaging and relevant)
      - options: array of 4 possible answers (make them clear and distinct)
      Format it exactly like this example:
      {
        "question": "What is the primary cause of climate change?",
        "options": ["Deforestation", "Fossil fuel emissions", "Industrial waste", "Agricultural practices"]
      }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      const parsed = JSON.parse(response);

      // Validate response format
      if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new Error('Invalid AI response format');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to generate poll:', error);
      throw new Error('Failed to generate poll question. Please try again.');
    }
  },

  createPoll: async (question, options, voiceTranscript, duration = 30) => {
    const session = useSessionStore.getState().session;
    const user = useAuthStore.getState().user;
    
    if (!session || !user) {
      set({ error: 'No active session or user' });
      return;
    }

    if (user.role !== 'professor') {
      set({ error: 'Only professors can create polls' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data: poll, error } = await supabase
        .from('polls')
        .insert([
          {
            session_id: session.id,
            professor_id: user.id,
            question,
            options: JSON.stringify(options),
            voice_transcript: voiceTranscript,
            duration,
            metadata: { autoClose: true }
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (poll) {
        set({ polls: [...get().polls, poll] });

        // Set up auto-close timer
        if (duration > 0) {
          setTimeout(() => {
            get().endPoll(poll.id);
          }, duration * 1000);
        }
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  endPoll: async (pollId) => {
    const user = useAuthStore.getState().user;
    
    if (!user || user.role !== 'professor') {
      set({ error: 'Only professors can end polls' });
      return;
    }

    try {
      const { error } = await supabase
        .from('polls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', pollId);

      if (error) throw error;

      set({
        polls: get().polls.map((poll) =>
          poll.id === pollId
            ? { ...poll, status: 'ended', ended_at: new Date().toISOString() }
            : poll
        ),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  vote: async (pollId, optionIndex) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('poll_votes')
        .insert([
          {
            poll_id: pollId,
            option_index: optionIndex,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      // Update local vote counts
      const currentVotes = get().votes[pollId] || [];
      const newVotes = [...currentVotes];
      newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
      set({ votes: { ...get().votes, [pollId]: newVotes } });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  subscribeToPollUpdates: () => {
    const session = useSessionStore.getState().session;
    if (!session) return;

    // Load initial polls
    supabase
      .from('polls')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          set({ error: error.message });
        } else {
          set({ polls: data || [] });
        }
      });

    // Subscribe to poll changes
    const pollsSubscription = supabase
      .channel('polls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            set({ polls: [payload.new as Poll, ...get().polls] });
          } else if (payload.eventType === 'UPDATE') {
            set({
              polls: get().polls.map((poll) =>
                poll.id === payload.new.id ? { ...poll, ...payload.new } : poll
              ),
            });
          }
        }
      )
      .subscribe();

    // Subscribe to vote changes
    const votesSubscription = supabase
      .channel('poll_votes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poll_votes',
        },
        async (payload) => {
          const vote = payload.new as PollVote;
          const currentVotes = get().votes[vote.poll_id] || [];
          const newVotes = [...currentVotes];
          newVotes[vote.option_index] = (newVotes[vote.option_index] || 0) + 1;
          set({ votes: { ...get().votes, [vote.poll_id]: newVotes } });
        }
      )
      .subscribe();

    return () => {
      pollsSubscription.unsubscribe();
      votesSubscription.unsubscribe();
    };
  },

  unsubscribeFromPolls: () => {
    const session = useSessionStore.getState().session;
    if (session) {
      supabase.channel('polls').unsubscribe();
      supabase.channel('poll_votes').unsubscribe();
    }
  },
}));