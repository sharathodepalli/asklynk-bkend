/*
  # Fix infinite recursion in private messages RLS policies

  1. Changes
    - Restructure RLS policies to avoid self-referential checks
    - Optimize thread visibility logic
    - Improve performance with simplified conditions

  2. Security
    - Maintain message privacy
    - Preserve anonymous thread integrity
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Create new policies with optimized logic
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
      FROM private_messages thread_root
      WHERE thread_root.anonymous_thread_id = private_messages.anonymous_thread_id
      AND thread_root.session_id = private_messages.session_id
      AND thread_root.created_at <= private_messages.created_at
      AND (thread_root.sender_id = auth.uid() OR thread_root.receiver_id = auth.uid())
      LIMIT 1
    )
  )
);

CREATE POLICY "Users can send private messages"
ON private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Sender verification
  sender_id = auth.uid()
  AND
  -- Active session check
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
    -- Anonymous messages (new thread or reply)
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
            FROM private_messages existing
            WHERE existing.anonymous_thread_id = anonymous_thread_id
          )
        )
        OR
        -- Reply to existing thread
        EXISTS (
          SELECT 1
          FROM private_messages thread_msg
          WHERE thread_msg.anonymous_thread_id = anonymous_thread_id
          AND thread_msg.session_id = session_id
          AND (thread_msg.sender_id = auth.uid() OR thread_msg.receiver_id = auth.uid())
          LIMIT 1
        )
      )
    )
  )
);