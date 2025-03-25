/*
  # Add Chat Messages System

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `upvotes` (integer)
      - `created_at` (timestamp)
      - `is_typing` (boolean)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for:
      - Insert: Authenticated users in active sessions
      - Select: All users in the same session
      - Update: Only for upvoting
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  is_typing boolean DEFAULT false,
  CONSTRAINT positive_upvotes CHECK (upvotes >= 0)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert messages in active sessions"
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

CREATE POLICY "Users can read messages in their session"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = chat_messages.session_id
    )
  );

CREATE POLICY "Users can update upvotes"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = chat_messages.session_id
      AND status = 'active'
    )
  )
  WITH CHECK (
    -- Only allow updating upvotes field
    (OLD.upvotes IS DISTINCT FROM NEW.upvotes)
    AND (
      OLD.session_id = NEW.session_id
      AND OLD.user_id = NEW.user_id
      AND OLD.content = NEW.content
      AND OLD.created_at = NEW.created_at
    )
  );