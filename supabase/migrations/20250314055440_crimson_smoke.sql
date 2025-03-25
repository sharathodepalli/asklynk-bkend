/*
  # Fix Messages and Profiles Relationship

  1. Changes
    - Add foreign key relationship between messages and profiles
    - Update messages table structure
    - Add proper constraints and indexes

  2. Security
    - Maintain existing RLS policies
*/

-- Add user_id foreign key constraint to messages table
ALTER TABLE messages
ADD CONSTRAINT messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);

-- Update messages table to include proper user relationship
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  messages.*,
  profiles.full_name as user_full_name
FROM messages
LEFT JOIN profiles ON messages.user_id = profiles.id;

-- Update existing policies to use the new relationship
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
      AND sessions.status = 'active'
    )
  );