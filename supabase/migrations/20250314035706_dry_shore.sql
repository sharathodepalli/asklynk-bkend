/*
  # Chat Messages Table with Profile Relationships

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `type` (message_type)
      - `votes` (integer)
      - `created_at` (timestamp)
      - `status` (message_status)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for:
      - Sending messages in active sessions
      - Reading messages in active sessions
*/

-- Create message type enum if not exists
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('ai', 'public', 'anonymous');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create message status enum if not exists
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  type message_type NOT NULL DEFAULT 'public',
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  status message_status DEFAULT 'sent'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat messages
CREATE POLICY "Users can send messages in active sessions"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = chat_messages.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can read messages in active sessions"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = chat_messages.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);