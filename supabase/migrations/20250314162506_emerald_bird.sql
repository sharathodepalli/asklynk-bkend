/*
  # Add anonymous messaging support to private messages

  1. Changes
    - Add `anonymous_name` column to `private_messages` table
    - Add `anonymous_thread_id` column to `private_messages` table for tracking conversations
    - Add indexes for better query performance

  2. Security
    - No changes to RLS policies required
    - Existing policies already handle message privacy
*/

-- Add anonymous messaging support columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_messages' AND column_name = 'anonymous_name'
  ) THEN
    ALTER TABLE private_messages ADD COLUMN anonymous_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'private_messages' AND column_name = 'anonymous_thread_id'
  ) THEN
    ALTER TABLE private_messages ADD COLUMN anonymous_thread_id uuid;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_private_messages_anonymous_name ON private_messages (anonymous_name);
CREATE INDEX IF NOT EXISTS idx_private_messages_anonymous_thread_id ON private_messages (anonymous_thread_id);