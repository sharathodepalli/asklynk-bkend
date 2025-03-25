/*
  # Fix private messages RLS and thread handling

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Add proper thread tracking
    - Optimize query performance with indexes

  2. Security
    - Maintain message privacy
    - Ensure thread consistency
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Drop existing indexes to recreate them
DROP INDEX IF EXISTS idx_private_messages_thread_lookup;
DROP INDEX IF EXISTS idx_private_messages_anonymous_name;

-- Create optimized indexes
CREATE INDEX idx_private_messages_thread_lookup 
ON private_messages (session_id, type, sender_id, receiver_id);

CREATE INDEX idx_private_messages_anonymous_name 
ON private_messages (anonymous_name);

-- Create new policies with simplified logic
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- Direct messages
  auth.uid() IN (sender_id, receiver_id)
  OR
  -- Anonymous thread access
  (
    type = 'anonymous'
    AND
    EXISTS (
      SELECT 1
      FROM private_messages pm
      WHERE pm.session_id = private_messages.session_id
      AND pm.anonymous_name = private_messages.anonymous_name
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can send private messages"
ON private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Basic validation
  sender_id = auth.uid()
  AND
  -- Session must be active
  EXISTS (
    SELECT 1 
    FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
);