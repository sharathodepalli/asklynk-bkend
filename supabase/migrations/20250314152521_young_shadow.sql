/*
  # Fix Messages View and Anonymous Name Handling

  1. Changes
    - Drop and recreate messages view with proper anonymous name handling
    - Add proper column aliases and relationships
    - Ensure anonymous names are properly displayed

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing views
DROP VIEW IF EXISTS messages_with_users;

-- Create messages view with proper anonymous name handling
CREATE OR REPLACE VIEW messages_with_users AS
SELECT 
  m.*,
  CASE 
    WHEN m.type = 'anonymous' THEN COALESCE(m.anonymous_name, 'Anonymous')
    ELSE p.full_name 
  END as display_name,
  p.full_name as user_full_name,
  p.role as user_role
FROM messages m
LEFT JOIN profiles p ON m.user_id = p.id;