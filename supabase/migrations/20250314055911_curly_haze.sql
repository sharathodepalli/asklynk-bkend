/*
  # Fix Message Relationships and Views

  1. Changes
    - Drop and recreate messages_with_users view with proper relationships
    - Add missing indexes and constraints
    - Update RLS policies for better security
    - Add proper handling for anonymous messages

  2. Security
    - Maintain existing RLS policies
    - Add additional checks for message visibility
*/

-- First drop the existing view if it exists
DROP VIEW IF EXISTS messages_with_users;

-- Recreate the messages table with proper constraints
CREATE TABLE IF NOT EXISTS messages_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  type message_type NOT NULL,
  content text NOT NULL,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  status message_status DEFAULT 'sent'::message_status,
  delivered_at timestamptz,
  read_at timestamptz,
  anonymous_name text
);

-- Copy data if messages table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    INSERT INTO messages_new 
    SELECT * FROM messages;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS messages;
ALTER TABLE messages_new RENAME TO messages;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages(type);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create the view with proper relationships
CREATE VIEW messages_with_users AS
SELECT 
  m.*,
  CASE 
    WHEN m.type = 'anonymous' THEN COALESCE(m.anonymous_name, 'Anonymous')
    ELSE p.full_name 
  END as display_name,
  p.full_name as user_full_name,
  p.role as user_role
FROM messages m
LEFT JOIN profiles p ON m.user_id = p.id;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view messages in their sessions" ON messages;
CREATE POLICY "Users can view messages in their sessions"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.status = 'active' OR messages.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create messages in active sessions" ON messages;
CREATE POLICY "Users can create messages in active sessions"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.status = 'active'
    )
  );

-- Function to update message status
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS message_status_update ON messages;
CREATE TRIGGER message_status_update
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();