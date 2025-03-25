/*
  # Add Session History and Analytics

  1. Changes
    - Add session_analytics table to store session metrics
    - Add indexes for efficient querying
    - Add RLS policies for professor access

  2. Security
    - Only professors can view their own session analytics
    - Enable RLS on new table
*/

-- Create session_analytics table
CREATE TABLE IF NOT EXISTS session_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_count integer DEFAULT 0,
  message_count integer DEFAULT 0,
  ai_interaction_count integer DEFAULT 0,
  poll_count integer DEFAULT 0,
  anonymous_message_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS session_analytics_session_id_idx ON session_analytics(session_id);
CREATE INDEX IF NOT EXISTS session_analytics_updated_at_idx ON session_analytics(updated_at);

-- Enable RLS
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Professors can view their session analytics"
  ON session_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = session_analytics.session_id
      AND s.professor_id = p.id
      AND p.role = 'professor'
    )
  );

-- Function to update analytics
CREATE OR REPLACE FUNCTION update_session_analytics()
RETURNS trigger AS $$
BEGIN
  -- Update or insert analytics
  INSERT INTO session_analytics (session_id)
  VALUES (NEW.id)
  ON CONFLICT (session_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize analytics when session is created
DROP TRIGGER IF EXISTS session_analytics_trigger ON sessions;
CREATE TRIGGER session_analytics_trigger
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_analytics();

-- Add view for session history
CREATE OR REPLACE VIEW session_history AS
SELECT 
  s.*,
  sa.student_count,
  sa.message_count,
  sa.ai_interaction_count,
  sa.poll_count,
  sa.anonymous_message_count
FROM sessions s
LEFT JOIN session_analytics sa ON sa.session_id = s.id
ORDER BY s.created_at DESC;