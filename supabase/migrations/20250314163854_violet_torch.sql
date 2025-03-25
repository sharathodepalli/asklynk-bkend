/*
  # Fix private messages RLS policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Optimize thread visibility logic
    - Add proper indexes for performance

  2. Security
    - Maintain message privacy
    - Ensure thread consistency
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_private_messages_thread_lookup 
ON private_messages (session_id, anonymous_thread_id, sender_id, receiver_id);

-- Create new policies with simplified logic
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- Direct participant
  auth.uid() IN (sender_id, receiver_id)
  OR
  -- Thread participant
  (
    type = 'anonymous'
    AND
    anonymous_thread_id IN (
      SELECT DISTINCT pm.anonymous_thread_id
      FROM private_messages pm
      WHERE pm.session_id = private_messages.session_id
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can send private messages"
ON private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Basic checks
  sender_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 
    FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
  AND
  (
    -- Regular private message
    (type = 'private' AND anonymous_thread_id IS NULL)
    OR
    -- Anonymous message
    (
      type = 'anonymous'
      AND
      (
        -- New thread
        anonymous_thread_id NOT IN (
          SELECT DISTINCT anonymous_thread_id 
          FROM private_messages 
          WHERE anonymous_thread_id IS NOT NULL
        )
        OR
        -- Existing thread participant
        anonymous_thread_id IN (
          SELECT DISTINCT pm.anonymous_thread_id
          FROM private_messages pm
          WHERE pm.session_id = session_id
          AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
        )
      )
    )
  )
);