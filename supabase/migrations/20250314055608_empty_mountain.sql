/*
  # Fix Duplicate Constraint Issue

  1. Changes
    - Add constraint only if it doesn't exist
    - Update view to handle anonymous messages better
    - Add additional indexes for performance

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  -- Only add the constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey'
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id);
  END IF;
END $$;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Update view to handle anonymous messages better
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  messages.*,
  CASE 
    WHEN messages.type = 'anonymous' THEN messages.anonymous_name
    ELSE profiles.full_name 
  END as display_name,
  profiles.full_name as user_full_name
FROM messages
LEFT JOIN profiles ON messages.user_id = profiles.id;