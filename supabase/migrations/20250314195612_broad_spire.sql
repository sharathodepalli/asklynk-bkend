/*
  # Private AI Chat Implementation

  1. Add missing indexes and constraints
  2. Add function to manage chat history
  3. Add function to check rate limits
  4. Add function to update session analytics
*/

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_ai_messages_role_lookup 
ON user_ai_messages (chat_id, role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_ai_chats_analytics 
ON user_ai_chats (session_id, created_at DESC);

-- Add function to manage chat history cleanup
CREATE OR REPLACE FUNCTION cleanup_old_chat_history(p_days INTEGER DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only delete messages from chats that don't want to store history
  DELETE FROM user_ai_messages
  WHERE chat_id IN (
    SELECT id 
    FROM user_ai_chats 
    WHERE store_chat = false
    AND created_at < now() - (p_days || ' days')::interval
  );
END;
$$;

-- Add function to check rate limits
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
  p_user_id UUID,
  p_session_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_count INTEGER;
  v_last_request TIMESTAMPTZ;
BEGIN
  -- Get request count in last minute
  SELECT 
    COUNT(*),
    MAX(created_at)
  INTO 
    v_request_count,
    v_last_request
  FROM user_ai_messages
  WHERE chat_id IN (
    SELECT id 
    FROM user_ai_chats 
    WHERE user_id = p_user_id
    AND session_id = p_session_id
  )
  AND created_at > now() - interval '1 minute';

  -- Allow request if within limits
  RETURN v_request_count < 60 OR (v_last_request < now() - interval '1 second');
END;
$$;

-- Add function to update session analytics
CREATE OR REPLACE FUNCTION update_session_ai_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update AI interaction count in session metadata
  UPDATE sessions
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{ai_interaction_count}',
    (
      SELECT COUNT(DISTINCT m.chat_id)::text::jsonb
      FROM user_ai_messages m
      JOIN user_ai_chats c ON c.id = m.chat_id
      WHERE c.session_id = NEW.session_id
    )
  )
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for analytics
DROP TRIGGER IF EXISTS tr_update_session_ai_analytics ON user_ai_chats;
CREATE TRIGGER tr_update_session_ai_analytics
AFTER INSERT ON user_ai_chats
FOR EACH ROW
EXECUTE FUNCTION update_session_ai_analytics();

-- Create scheduled job to cleanup old chat history
SELECT cron.schedule(
  'cleanup-old-chat-history',
  '0 0 * * *', -- Run daily at midnight
  $$
  SELECT cleanup_old_chat_history(30);
  $$
);