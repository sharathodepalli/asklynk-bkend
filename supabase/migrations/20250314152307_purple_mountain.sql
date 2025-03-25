/*
  # Fix Anonymous Names in Messages View

  1. Changes
    - Update view to properly handle anonymous names
    - Add missing columns to private messages view
    - Fix anonymous name generation function

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing views
DROP VIEW IF EXISTS messages_with_users;
DROP VIEW IF EXISTS private_messages_with_users;

-- Create messages view with proper anonymous name handling
CREATE VIEW messages_with_users AS
SELECT 
  m.*,
  CASE 
    WHEN m.type = 'anonymous' THEN m.anonymous_name
    ELSE p.full_name 
  END as display_name,
  p.full_name as user_full_name,
  p.role as user_role
FROM messages m
LEFT JOIN profiles p ON m.user_id = p.id;

-- Create private messages view with proper anonymous name handling
CREATE VIEW private_messages_with_users AS
SELECT 
  m.*,
  CASE 
    WHEN m.type = 'anonymous' THEN m.anonymous_name
    ELSE sender.full_name 
  END as sender_name,
  receiver.full_name as receiver_name,
  sender.role as sender_role,
  receiver.role as receiver_role
FROM private_messages m
LEFT JOIN profiles sender ON m.sender_id = sender.id
LEFT JOIN profiles receiver ON m.receiver_id = receiver.id;

-- Update anonymous name generation function
CREATE OR REPLACE FUNCTION generate_anonymous_name(p_session_id uuid, p_user_id uuid)
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
  VALUES (p_session_id, p_user_id, v_name)
  ON CONFLICT (session_id, user_id) DO UPDATE
  SET anonymous_name = EXCLUDED.anonymous_name;
  
  RETURN v_name;
END;
$$;