-- First drop the existing view if it exists
DROP VIEW IF EXISTS messages_with_users;

-- Create a temporary table for safe migration
CREATE TABLE messages_temp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  type message_type NOT NULL,
  content text NOT NULL,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  status message_status DEFAULT 'sent'::message_status,
  delivered_at timestamptz,
  read_at timestamptz,
  anonymous_name text
);

-- Copy data with proper type casting and NULL handling
DO $$
DECLARE
  msg RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    FOR msg IN SELECT * FROM messages LOOP
      BEGIN
        INSERT INTO messages_temp (
          id,
          session_id,
          user_id,
          type,
          content,
          votes,
          created_at,
          status,
          delivered_at,
          read_at,
          anonymous_name
        ) VALUES (
          msg.id,
          msg.session_id,
          msg.user_id,
          msg.type::message_type,
          msg.content,
          COALESCE(msg.votes, 0),
          COALESCE(
            CASE 
              WHEN msg.created_at IS NULL OR msg.created_at::text = '' THEN now()
              ELSE msg.created_at::timestamptz 
            END,
            now()
          ),
          COALESCE(msg.status, 'sent')::message_status,
          CASE 
            WHEN msg.delivered_at IS NULL OR msg.delivered_at::text = '' OR msg.delivered_at::text = 'null' THEN NULL 
            ELSE msg.delivered_at::timestamptz 
          END,
          CASE 
            WHEN msg.read_at IS NULL OR msg.read_at::text = '' OR msg.read_at::text = 'null' THEN NULL 
            ELSE msg.read_at::timestamptz 
          END,
          msg.anonymous_name
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error and continue with next record
        RAISE NOTICE 'Error migrating message %: %', msg.id, SQLERRM;
      END;
    END LOOP;
  END IF;
END $$;

-- Verify data migration
DO $$
DECLARE
  old_count integer;
  new_count integer;
BEGIN
  SELECT COUNT(*) INTO old_count FROM messages;
  SELECT COUNT(*) INTO new_count FROM messages_temp;
  
  IF old_count != new_count THEN
    RAISE EXCEPTION 'Data migration verification failed: Old count % != New count %', old_count, new_count;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS messages CASCADE;
ALTER TABLE messages_temp RENAME TO messages;

-- Create necessary indexes
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_session_id_idx ON messages(session_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_type_idx ON messages(type);
CREATE INDEX messages_status_idx ON messages(status);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create the view with proper relationships
CREATE VIEW messages_with_users AS
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

-- Update RLS policies
CREATE POLICY "Users can view messages in their sessions"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.status = 'active' OR messages.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create messages in active sessions"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.status = 'active'
    )
  );

-- Function to update message status
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL THEN
    NEW.status = 'delivered';
  END IF;
  
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.status = 'read';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS message_status_update ON messages;
CREATE TRIGGER message_status_update
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_status();