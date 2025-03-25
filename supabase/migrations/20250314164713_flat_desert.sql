/*
  # Fix private messages permissions

  1. Changes
    - Simplify RLS policies to basic permission checks
    - Remove complex thread validation
    - Ensure proper anonymous message handling

  2. Security
    - Maintain message privacy
    - Allow proper thread access
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their private messages" ON private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON private_messages;

-- Drop existing indexes to recreate them
DROP INDEX IF EXISTS idx_private_messages_thread_lookup;
DROP INDEX IF EXISTS idx_private_messages_anonymous_name;

-- Create optimized indexes
CREATE INDEX idx_private_messages_lookup 
ON private_messages (session_id, type, sender_id, receiver_id);

CREATE INDEX idx_private_messages_thread 
ON private_messages (anonymous_name, anonymous_thread_id);

-- Create new policies with basic permission checks
CREATE POLICY "Users can view their private messages"
ON private_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (sender_id, receiver_id)
);

CREATE POLICY "Users can send private messages"
ON private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 
    FROM sessions 
    WHERE id = session_id 
    AND status = 'active'
  )
);