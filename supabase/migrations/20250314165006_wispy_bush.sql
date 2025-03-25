/*
  # Fix professor messages and optimize message threading

  1. Changes
    - Simplify message threading structure
    - Add proper indexes for efficient lookups
    - Optimize RLS policies for better performance

  2. Security
    - Maintain message privacy
    - Ensure proper thread access
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
    anonymous_thread_id IN (
      SELECT DISTINCT pm.anonymous_thread_id
      FROM private_messages pm
      WHERE pm.anonymous_thread_id IS NOT NULL
      AND (pm.sender_id = auth.uid() OR pm.receiver_id = auth.uid())
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
);