/*
  # Fix RLS policies for private messages

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Add proper thread handling for anonymous messages
    - Optimize indexes for better performance

  2. Security
    - Maintain message privacy
    - Allow professor replies to anonymous students
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Drop existing indexes to recreate them
DROP INDEX IF EXISTS idx_private_messages_lookup;
DROP INDEX IF EXISTS idx_private_messages_thread;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_private_messages_lookup 
ON private_messages (session_id, type, sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_private_messages_thread 
ON private_messages (anonymous_thread_id, anonymous_name);

-- Create new policies with simplified logic
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- User is either sender or receiver
  auth.uid() IN (sender_id, receiver_id)
  OR
  -- User is part of the anonymous thread
  (
    type = 'anonymous'
    AND
    EXISTS (
      SELECT 1
      FROM private_messages pm
      WHERE pm.anonymous_thread_id = private_messages.anonymous_thread_id
      AND pm.session_id = private_messages.session_id
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
      LIMIT 1
    )
  )
);

CREATE POLICY "Users can send private messages"
ON private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is the sender
  sender_id = auth.uid()
  AND
  -- Session is active
  EXISTS (
    SELECT 1 
    FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
  AND
  -- Message type validation
  (
    -- Regular private messages
    (type = 'private' AND anonymous_thread_id IS NULL)
    OR
    -- Anonymous messages
    (
      type = 'anonymous'
      AND
      (
        -- New thread
        (
          anonymous_thread_id IS NOT NULL
          AND
          NOT EXISTS (
            SELECT 1
            FROM private_messages pm
            WHERE pm.anonymous_thread_id = anonymous_thread_id
          )
        )
        OR
        -- Reply to existing thread
        EXISTS (
          SELECT 1
          FROM private_messages pm
          WHERE pm.anonymous_thread_id = anonymous_thread_id
          AND pm.session_id = session_id
          AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
          LIMIT 1
        )
      )
    )
  )
);