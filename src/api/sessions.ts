// src/api/sessions.ts
// This file provides API functions for session management that can be called from both
// your web app and your Chrome extension

import { supabase } from '../lib/supabase';

// Session interface (same as in your Zustand store)
export interface Session {
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

// API functions that can be called from both your web app and Chrome extension
export const SessionAPI = {
  // Get sessions for a professor
  async getProfessorSessions(professorId: string): Promise<Session[]> {
    try {
      // First verify the session to ensure the user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Fetch the sessions from the session_history view
      const { data: sessionsData, error } = await supabase
        .from('session_history')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to ensure status is properly typed
      const typedSessions: Session[] = (sessionsData || []).map(session => ({
        ...session,
        status: session.status as 'active' | 'ended'
      }));
      
      return typedSessions;
    } catch (error) {
      console.error('Error fetching professor sessions:', error);
      throw error;
    }
  },
  
  // Get a specific session by ID
  async getSessionById(sessionId: string): Promise<Session> {
    try {
      // First verify the session to ensure the user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Fetch the session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          throw new Error('Session not found');
        }
        throw sessionError;
      }
      
      // Get additional session statistics
      
      // Get student count
      const { count: studentCount } = await supabase
        .from('student_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      
      // Get message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      
      // Get AI interaction count
      const { count: aiInteractionCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('type', 'ai');
      
      // Get poll count
      const { count: pollCount } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
      
      // Return session with statistics
      const enhancedSession: Session = {
        ...session,
        status: session.status as 'active' | 'ended',
        student_count: studentCount || 0,
        message_count: messageCount || 0,
        ai_interaction_count: aiInteractionCount || 0,
        poll_count: pollCount || 0
      };
      
      return enhancedSession;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  },
  
  // Create a new session
  async createSession(title: string, description?: string): Promise<Session> {
    try {
      // First verify the session to ensure the user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user) {
        throw new Error('Not authenticated');
      }
      
      // Generate a random session code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create the session
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            title,
            description,
            code,
            professor_id: userData.user.id,
            metadata: {},
          },
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Return the created session
      const newSession: Session = {
        ...data,
        status: data.status as 'active' | 'ended',
        student_count: 0,
        message_count: 0,
        ai_interaction_count: 0,
        poll_count: 0
      };
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  // End a session
  async endSession(sessionId: string): Promise<Session> {
    try {
      // First verify the session to ensure the user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData.user) {
        throw new Error('Not authenticated');
      }
      
      // End the session
      const { data, error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('status', 'active') // Only update if still active
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // If no data was returned, the session was already ended
      if (!data) {
        throw new Error('Session is already ended');
      }
      
      return {
        ...data,
        status: 'ended' as const
      };
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }
};