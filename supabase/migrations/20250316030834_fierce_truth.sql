/*
  # Add Session Transcription Support

  1. New Tables
    - `session_transcripts`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `speaker_id` (uuid, references profiles)
      - `content` (text)
      - `timestamp` (timestamptz)
      - `language` (text)

    - `session_summaries`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for session participants
*/

-- Create session_transcripts table
CREATE TABLE IF NOT EXISTS session_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  language TEXT NOT NULL DEFAULT 'en-US',
  
  -- Add constraints
  CONSTRAINT valid_language CHECK (length(language) > 0)
);

-- Create session_summaries table
CREATE TABLE IF NOT EXISTS session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_transcripts_lookup 
ON session_transcripts (session_id, speaker_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_session_transcripts_timestamp 
ON session_transcripts (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_session_summaries_lookup 
ON session_summaries (session_id, created_at DESC);

-- Enable RLS
ALTER TABLE session_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for session_transcripts
CREATE POLICY "Users can view transcripts in their sessions"
ON session_transcripts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_id
    AND (
      -- User is the professor
      s.professor_id = auth.uid()
      OR
      -- User is a student in an active session
      (s.status = 'active' AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'student'
      ))
    )
  )
);

CREATE POLICY "Professors can create transcripts"
ON session_transcripts
FOR INSERT
TO authenticated
WITH CHECK (
  speaker_id = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = session_id
    AND s.status = 'active'
    AND p.role = 'professor'
  )
);

-- Create policies for session_summaries
CREATE POLICY "Users can view summaries in their sessions"
ON session_summaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_id
    AND (
      s.professor_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'student'
      )
    )
  )
);

CREATE POLICY "System can create summaries"
ON session_summaries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_id
    AND s.status = 'active'
  )
);