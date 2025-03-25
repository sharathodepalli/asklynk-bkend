/*
  # Private and Anonymous Chat Implementation

  1. New Tables
    - `private_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `type` (enum: 'private', 'anonymous')
      - `status` (enum: 'sent', 'delivered', 'read')
      - `created_at` (timestamp)
      - `read_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `private_messages` table
    - Add policies for:
      - Sending messages
      - Reading received messages
      - Updating message status
*/

-- Create message type enum if not exists
DO $$ BEGIN
  CREATE TYPE private_message_type AS ENUM ('private', 'anonymous');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create message status enum if not exists
DO $$ BEGIN
  CREATE TYPE private_message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create private_messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  type private_message_type NOT NULL DEFAULT 'private',
  status private_message_status NOT NULL DEFAULT 'sent',
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT different_sender_receiver CHECK (sender_id != receiver_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS private_messages_session_id_idx ON private_messages(session_id);
CREATE INDEX IF NOT EXISTS private_messages_sender_receiver_idx ON private_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS private_messages_created_at_idx ON private_messages(created_at);

-- Enable RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Policies for private messages
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
    AND auth.uid() = sender_id
  );

CREATE POLICY "Users can read messages they sent or received"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (sender_id, receiver_id)
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
    )
  );

CREATE POLICY "Users can update status of received messages"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = receiver_id
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
      AND status = 'active'
    )
  )
  WITH CHECK (
    -- Only allow updating status and read_at
    (OLD.status IS DISTINCT FROM NEW.status OR OLD.read_at IS DISTINCT FROM NEW.read_at)
    AND (
      OLD.session_id = NEW.session_id
      AND OLD.sender_id = NEW.sender_id
      AND OLD.receiver_id = NEW.receiver_id
      AND OLD.content = NEW.content
      AND OLD.type = NEW.type
      AND OLD.created_at = NEW.created_at
    )
  );