/*
  # Add polls and enhance sessions

  1. New Tables
    - `polls`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `question` (text)
      - `options` (jsonb array of options)
      - `status` (enum: active, ended)
      - `created_at` (timestamp)
      - `ended_at` (timestamp)

    - `poll_votes`
      - `id` (uuid, primary key)
      - `poll_id` (uuid, references polls)
      - `user_id` (uuid, references auth.users)
      - `option_index` (integer)
      - `created_at` (timestamp)

  2. Changes
    - Add `description` to sessions table
    - Add `metadata` to sessions for additional data

  3. Security
    - Enable RLS on new tables
    - Add policies for poll creation and voting
*/

-- Create poll status type
CREATE TYPE poll_status AS ENUM ('active', 'ended');

-- Add new columns to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  status poll_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Anyone can view active polls in their session"
  ON polls
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = polls.session_id
      AND sessions.status = 'active'
    )
  );

CREATE POLICY "Professors can create polls"
  ON polls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'professor'
    )
  );

CREATE POLICY "Professors can end polls"
  ON polls
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN profiles ON profiles.id = auth.uid()
      WHERE sessions.id = polls.session_id
      AND profiles.role = 'professor'
    )
  );

-- Policies for poll votes
CREATE POLICY "Users can vote in active polls"
  ON poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_votes.poll_id
      AND polls.status = 'active'
    )
  );

CREATE POLICY "Users can view poll results"
  ON poll_votes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_votes.poll_id
    )
  );