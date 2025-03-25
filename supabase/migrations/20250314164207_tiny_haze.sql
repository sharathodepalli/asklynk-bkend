/*
  # Fix private messages RLS and anonymous thread handling

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

-- Create optimized indexes
DROP INDEX IF EXISTS idx_private_messages_thread_lookup;
CREATE INDEX idx_private_messages_thread_lookup 
ON private_messages (session_id, type, anonymous_thread_id, sender_id, receiver_id);

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
    anonymous_thread_id IN (
      SELECT DISTINCT anonymous_thread_id
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
  AND
  (
    -- Regular private messages
    (type = 'private' AND anonymous_thread_id IS NULL)
    OR
    -- Anonymous messages
    (
      type = 'anonymous'
      AND
      (
        -- Allow replies to existing threads
        anonymous_thread_id IN (
          SELECT DISTINCT anonymous_thread_id
          FROM private_messages pm
          WHERE pm.session_id = session_id
          AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
        )
        OR
        -- Allow new threads
        NOT EXISTS (
          SELECT 1
          FROM private_messages pm
          WHERE pm.anonymous_thread_id = anonymous_thread_id
        )
      )
    )
  )
);