/*
  # Add Session History and End Session Functionality

  1. Changes
    - Add function to handle session ending
    - Add trigger to update analytics when session ends
    - Add function to update message counts
    - Add trigger for message count updates

  2. Security
    - Only professors can end their own sessions
    - Only professors can view session analytics
*/

-- Function to handle session ending
CREATE OR REPLACE FUNCTION handle_session_end()
RETURNS trigger AS $$
BEGIN
  -- Update session analytics when session ends
  UPDATE session_analytics
  SET updated_at = now(),
      student_count = (
        SELECT COUNT(DISTINCT user_id)
        FROM chat_messages
        WHERE session_id = NEW.id
      ),
      message_count = (
        SELECT COUNT(*)
        FROM chat_messages
        WHERE session_id = NEW.id
        AND type = 'public'
      ),
      anonymous_message_count = (
        SELECT COUNT(*)
        FROM chat_messages
        WHERE session_id = NEW.id
        AND type = 'anonymous'
      ),
      ai_interaction_count = (
        SELECT COUNT(*)
        FROM chat_messages
        WHERE session_id = NEW.id
        AND type = 'ai'
      ),
      poll_count = (
        SELECT COUNT(*)
        FROM polls
        WHERE session_id = NEW.id
      )
  WHERE session_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session ending
DROP TRIGGER IF EXISTS session_end_trigger ON sessions;
CREATE TRIGGER session_end_trigger
  AFTER UPDATE OF status ON sessions
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status = 'ended')
  EXECUTE FUNCTION handle_session_end();

-- Function to update message counts in real-time
CREATE OR REPLACE FUNCTION update_message_counts()
RETURNS trigger AS $$
BEGIN
  -- Update message counts in session_analytics
  UPDATE session_analytics
  SET updated_at = now(),
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
DROP TRIGGER IF EXISTS message_count_trigger ON chat_messages;
CREATE TRIGGER message_count_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_counts();

-- Add policy for ending sessions
CREATE POLICY "Professors can end their own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'professor'
      AND id = sessions.professor_id
    )
  )
  WITH CHECK (
    -- Only allow updating status to 'ended' and setting ended_at
    NEW.status = 'ended'::session_status AND
    NEW.ended_at IS NOT NULL AND
    -- Ensure other fields remain unchanged
    NEW.id = OLD.id AND
    NEW.code = OLD.code AND
    NEW.title = OLD.title AND
    NEW.description = OLD.description AND
    NEW.professor_id = OLD.professor_id AND
    NEW.created_at = OLD.created_at AND
    NEW.metadata = OLD.metadata
  );