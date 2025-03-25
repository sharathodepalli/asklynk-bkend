/*
  # Fix Private Messages Visibility

  1. Changes
    - Update RLS policies for private messages
    - Ensure messages are only visible to sender and intended receiver
    - Fix anonymous identity handling

  2. Security
    - Enforce strict access control
    - Prevent unauthorized message access
    - Maintain message privacy
*/

-- Drop existing policies to recreate them with proper visibility rules
DROP POLICY IF EXISTS "private_messages_select_policy" ON private_messages;
DROP POLICY IF EXISTS "private_messages_insert_policy" ON private_messages;
DROP POLICY IF EXISTS "private_messages_update_policy" ON private_messages;
DROP POLICY IF EXISTS "private_messages_status_update_policy" ON private_messages;

-- Create new policies with proper visibility rules
CREATE POLICY "private_messages_select_policy"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
      AND (status = 'active' OR private_messages.created_at <= ended_at)
    )
  );

CREATE POLICY "private_messages_insert_policy"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "private_messages_update_policy"
  ON private_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (
    receiver_id = auth.uid() AND
    (status IN ('delivered', 'read'))
  );

-- Create view for private messages with user details
CREATE OR REPLACE VIEW private_messages_with_users AS
SELECT 
  m.*,
  CASE 
    WHEN m.type = 'anonymous' THEN COALESCE(m.anonymous_name, 'Anonymous')
    ELSE sender.full_name 
  END as sender_name,
  receiver.full_name as receiver_name,
  sender.role as sender_role,
  receiver.role as receiver_role
FROM private_messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN profiles receiver ON m.receiver_id = receiver.id;

-- Function to generate unique anonymous name per session
CREATE OR REPLACE FUNCTION generate_session_anonymous_name(p_session_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name text;
  v_counter integer := 1;
BEGIN
  -- First try to get existing anonymous name for this session
  SELECT anonymous_name INTO v_name
  FROM anonymous_identities
  WHERE session_id = p_session_id AND user_id = p_user_id;
  
  -- Return existing name if found
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- Generate new unique name
  LOOP
    v_name := 'Anonymous Student ' || v_counter;
    
    -- Check if name is unique in this session
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM anonymous_identities
      WHERE session_id = p_session_id AND anonymous_name = v_name
    );
    
    v_counter := v_counter + 1;
  END LOOP;
  
  -- Insert new anonymous identity
  INSERT INTO anonymous_identities (session_id, user_id, anonymous_name)
  VALUES (p_session_id, p_user_id, v_name);
  
  RETURN v_name;
END;
$$;