/*
  # Fix Anonymous Identities RLS and Constraints

  1. Changes
    - Drop and recreate anonymous_identities table with proper constraints
    - Add proper RLS policies
    - Update anonymous name generation function

  2. Security
    - Enable RLS
    - Add policies for insert and select
    - Ensure proper access control
*/

-- Drop existing table and recreate with proper constraints
DROP TABLE IF EXISTS anonymous_identities CASCADE;

CREATE TABLE anonymous_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  anonymous_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, anonymous_name)
);

-- Enable RLS
ALTER TABLE anonymous_identities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their anonymous identity"
  ON anonymous_identities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_id
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

-- Update function to handle anonymous name generation
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
  BEGIN
    INSERT INTO anonymous_identities (session_id, user_id, anonymous_name)
    VALUES (p_session_id, p_user_id, v_name);
    EXCEPTION WHEN unique_violation THEN
      -- If concurrent insert happened, try to get the existing name
      SELECT anonymous_name INTO v_name
      FROM anonymous_identities
      WHERE session_id = p_session_id AND user_id = p_user_id;
      
      IF v_name IS NULL THEN
        -- If still no name found, generate a new one with a higher counter
        v_counter := v_counter + 1;
        v_name := 'Anonymous Student ' || v_counter;
        INSERT INTO anonymous_identities (session_id, user_id, anonymous_name)
        VALUES (p_session_id, p_user_id, v_name);
      END IF;
  END;
  
  RETURN v_name;
END;
$$;