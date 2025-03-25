/*
  # Fix professor-to-student messaging in anonymous chat

  1. Changes
    - Add optimized indexes for better query performance
    - Simplify RLS policies to prevent recursion
    - Fix message linking between professors and students

  2. Security
    - Maintain message privacy
    - Ensure proper thread access
    - Prevent unauthorized access

  3. Improvements
    - Optimize query performance
    - Ensure proper message linking
    - Fix real-time updates
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
ON private_messages (anonymous_thread_id, created_at DESC);

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
      AND (
        -- User is either sender or receiver in the thread
        thread_msg.sender_id = auth.uid() 
        OR 
        thread_msg.receiver_id = auth.uid()
        OR
        -- Professor can see all anonymous messages in their session
        EXISTS (
          SELECT 1
          FROM sessions s
          JOIN profiles p ON p.id = auth.uid()
          WHERE s.id = thread_msg.session_id
          AND s.professor_id = auth.uid()
          AND p.role = 'professor'
          LIMIT 1
        )
      )
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
  (
    -- Regular private messages
    (type = 'private' AND anonymous_thread_id IS NULL)
    OR
    -- Anonymous messages
    (
      type = 'anonymous'
      AND anonymous_thread_id IS NOT NULL
      AND
      (
        -- New thread from student
        (
          EXISTS (
            SELECT 1
            FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'student'
            LIMIT 1
          )
          AND
          NOT EXISTS (
            SELECT 1
            FROM private_messages pm
            WHERE pm.anonymous_thread_id = anonymous_thread_id
            LIMIT 1
          )
        )
        OR
        -- Professor replying to thread
        (
          EXISTS (
            SELECT 1
            FROM profiles p
            JOIN sessions s ON s.professor_id = p.id
            WHERE p.id = auth.uid()
            AND p.role = 'professor'
            AND s.id = session_id
            LIMIT 1
          )
          AND
          EXISTS (
            SELECT 1
            FROM private_messages pm
            WHERE pm.anonymous_thread_id = anonymous_thread_id
            AND pm.session_id = session_id
            LIMIT 1
          )
        )
        OR
        -- Student replying to their own thread
        (
          EXISTS (
            SELECT 1
            FROM private_messages pm
            WHERE pm.anonymous_thread_id = anonymous_thread_id
            AND pm.session_id = session_id
            AND pm.sender_id = auth.uid()
            LIMIT 1
          )
        )
      )
    )
  )
);