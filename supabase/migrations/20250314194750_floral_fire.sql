/*
  # Add AI Chat Tables and Functions

  1. New Tables
    - `user_ai_chats`: Stores user-specific AI chat sessions
    - `user_ai_messages`: Stores individual messages in AI chats

  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
*/

-- Create user_ai_chats table
CREATE TABLE IF NOT EXISTS user_ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  store_chat BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, session_id)
);

-- Create user_ai_messages table
CREATE TABLE IF NOT EXISTS user_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES user_ai_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_chats_lookup 
ON user_ai_chats (user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_user_ai_messages_chat 
ON user_ai_messages (chat_id, created_at);

-- Enable RLS
ALTER TABLE user_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user_ai_chats
CREATE POLICY "Users can view their own chats"
ON user_ai_chats
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.professor_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own chats"
ON user_ai_chats
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
  )
);

CREATE POLICY "Users can update their own chats"
ON user_ai_chats
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policies for user_ai_messages
CREATE POLICY "Users can view messages in their chats"
ON user_ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_ai_chats c
    WHERE c.id = chat_id
    AND (
      c.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1
        FROM sessions s
        WHERE s.id = c.session_id
        AND s.professor_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create messages in their chats"
ON user_ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_ai_chats c
    WHERE c.id = chat_id
    AND c.user_id = auth.uid()
    AND c.store_chat = true
  )
);

-- Create function to get or create user chat
CREATE OR REPLACE FUNCTION get_or_create_user_chat(
  p_user_id UUID,
  p_session_id UUID,
  p_store_chat BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id UUID;
BEGIN
  -- Try to get existing chat
  SELECT id INTO v_chat_id
  FROM user_ai_chats
  WHERE user_id = p_user_id
  AND session_id = p_session_id;

  -- Create new chat if none exists
  IF v_chat_id IS NULL THEN
    INSERT INTO user_ai_chats (user_id, session_id, store_chat)
    VALUES (p_user_id, p_session_id, p_store_chat)
    RETURNING id INTO v_chat_id;
  ELSE
    -- Update store_chat preference
    UPDATE user_ai_chats
    SET store_chat = p_store_chat
    WHERE id = v_chat_id;
  END IF;

  RETURN v_chat_id;
END;
$$;