-- Migration: contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (anon insert)
CREATE POLICY "anon_insert_contact"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- No reads from browser (admin reads via service role in backend)
CREATE POLICY "no_public_read"
  ON contact_messages FOR SELECT
  USING (false);