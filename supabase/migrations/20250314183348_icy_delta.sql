/*
  # Create AI Interactions Table

  1. New Tables
    - `ai_interactions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to users)
      - `user_message` (text)
      - `ai_response` (text)
      - `model_used` (text)
      - `tokens_used` (integer)
      - `created_at` (timestamptz)
      - `response_time` (interval)

  2. Security
    - Enable RLS on `ai_interactions` table
    - Add policies for:
      - Students can view interactions in their active sessions
      - Professors can view all interactions in their sessions
      - Users can create interactions in active sessions

  3. Indexes
    - Session lookup index
    - User lookup index
    - Created at index for efficient pagination
*/

-- Create AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  response_time INTERVAL,
  
  -- Add constraints
  CONSTRAINT valid_tokens CHECK (tokens_used >= 0),
  CONSTRAINT valid_response_time CHECK (response_time >= INTERVAL '0')
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session 
ON ai_interactions (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user 
ON ai_interactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at 
ON ai_interactions (created_at DESC);

-- Enable RLS
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI interactions"
ON ai_interactions
FOR SELECT
TO authenticated
USING (
  -- User is the owner of the interaction
  user_id = auth.uid()
  OR
  -- User is the professor of the session
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.professor_id = auth.uid()
  )
  OR
  -- User is a student in an active session
  EXISTS (
    SELECT 1
    FROM sessions s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = session_id
    AND s.status = 'active'
    AND p.role = 'student'
  )
);

CREATE POLICY "Users can create AI interactions in active sessions"
ON ai_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is the owner of the interaction
  user_id = auth.uid()
  AND
  -- Session exists and is active
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
  )
);

-- Create function to update session AI interaction count
CREATE OR REPLACE FUNCTION update_session_ai_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{ai_interaction_count}',
      (COALESCE((metadata->>'ai_interaction_count')::int, 0) + 1)::text::jsonb
    )
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update AI interaction count
DROP TRIGGER IF EXISTS tr_update_ai_interaction_count ON ai_interactions;
CREATE TRIGGER tr_update_ai_interaction_count
AFTER INSERT ON ai_interactions
FOR EACH ROW
EXECUTE FUNCTION update_session_ai_interaction_count();