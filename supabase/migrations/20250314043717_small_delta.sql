/*
  # Add Message Status Tracking

  1. Changes
    - Add read_at timestamp to chat_messages table
    - Add delivered_at timestamp to chat_messages table
    - Add function to update message status
    - Add trigger to handle status updates

  2. Security
    - Maintain existing RLS policies
    - Add policy for status updates
*/

-- Add status tracking columns
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Create function to update message status
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS trigger AS $$
BEGIN
  -- Update status based on delivered_at and read_at
  IF NEW.read_at IS NOT NULL THEN
    NEW.status = 'read';
  ELSIF NEW.delivered_at IS NOT NULL THEN
    NEW.status = 'delivered';
  ELSE
    NEW.status = 'sent';
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
CREATE POLICY "Recipients can mark messages as delivered or read"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
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
  )
  WITH CHECK (
    -- Only allow updating status-related columns
    (OLD.delivered_at IS NULL AND NEW.delivered_at IS NOT NULL)
    OR
    (OLD.read_at IS NULL AND NEW.read_at IS NOT NULL)
  );