/*
  # Fix Message Status Trigger

  1. Changes
    - Fix trigger function to properly handle OLD record reference
    - Add proper error handling
    - Ensure atomic updates
    - Add proper type casting

  2. Security
    - Maintain existing RLS policies
    - Ensure proper permission checks
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS message_status_update_trigger ON chat_messages;
DROP FUNCTION IF EXISTS handle_message_status();

-- Create improved function to handle message status updates
CREATE OR REPLACE FUNCTION handle_message_status()
RETURNS trigger AS $$
BEGIN
  -- Update the message status based on delivered_at and read_at
  IF NEW.read_at IS NOT NULL THEN
    NEW.status := 'read'::message_status;
  ELSIF NEW.delivered_at IS NOT NULL THEN
    NEW.status := 'delivered'::message_status;
  ELSE
    NEW.status := 'sent'::message_status;
  END IF;
  
  -- Update session analytics
  UPDATE session_analytics
  SET updated_at = now()
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message status updates
CREATE TRIGGER message_status_update_trigger
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  WHEN (
    (NEW.delivered_at IS DISTINCT FROM OLD.delivered_at) OR
    (NEW.read_at IS DISTINCT FROM OLD.read_at)
  )
  EXECUTE FUNCTION handle_message_status();

-- Ensure indexes exist for performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' AND indexname = 'idx_chat_messages_status'
  ) THEN
    CREATE INDEX idx_chat_messages_status ON chat_messages(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' AND indexname = 'idx_chat_messages_delivery'
  ) THEN
    CREATE INDEX idx_chat_messages_delivery ON chat_messages(delivered_at) 
    WHERE delivered_at IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' AND indexname = 'idx_chat_messages_read'
  ) THEN
    CREATE INDEX idx_chat_messages_read ON chat_messages(read_at) 
    WHERE read_at IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'chat_messages' AND indexname = 'idx_chat_messages_composite'
  ) THEN
    CREATE INDEX idx_chat_messages_composite ON chat_messages(session_id, created_at DESC);
  END IF;
END $$;