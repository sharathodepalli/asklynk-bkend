import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSessionStore } from './session';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { LRUCache } from 'lru-cache';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AIState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  storeChat: boolean;
  setStoreChat: (store: boolean) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  clearMessages: () => void;
}

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Configure safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Initialize LRU cache for responses
const responseCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 60,
});

// Rate limiting configuration
const rateLimits = {
  maxRequestsPerMinute: 60,
  requestCount: 0,
  lastReset: Date.now(),
  backoffTime: 1000,
  maxBackoffTime: 32000,
  cooldownUntil: 0,
};

// Reset rate limit counter every minute
setInterval(() => {
  if (Date.now() >= rateLimits.cooldownUntil) {
    rateLimits.requestCount = 0;
    rateLimits.lastReset = Date.now();
    rateLimits.backoffTime = 1000;
  }
}, 60000);

// Helper function to check rate limits
const checkRateLimit = async (): Promise<void> => {
  if (Date.now() < rateLimits.cooldownUntil) {
    const waitTime = rateLimits.cooldownUntil - Date.now();
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return checkRateLimit();
  }

  if (Date.now() - rateLimits.lastReset >= 60000) {
    rateLimits.requestCount = 0;
    rateLimits.lastReset = Date.now();
    rateLimits.backoffTime = 1000;
  }

  if (rateLimits.requestCount >= rateLimits.maxRequestsPerMinute) {
    await new Promise(resolve => setTimeout(resolve, rateLimits.backoffTime));
    rateLimits.backoffTime = Math.min(
      rateLimits.backoffTime * 2,
      rateLimits.maxBackoffTime
    );
    return checkRateLimit();
  }

  rateLimits.requestCount++;
};

// Helper function to generate cache key
const generateCacheKey = (userId: string, sessionId: string, messages: Message[]): string => {
  return `${userId}:${sessionId}:${messages.map(m => `${m.role}:${m.content}`).join('|')}`;
};

// Helper function to summarize context
const summarizeContext = (messages: Message[]): string => {
  if (messages.length <= 4) {
    return messages.map(m => `${m.role}: ${m.content}`).join('\n');
  }

  return [
    messages[0],
    { role: 'system', content: `[Previous conversation summarized: ${messages.length - 4} messages omitted]` },
    ...messages.slice(-3)
  ].map(m => `${m.role}: ${m.content}`).join('\n');
};

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  storeChat: true,

  setStoreChat: async (store: boolean) => {
    const session = useSessionStore.getState().session;
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!session || !user) return;

    try {
      const { data: chat } = await supabase
        .rpc('get_or_create_user_chat', {
          p_user_id: user.id,
          p_session_id: session.id,
          p_store_chat: store
        });

      if (chat) {
        set({ storeChat: store });
      }
    } catch (error) {
      console.error('Failed to update chat storage preference:', error);
    }
  },

  sendMessage: async (content: string) => {
    const session = useSessionStore.getState().session;
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!session || !user) return;

    set({ isLoading: true, error: null });

    try {
      // Get or create user chat
      const { data: chatId } = await supabase
        .rpc('get_or_create_user_chat', {
          p_user_id: user.id,
          p_session_id: session.id,
          p_store_chat: get().storeChat
        });

      if (!chatId) throw new Error('Failed to create chat');

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };

      set({ messages: [...get().messages, userMessage] });

      // Store user message if enabled
      if (get().storeChat) {
        await supabase
          .from('user_ai_messages')
          .insert({
            chat_id: chatId,
            role: 'user',
            content
          });
      }

      // Prepare context
      const context = `
        Session: ${session.title}
        Description: ${session.description || 'No description provided'}
        Status: ${session.status}
        Current Time: ${new Date().toLocaleString()}
      `;

      // Generate cache key
      const cacheKey = generateCacheKey(user.id, session.id, get().messages);
      
      // Check cache
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cachedResponse,
          created_at: new Date().toISOString(),
        };
        set({ messages: [...get().messages, aiMessage] });

        // Store AI message if enabled
        if (get().storeChat) {
          await supabase
            .from('user_ai_messages')
            .insert({
              chat_id: chatId,
              role: 'assistant',
              content: cachedResponse
            });
        }
        return;
      }

      // Check rate limits
      await checkRateLimit();

      const aiMessageId = crypto.randomUUID();
      let aiResponse = '';

      // Add empty AI message
      set({
        messages: [
          ...get().messages,
          {
            id: aiMessageId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          },
        ],
      });

      // Initialize Gemini model
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro-002',
        safetySettings,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        },
      });

      // Prepare chat history
      const chatHistory = summarizeContext(get().messages);

      const startTime = Date.now();

      try {
        // Get AI response
        const result = await model.generateContent([
          {
            text: `You are an AI teaching assistant for a class session. Here's the context:\n${context}\n\nRespond to student questions with clear, concise answers. Use markdown formatting when appropriate.`,
          },
          {
            text: "I understand. I'll help students with their questions about the class session, providing clear explanations and using markdown formatting when it helps clarify the content.",
          },
          {
            text: chatHistory,
          },
          {
            text: content,
          },
        ]);

        const response = await result.response;
        aiResponse = response.text();

        // Update message content
        set({
          messages: get().messages.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: aiResponse }
              : msg
          ),
        });

        // Store AI message if enabled
        if (get().storeChat) {
          await supabase
            .from('user_ai_messages')
            .insert({
              chat_id: chatId,
              role: 'assistant',
              content: aiResponse
            });
        }

        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Cache response
        responseCache.set(cacheKey, aiResponse);

      } catch (error: any) {
        if (error.message?.includes('quota')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message?.includes('blocked')) {
          throw new Error('Response was blocked by safety settings. Please rephrase your question.');
        } else if (error.message?.includes('model not found')) {
          throw new Error('The AI model is temporarily unavailable. Please try again later.');
        } else {
          console.error('Gemini API Error:', error);
          throw new Error('Failed to get AI response. Please try again.');
        }
      }

    } catch (error: any) {
      let errorMessage = 'Failed to get AI response. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      set({ error: errorMessage });
      
      // Update rate limits on error
      rateLimits.requestCount = rateLimits.maxRequestsPerMinute;
      rateLimits.backoffTime = Math.min(
        rateLimits.backoffTime * 2,
        rateLimits.maxBackoffTime
      );
    } finally {
      set({ isLoading: false });
    }
  },

  loadMessages: async () => {
    const session = useSessionStore.getState().session;
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!session || !user) return;

    set({ isLoading: true, error: null });

    try {
      // Get user's chat
      const { data: chat } = await supabase
        .from('user_ai_chats')
        .select('id, store_chat')
        .eq('user_id', user.id)
        .eq('session_id', session.id)
        .single();

      if (chat) {
        set({ storeChat: chat.store_chat });

        // Load chat messages
        const { data: messages } = await supabase
          .from('user_ai_messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });

        if (messages) {
          set({
            messages: messages.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              created_at: msg.created_at,
            })),
          });
        }
      } else {
        set({ messages: [], storeChat: true });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
}));