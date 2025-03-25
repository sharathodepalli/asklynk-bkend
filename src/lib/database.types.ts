export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          type: 'ai' | 'public' | 'anonymous'
          content: string
          votes: number
          created_at: string
          status: 'sent' | 'delivered' | 'read'
          delivered_at: string | null
          read_at: string | null
          anonymous_name: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          type: 'ai' | 'public' | 'anonymous'
          content: string
          votes?: number
          created_at?: string
          status?: 'sent' | 'delivered' | 'read'
          delivered_at?: string | null
          read_at?: string | null
          anonymous_name?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          type?: 'ai' | 'public' | 'anonymous'
          content?: string
          votes?: number
          created_at?: string
          status?: 'sent' | 'delivered' | 'read'
          delivered_at?: string | null
          read_at?: string | null
          anonymous_name?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          code: string
          professor_id: string
          title: string
          description: string | null
          status: 'active' | 'ended'
          created_at: string
          ended_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          code: string
          professor_id: string
          title: string
          description?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          ended_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          code?: string
          professor_id?: string
          title?: string
          description?: string | null
          status?: 'active' | 'ended'
          created_at?: string
          ended_at?: string | null
          metadata?: Json
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'student' | 'professor'
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'student' | 'professor'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'student' | 'professor'
          created_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          session_id: string
          question: string
          options: string[]
          status: 'active' | 'ended'
          created_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          question: string
          options: string[]
          status?: 'active' | 'ended'
          created_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          question?: string
          options?: string[]
          status?: 'active' | 'ended'
          created_at?: string
          ended_at?: string | null
        }
      }
      poll_votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          option_index: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          option_index: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          option_index?: number
          created_at?: string
        }
      }
      private_messages: {
        Row: {
          id: string
          session_id: string
          sender_id: string
          receiver_id: string
          content: string
          type: 'private' | 'anonymous'
          status: 'sent' | 'delivered' | 'read'
          created_at: string
          delivered_at: string | null
          read_at: string | null
          anonymous_name: string | null
          anonymous_thread_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          sender_id: string
          receiver_id: string
          content: string
          type: 'private' | 'anonymous'
          status?: 'sent' | 'delivered' | 'read'
          created_at?: string
          delivered_at?: string | null
          read_at?: string | null
          anonymous_name?: string | null
          anonymous_thread_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          type?: 'private' | 'anonymous'
          status?: 'sent' | 'delivered' | 'read'
          created_at?: string
          delivered_at?: string | null
          read_at?: string | null
          anonymous_name?: string | null
          anonymous_thread_id?: string | null
        }
      }
      ai_interactions: {
        Row: {
          id: string
          session_id: string
          user_id: string
          user_message: string
          ai_response: string
          model_used: string | null
          tokens_used: number | null
          created_at: string
          response_time: string | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          user_message: string
          ai_response: string
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
          response_time?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          user_message?: string
          ai_response?: string
          model_used?: string | null
          tokens_used?: number | null
          created_at?: string
          response_time?: string | null
        }
      }
      user_ai_chats: {
        Row: {
          id: string
          user_id: string
          session_id: string
          store_chat: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          store_chat?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          store_chat?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_ai_messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      messages_with_users: {
        Row: {
          id: string
          session_id: string
          user_id: string
          type: 'ai' | 'public' | 'anonymous'
          content: string
          votes: number
          created_at: string
          status: 'sent' | 'delivered' | 'read'
          delivered_at: string | null
          read_at: string | null
          anonymous_name: string | null
          display_name: string
          user_full_name: string
          user_role: 'student' | 'professor'
        }
      }
      session_history: {
        Row: {
          id: string
          code: string
          professor_id: string
          title: string
          status: 'active' | 'ended'
          created_at: string
          ended_at: string | null
          description: string | null
          metadata: Json
          student_count: number
          message_count: number
          ai_interaction_count: number
          poll_count: number
          anonymous_message_count: number
        }
      }
    }
    Functions: {
      generate_anonymous_name: {
        Args: {
          p_session_id: string
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_user_chat: {
        Args: {
          p_user_id: string
          p_session_id: string
          p_store_chat?: boolean
        }
        Returns: string
      }
      set_typing_status: {
        Args: {
          p_session_id: string
          p_user_id: string
          p_is_typing: boolean
        }
        Returns: undefined
      }
    }
  }
}