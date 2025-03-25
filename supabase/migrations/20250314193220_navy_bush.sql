/*
  # Add typing status support
  
  1. New Tables
    - `typing_status`
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references auth.users)
      - `is_typing` (boolean)
      - `updated_at` (timestamp)

  2. Functions
    - `set_typing_status`: Updates user's typing status in a session
    - `cleanup_typing_status`: Removes stale typing status entries

  3. Security
    - Enable RLS on typing_status table
    - Add policies for viewing and updating typing status
*/

-- Create typing status table
CREATE TABLE IF NOT EXISTS typing_status (
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_typing_status_lookup 
ON typing_status (session_id, updated_at DESC);

-- Enable RLS
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Create policies
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
      )
    )
    LIMIT 1
  )
);

CREATE POLICY "Users can update their typing status"
ON typing_status
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create function to set typing status
CREATE OR REPLACE FUNCTION set_typing_status(
  p_session_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old status if exists
  DELETE FROM typing_status
  WHERE session_id = p_session_id
  AND user_id = p_user_id;

  -- Insert new status
  INSERT INTO typing_status (session_id, user_id, is_typing, updated_at)
  VALUES (p_session_id, p_user_id, p_is_typing, now());
END;
$$;

-- Create function to cleanup stale typing status
CREATE OR REPLACE FUNCTION cleanup_typing_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove typing status older than 10 seconds
  DELETE FROM typing_status
  WHERE updated_at < now() - interval '10 seconds';
END;
$$;

-- Create trigger to automatically cleanup old typing status
CREATE OR REPLACE FUNCTION trigger_cleanup_typing_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_typing_status();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_cleanup_typing_status ON typing_status;
CREATE TRIGGER tr_cleanup_typing_status
AFTER INSERT ON typing_status
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_cleanup_typing_status();