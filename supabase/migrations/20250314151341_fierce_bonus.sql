/*
  # Fix Private Messages Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper naming and conditions
    - Add additional policy for message updates

  2. Security
    - Maintain RLS security model
    - Ensure proper access control for private messages
    - Allow status updates only by receiver
*/

-- First drop all existing policies
DROP POLICY IF EXISTS "Users can send messages in active sessions" ON private_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON private_messages;
DROP POLICY IF EXISTS "Users can update message status" ON private_messages;

-- Recreate policies with unique names
CREATE POLICY "private_messages_insert_policy"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "private_messages_select_policy"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

CREATE POLICY "private_messages_update_policy"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (
    receiver_id = auth.uid()
  )
  WITH CHECK (
    receiver_id = auth.uid() AND
    (
      NEW.status IN ('delivered', 'read') OR
      NEW.delivered_at IS NOT NULL OR
      NEW.read_at IS NOT NULL
    )
  );