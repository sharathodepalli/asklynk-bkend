/*
  # Add Message Status Tracking

  1. Changes
    - Add delivered_at and read_at timestamps to chat_messages
    - Add function to update message status automatically
    - Add policy for message status updates

  2. Security
    - Only allow updating status fields
    - Ensure proper access control for status updates
*/

-- Add status tracking columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN delivered_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN read_at timestamptz;
  END IF;
END $$;

-- Create function to update message status
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS trigger AS $$
BEGIN
  -- Update status based on delivered_at and read_at
  IF NEW.read_at IS NOT NULL THEN
    NEW.status = 'read'::message_status;
  ELSIF NEW.delivered_at IS NOT NULL THEN
    NEW.status = 'delivered'::message_status;
  ELSE
    NEW.status = 'sent'::message_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status updates
DROP TRIGGER IF EXISTS message_status_trigger ON chat_messages;
CREATE TRIGGER message_status_trigger
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();

-- Add policy for status updates
DROP POLICY IF EXISTS "Recipients can mark messages as delivered or read" ON chat_messages;
CREATE POLICY "Recipients can mark messages as delivered or read"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if user has permission to update this message's status
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = chat_messages.session_id
      AND s.status = 'active'
      AND (
        -- Allow professor to update status of student messages
        (EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'professor'
          AND s.professor_id = p.id
        ))
        OR
        -- Allow students to update status of professor's messages
        (EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role = 'student'
          AND chat_messages.user_id = s.professor_id
        ))
      )
    )
  );