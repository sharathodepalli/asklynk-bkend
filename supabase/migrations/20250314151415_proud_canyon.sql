/*
  # Fix Private Messages Update Policy

  1. Changes
    - Drop existing update policy
    - Recreate update policy with proper NEW reference handling
    - Maintain same security model but fix syntax

  2. Security
    - Maintain RLS security model
    - Ensure proper access control for message updates
    - Allow status updates only by receiver
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "private_messages_update_policy" ON private_messages;

-- Recreate the policy with proper syntax
CREATE POLICY "private_messages_update_policy"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (
    receiver_id = auth.uid() AND
    status IN ('delivered', 'read')
  );

-- Add additional policy for timestamp updates
CREATE POLICY "private_messages_status_update_policy"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (
    receiver_id = auth.uid() AND
    (
      (delivered_at IS NOT NULL AND status = 'delivered') OR
      (read_at IS NOT NULL AND status = 'read')
    )
  );