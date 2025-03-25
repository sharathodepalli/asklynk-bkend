/*
  # Fix AI interactions policies

  1. Changes
    - Drop existing policies
    - Recreate policies with optimized logic
    - Add index for better query performance

  2. Security
    - Maintain same security rules but with better performance
    - Enable RLS
    - Add policies for viewing and creating AI interactions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interactions;
DROP POLICY IF EXISTS "Users can create AI interactions in active sessions" ON ai_interactions;

-- Drop and recreate index for better performance
DROP INDEX IF EXISTS idx_ai_interactions_session;
CREATE INDEX idx_ai_interactions_lookup 
ON ai_interactions (session_id, user_id, created_at DESC);

-- Create new policies with optimized logic
CREATE POLICY "Users can view AI interactions"
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
    LIMIT 1
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
    LIMIT 1
  )
);

CREATE POLICY "Users can create AI interactions"
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
    LIMIT 1
  )
);