/*
  # Fix Database Functions and Tables

  1. Changes
    - Add missing `set_typing_status` function
    - Add missing `typing_status` table
    - Add proper indexes and policies

  2. Security
    - Enable RLS on new table
    - Add appropriate policies
*/

-- Create typing status table if it doesn't exist
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_typing_status_lookup 
ON typing_status (session_id, user_id, updated_at DESC);

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
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update typing status
  INSERT INTO typing_status (session_id, user_id, is_typing, updated_at)
  VALUES (p_session_id, p_user_id, p_is_typing, now())
  ON CONFLICT (session_id, user_id)
  DO UPDATE SET 
    is_typing = p_is_typing,
    updated_at = now();

  -- Cleanup old typing status
  DELETE FROM typing_status
  WHERE updated_at < now() - interval '10 seconds';
END;
$$;