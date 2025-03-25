/*
  # Create AI interactions table

  1. New Tables
    - `ai_interactions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_message` (text)
      - `ai_response` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for session participants
*/

-- Create AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session 
ON ai_interactions (session_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view AI interactions in their sessions"
ON ai_interactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM sessions s
    LEFT JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = session_id
    AND (
      -- User is the professor
      s.professor_id = auth.uid()
      OR
      -- User is a student in an active session
      (p.role = 'student' AND s.status = 'active')
    )
  )
);

CREATE POLICY "Users can create AI interactions in active sessions"
ON ai_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
  )
);