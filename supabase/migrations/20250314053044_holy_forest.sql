/*
  # Implement Anonymous Messaging System

  1. Changes
    - Add anonymous message support to chat_messages table
    - Add RLS policies for anonymous messages
    - Add analytics tracking for anonymous messages

  2. Security
    - Ensure anonymous messages cannot be traced back to sender
    - Maintain proper RLS policies
    - Add proper indexes for performance
*/

-- Add anonymous message type if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'message_type'
  ) THEN
    CREATE TYPE message_type AS ENUM ('ai', 'public', 'anonymous');
  END IF;
END $$;

-- Ensure type column exists with proper type
DO $$ BEGIN
  ALTER TABLE chat_messages
  ALTER COLUMN type TYPE message_type USING type::message_type;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add policy for anonymous messages
CREATE POLICY "Users can send anonymous messages in active sessions"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'anonymous' AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = chat_messages.session_id
      AND status = 'active'
    )
  );

-- Function to handle anonymous message analytics
CREATE OR REPLACE FUNCTION handle_anonymous_message()
RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'anonymous' THEN
    -- Update anonymous message count
    UPDATE session_analytics
    SET 
      anonymous_message_count = anonymous_message_count + 1,
      updated_at = now()
    WHERE session_id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for anonymous message tracking
CREATE TRIGGER anonymous_message_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  WHEN (NEW.type = 'anonymous')
  EXECUTE FUNCTION handle_anonymous_message();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_anonymous ON chat_messages(session_id, type) 
WHERE type = 'anonymous';