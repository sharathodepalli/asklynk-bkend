/*
  # Fix Database Policies

  1. Drop existing policies
  2. Recreate policies with optimized logic
  3. Add missing indexes
*/

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop user_ai_chats policies
  DROP POLICY IF EXISTS "Users can view their own chats" ON user_ai_chats;
  DROP POLICY IF EXISTS "Users can create their own chats" ON user_ai_chats;
  DROP POLICY IF EXISTS "Users can update their own chats" ON user_ai_chats;

  -- Drop user_ai_messages policies
  DROP POLICY IF EXISTS "Users can view messages in their chats" ON user_ai_messages;
  DROP POLICY IF EXISTS "Users can create messages in their chats" ON user_ai_messages;

  -- Drop typing_status policies
  DROP POLICY IF EXISTS "Users can view typing status in their sessions" ON typing_status;
  DROP POLICY IF EXISTS "Users can update their typing status" ON typing_status;
END $$;

-- Recreate optimized indexes
DROP INDEX IF EXISTS idx_user_ai_chats_lookup;
DROP INDEX IF EXISTS idx_user_ai_messages_chat;
DROP INDEX IF EXISTS idx_typing_status_lookup;

CREATE INDEX idx_user_ai_chats_lookup 
ON user_ai_chats (user_id, session_id, store_chat);

CREATE INDEX idx_user_ai_messages_chat 
ON user_ai_messages (chat_id, role, created_at);

CREATE INDEX idx_typing_status_lookup 
ON typing_status (session_id, user_id, is_typing, updated_at DESC);

-- Recreate policies with optimized logic
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

CREATE POLICY "Users can view typing status in their sessions"
ON typing_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
    AND (
      s.professor_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 
        FROM profiles p 
        WHERE p.id = auth.uid()
        AND p.role = 'student'
        LIMIT 1
      )
    )
  )
);

CREATE POLICY "Users can update their typing status"
ON typing_status
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());