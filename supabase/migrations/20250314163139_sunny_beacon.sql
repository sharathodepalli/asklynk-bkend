/*
  # Fix private messages RLS policies

  1. Changes
    - Update RLS policies to handle anonymous messages correctly
    - Add policies for thread-based visibility
    - Ensure proper access control for professors and students

  2. Security
    - Messages are only visible to intended participants
    - Anonymous threads maintain privacy
    - Session-based access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Create new policies
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  -- User is either the sender or receiver
  auth.uid() IN (sender_id, receiver_id)
  OR
  -- User can see messages in their anonymous thread
  (
    EXISTS (
      SELECT 1 FROM private_messages pm
      WHERE pm.anonymous_thread_id = private_messages.anonymous_thread_id
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
  -- Session exists and is active
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
  AND
  -- For anonymous messages, ensure thread consistency
  (
    (type = 'anonymous' AND anonymous_thread_id IS NOT NULL)
    OR
    type = 'private'
  )
);