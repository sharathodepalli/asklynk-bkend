/*
  # Anonymous Messages Enhancement

  1. Changes
    - Add anonymous_name column to messages table
    - Add message status tracking
    - Add delivered_at and read_at timestamps

  2. Security
    - Update RLS policies for anonymous messages
*/

-- Add anonymous_name column to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS anonymous_name text,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Update messages RLS policies
CREATE POLICY "Users can view anonymous messages in their sessions"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.status = 'active'
    )
  );

-- Function to handle message status updates
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL THEN
    NEW.status = 'delivered';
  END IF;
  
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.status = 'read';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message status updates
CREATE TRIGGER message_status_update
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();