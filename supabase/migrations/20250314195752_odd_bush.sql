/*
  # Add RLS Policies for AI Chat Privacy

  1. Enable RLS on tables
  2. Add policies for user_ai_chats
  3. Add policies for user_ai_messages
*/

-- Enable RLS
ALTER TABLE user_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_messages ENABLE ROW LEVEL SECURITY;

-- Policies for user_ai_chats
CREATE POLICY "Users can view their own chats"
ON user_ai_chats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
ON user_ai_chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policies for user_ai_messages
CREATE POLICY "Users can view messages from their chats"
ON user_ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_ai_chats
    WHERE id = user_ai_messages.chat_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their chats"
ON user_ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_ai_chats
    WHERE id = user_ai_messages.chat_id
    AND user_id = auth.uid()
  )
);