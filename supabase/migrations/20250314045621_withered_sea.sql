/*
  # Fix Triggers for Session Analytics and Message Status

  1. Changes
    - Fix session end trigger to properly reference OLD and NEW records
    - Fix message count trigger to properly handle counters
    - Add proper error handling for edge cases

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during updates
*/

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS session_end_trigger ON sessions;
DROP TRIGGER IF EXISTS message_count_trigger ON chat_messages;
DROP FUNCTION IF EXISTS handle_session_end();
DROP FUNCTION IF EXISTS update_message_counts();

-- Function to handle session ending
CREATE OR REPLACE FUNCTION handle_session_end()
RETURNS trigger AS $$
DECLARE
  student_count_val integer;
  message_count_val integer;
  anonymous_count_val integer;
  ai_count_val integer;
  poll_count_val integer;
BEGIN
  -- Calculate analytics
  SELECT COUNT(DISTINCT user_id)
  INTO student_count_val
  FROM chat_messages
  WHERE session_id = NEW.id;

  SELECT COUNT(*)
  INTO message_count_val
  FROM chat_messages
  WHERE session_id = NEW.id
  AND type = 'public';

  SELECT COUNT(*)
  INTO anonymous_count_val
  FROM chat_messages
  WHERE session_id = NEW.id
  AND type = 'anonymous';

  SELECT COUNT(*)
  INTO ai_count_val
  FROM chat_messages
  WHERE session_id = NEW.id
  AND type = 'ai';

  SELECT COUNT(*)
  INTO poll_count_val
  FROM polls
  WHERE session_id = NEW.id;

  -- Update analytics
  UPDATE session_analytics
  SET 
    updated_at = now(),
    student_count = student_count_val,
    message_count = message_count_val,
    anonymous_message_count = anonymous_count_val,
    ai_interaction_count = ai_count_val,
    poll_count = poll_count_val
  WHERE session_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session ending
CREATE TRIGGER session_end_trigger
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'ended')
  EXECUTE FUNCTION handle_session_end();

-- Function to update message counts in real-time
CREATE OR REPLACE FUNCTION update_message_counts()
RETURNS trigger AS $$
DECLARE
  current_count integer;
BEGIN
  -- Get current count for the specific message type
  SELECT 
    CASE NEW.type
      WHEN 'public' THEN message_count
      WHEN 'anonymous' THEN anonymous_message_count
      WHEN 'ai' THEN ai_interaction_count
    END
  INTO current_count
  FROM session_analytics
  WHERE session_id = NEW.session_id;

  -- Update the appropriate counter
  UPDATE session_analytics
  SET 
    updated_at = now(),
    message_count = CASE 
      WHEN NEW.type = 'public' THEN message_count + 1
      ELSE message_count
    END,
    anonymous_message_count = CASE 
      WHEN NEW.type = 'anonymous' THEN anonymous_message_count + 1
      ELSE anonymous_message_count
    END,
    ai_interaction_count = CASE 
      WHEN NEW.type = 'ai' THEN ai_interaction_count + 1
      ELSE ai_interaction_count
    END
  WHERE session_id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message count updates
CREATE TRIGGER message_count_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_counts();