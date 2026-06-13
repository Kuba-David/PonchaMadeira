-- Poncha Rating App – Supabase schema
-- Run this in your Supabase SQL editor to set up the database

CREATE TABLE IF NOT EXISTS poncha_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  place_name TEXT NOT NULL,
  address TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  poncha_type TEXT,
  notes TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  photo_url TEXT
);

-- Enable Row Level Security (public read/write for personal use)
ALTER TABLE poncha_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON poncha_ratings
  FOR ALL USING (true) WITH CHECK (true);
