/*
  # Add Voice-Activated Polls and Quizzes

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `professor_id` (uuid, references users)
      - `question` (text)
      - `options` (jsonb)
      - `created_at` (timestamptz)
      - `status` (poll_status)
      - `ended_at` (timestamptz)
      
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `professor_id` (uuid, references users)
      - `question` (text)
      - `correct_answer` (text)
      - `options` (jsonb)
      - `created_at` (timestamptz)
      - `status` (poll_status)
      - `ended_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for professors to create and manage polls/quizzes
    - Add policies for students to view and participate
*/

-- Create poll_status type if not exists
DO $$ BEGIN
  CREATE TYPE poll_status AS ENUM ('active', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  professor_id uuid REFERENCES profiles(id),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  status poll_status DEFAULT 'active',
  ended_at timestamptz,
  voice_transcript text -- Store original voice input
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  professor_id uuid REFERENCES profiles(id),
  question text NOT NULL,
  correct_answer text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  status poll_status DEFAULT 'active',
  ended_at timestamptz,
  voice_transcript text -- Store original voice input
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Professors can create polls"
ON polls
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'professor'
  )
);

CREATE POLICY "Anyone can view active polls in their session"
ON polls
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE id = polls.session_id
    AND status = 'active'
  )
);

CREATE POLICY "Professors can end polls"
ON polls
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'professor'
  )
);

-- Policies for quiz_questions
CREATE POLICY "Professors can create quizzes"
ON quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'professor'
  )
);

CREATE POLICY "Anyone can view active quizzes in their session"
ON quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE id = quiz_questions.session_id
    AND status = 'active'
  )
);

CREATE POLICY "Professors can end quizzes"
ON quiz_questions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'professor'
  )
);

-- Policies for poll_votes
CREATE POLICY "Users can vote in active polls"
ON poll_votes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls
    WHERE id = poll_votes.poll_id
    AND status = 'active'
  )
);

CREATE POLICY "Users can view poll results"
ON poll_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM polls
    WHERE id = poll_votes.poll_id
  )
);

-- Function to generate AI quiz questions
CREATE OR REPLACE FUNCTION generate_quiz_questions(
  p_topic text,
  p_session_id uuid,
  p_professor_id uuid,
  p_num_questions integer DEFAULT 5
)
RETURNS SETOF quiz_questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder. In production, you would integrate with an AI service
  -- to generate actual questions based on the topic
  RETURN QUERY
  SELECT 
    gen_random_uuid() as id,
    p_session_id as session_id,
    p_professor_id as professor_id,
    'Sample question about ' || p_topic as question,
    'Sample answer' as correct_answer,
    '["Option A", "Option B", "Option C", "Option D"]'::jsonb as options,
    now() as created_at,
    'active'::poll_status as status,
    null::timestamptz as ended_at,
    null::text as voice_transcript;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_session_lookup 
ON polls (session_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_session_lookup 
ON quiz_questions (session_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_lookup 
ON poll_votes (poll_id, created_at DESC);