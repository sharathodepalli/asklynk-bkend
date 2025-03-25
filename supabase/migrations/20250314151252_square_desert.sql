/*
  # Private Messaging System with Anonymous Option

  1. New Tables
    - `private_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `type` (enum: private, anonymous)
      - `status` (enum: sent, delivered, read)
      - `created_at` (timestamp)
      - `delivered_at` (timestamp)
      - `read_at` (timestamp)
      - `anonymous_name` (text)

  2. Security
    - Enable RLS on private_messages table
    - Add policies for:
      - Message creation in active sessions
      - Message viewing only for sender and receiver
      - Status updates only for receiver
*/

-- Create private messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('private', 'anonymous')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  anonymous_name text
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS private_messages_session_id_idx ON private_messages(session_id);
CREATE INDEX IF NOT EXISTS private_messages_sender_id_idx ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS private_messages_receiver_id_idx ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS private_messages_created_at_idx ON private_messages(created_at);
CREATE INDEX IF NOT EXISTS private_messages_type_idx ON private_messages(type);
CREATE INDEX IF NOT EXISTS private_messages_status_idx ON private_messages(status);

-- Enable RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can send messages in active sessions"
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

CREATE POLICY "Users can view their own messages"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

CREATE POLICY "Users can update message status"
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

-- Function to update message status
CREATE OR REPLACE FUNCTION update_private_message_status()
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

-- Create trigger for status updates
CREATE TRIGGER private_message_status_update
  BEFORE UPDATE ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_private_message_status();