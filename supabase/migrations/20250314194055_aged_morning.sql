/*
  # Add User-Specific AI Chat Support

  1. New Tables
    - `user_ai_chats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references sessions)
      - `store_chat` (boolean) - Whether to save chat history
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_ai_messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references user_ai_chats)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user-specific access
    - Add policies for professors to view student chats

  3. Indexes
    - Optimize for chat history retrieval
    - Optimize for message ordering
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
  -- User owns the chat
  user_id = auth.uid()
  OR
  -- Professor can view chats in their sessions
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.professor_id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "Users can create their own chats"
ON user_ai_chats
FOR INSERT
TO authenticated
WITH CHECK (
  -- User owns the chat
  user_id = auth.uid()
  AND
  -- Session exists and is active
  EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
    LIMIT 1
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
      -- User owns the chat
      c.user_id = auth.uid()
      OR
      -- Professor can view messages in their sessions
      EXISTS (
        SELECT 1
        FROM sessions s
        WHERE s.id = c.session_id
        AND s.professor_id = auth.uid()
        LIMIT 1
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
    LIMIT 1
  )
);

-- Create function to update chat updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_ai_chats
  SET updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating chat timestamp
DROP TRIGGER IF EXISTS tr_update_chat_timestamp ON user_ai_messages;
CREATE TRIGGER tr_update_chat_timestamp
AFTER INSERT ON user_ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_timestamp();

-- Create function to get or create user chat
CREATE OR REPLACE FUNCTION get_or_create_user_chat(
  p_user_id UUID,
  p_session_id UUID,
  p_store_chat BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
  END IF;

  RETURN v_chat_id;
END;
$$;