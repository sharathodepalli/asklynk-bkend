/*
  # Private Messaging System with Anonymous Names

  1. New Tables
    - `private_messages`: Stores messages between students and professors
    - `anonymous_identities`: Stores session-specific anonymous names for students

  2. Changes
    - Add message type support for private messages
    - Add anonymous identity tracking
    - Add RLS policies for privacy

  3. Security
    - Enable RLS on new tables
    - Add policies to protect student privacy
    - Ensure professors can only see messages intended for them
*/

-- Create private messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('private', 'anonymous')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  delivered_at timestamptz
);

-- Create anonymous identities table
CREATE TABLE IF NOT EXISTS anonymous_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  anonymous_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, user_id),
  UNIQUE (session_id, anonymous_name)
);

-- Enable RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_identities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_messages
CREATE POLICY "Users can send private messages"
  ON private_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = private_messages.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view their own messages"
  ON private_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid()
  );

-- RLS Policies for anonymous_identities
CREATE POLICY "Users can create their anonymous identity"
  ON anonymous_identities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = anonymous_identities.session_id
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view their own anonymous identity"
  ON anonymous_identities
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Function to generate unique anonymous name
CREATE OR REPLACE FUNCTION generate_anonymous_name(p_session_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_name text;
  v_counter integer := 1;
BEGIN
  -- First try to get existing anonymous name
  SELECT anonymous_name INTO v_name
  FROM anonymous_identities
  WHERE session_id = p_session_id AND user_id = p_user_id;
  
  -- Return existing name if found
  IF v_name IS NOT NULL THEN
    RETURN v_name;
  END IF;
  
  -- Generate new unique name
  LOOP
    v_name := 'Anonymous' || v_counter;
    
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