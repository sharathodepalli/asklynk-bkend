/*
  # Fix RLS policies for private messages

  1. Changes
    - Update RLS policies to handle anonymous messages correctly
    - Ensure students can see professor replies in their anonymous threads
    - Add policies for anonymous thread visibility

  2. Security
    - Messages are only visible to the sender and receiver
    - Anonymous messages are linked by thread_id
    - Professors can only see messages sent to them
    - Students can only see their own messages and replies
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Create new policies
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- User is either the sender or receiver
  (auth.uid() IN (sender_id, receiver_id))
  OR
  -- User can see messages in their anonymous thread
  (
    type = 'anonymous' 
    AND anonymous_thread_id IN (
      SELECT anonymous_thread_id 
      FROM private_messages 
      WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
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
  -- Session exists and is active
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
);