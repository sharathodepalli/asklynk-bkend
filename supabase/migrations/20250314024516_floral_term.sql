/*
  # Initial Schema for AskLynk

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `code` (text, unique session code)
      - `professor_id` (uuid, references auth.users)
      - `title` (text, session title)
      - `status` (enum: active, ended)
      - `created_at` (timestamp)
      - `ended_at` (timestamp, nullable)

    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references auth.users)
      - `type` (enum: ai, public, anonymous)
      - `content` (text)
      - `votes` (integer)
      - `created_at` (timestamp)
      - `status` (enum: sent, delivered, read)

    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (enum: student, professor)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create custom types
CREATE TYPE message_type AS ENUM ('ai', 'public', 'anonymous');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE session_status AS ENUM ('active', 'ended');
CREATE TYPE user_role AS ENUM ('student', 'professor');

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  professor_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  status session_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  type message_type NOT NULL,
  content text NOT NULL,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  status message_status DEFAULT 'sent'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  role user_role NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for sessions
CREATE POLICY "Anyone can view active sessions"
  ON sessions
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Professors can create sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'professor'
    )
  );

-- Policies for messages
CREATE POLICY "Users can view messages in their sessions"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.status = 'active'
    )
  );

CREATE POLICY "Users can create messages in active sessions"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.status = 'active'
    )
  );

-- Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);