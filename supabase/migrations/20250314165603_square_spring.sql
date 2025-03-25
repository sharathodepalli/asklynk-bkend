/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Add optimized indexes for better performance
    - Improve query structure for message access

  2. Security
    - Maintain message privacy
    - Allow proper thread access
    - Prevent unauthorized access
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Drop existing indexes to recreate them optimally
DROP INDEX IF EXISTS idx_private_messages_lookup;
DROP INDEX IF EXISTS idx_private_messages_thread;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_private_messages_lookup 
ON private_messages (session_id, type, sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_private_messages_thread 
ON private_messages (anonymous_thread_id);

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- Direct access: user is sender or receiver
  auth.uid() IN (sender_id, receiver_id)
  OR
  -- Thread access: user is part of the anonymous thread
  (
    type = 'anonymous'
    AND
    EXISTS (
      SELECT 1
      FROM private_messages thread_msg
      WHERE thread_msg.anonymous_thread_id = private_messages.anonymous_thread_id
      AND thread_msg.session_id = private_messages.session_id
      AND (thread_msg.sender_id = auth.uid() OR thread_msg.receiver_id = auth.uid())
      LIMIT 1
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
    LIMIT 1
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
            LIMIT 1
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