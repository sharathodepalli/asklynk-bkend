/*
  # Real-Time Messaging Enhancements

  1. Message Status Tracking
    - Add columns for tracking message delivery and read status
    - Add triggers for automatic status updates
    - Add RLS policies for status updates

  2. Performance Optimizations
    - Add indexes for faster message retrieval
    - Add composite indexes for status queries
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivery ON chat_messages(delivered_at) WHERE delivered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_composite ON chat_messages(session_id, created_at DESC);

-- Function to handle message status updates
CREATE OR REPLACE FUNCTION handle_message_status()
RETURNS trigger AS $$
BEGIN
  -- Update the message status based on delivered_at and read_at
  IF NEW.read_at IS NOT NULL THEN
    NEW.status = 'read'::message_status;
  ELSIF NEW.delivered_at IS NOT NULL THEN
    NEW.status = 'delivered'::message_status;
  ELSE
    NEW.status = 'sent'::message_status;
  END IF;
  
  -- Update session analytics
  UPDATE session_analytics
  SET updated_at = now()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message status updates
DROP TRIGGER IF EXISTS message_status_update_trigger ON chat_messages;
CREATE TRIGGER message_status_update_trigger
  BEFORE UPDATE OF delivered_at, read_at ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_status();

-- Add policies for message status updates
DROP POLICY IF EXISTS "Recipients can update message status" ON chat_messages;
CREATE POLICY "Recipients can update message status"
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
    -- Only allow updating status fields
    (OLD.delivered_at IS NULL AND NEW.delivered_at IS NOT NULL)
    OR
    (OLD.read_at IS NULL AND NEW.read_at IS NOT NULL)
  );