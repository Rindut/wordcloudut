-- Create session_order table to store the custom order of sessions
CREATE TABLE IF NOT EXISTS session_order (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES wordcloud_sessions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_session_order_index ON session_order(order_index);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE session_order ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on session_order" ON session_order
  FOR ALL USING (true);


