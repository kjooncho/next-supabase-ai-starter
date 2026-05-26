-- P0-1: Supabase Initial Schema + RLS Policies
-- Created: 2026-05-23

-- ============================================================================
-- 1. USERS TABLE (Supabase Auth integration)
-- ============================================================================
-- Stores user profile data linked to Supabase auth.users
-- One-to-one relationship with auth.users via foreign key

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  level text CHECK (level IN ('beginner', 'N5', 'N4', 'N3', 'N2', 'N1')),
  life_situations text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policy: System can insert new user profiles (triggered by auth.users creation)
CREATE POLICY "Allow insert on signup" ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. CARDS TABLE (Unified Single Table with JSONB payload)
-- ============================================================================
-- Stores all learning card types (sentence, calendar, episode) in one table
-- Polymorphic design using card_type + payload JSONB
-- Tracks learning progress and real-world usage

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type text NOT NULL CHECK (card_type IN ('sentence', 'calendar', 'episode')),
  learning_status text DEFAULT 'learning' CHECK (learning_status IN ('learning', 'mastered')),
  has_real_use boolean DEFAULT false,
  real_use_count int DEFAULT 0,
  payload jsonb NOT NULL,
  source_input text,
  created_at timestamptz DEFAULT now(),
  last_reviewed_at timestamptz,
  mastered_at timestamptz,
  UNIQUE (user_id, source_input)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_learning_status ON cards(user_id, learning_status);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own cards
CREATE POLICY "Users can view own cards" ON cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own cards
CREATE POLICY "Users can insert own cards" ON cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own cards
CREATE POLICY "Users can update own cards" ON cards
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own cards
CREATE POLICY "Users can delete own cards" ON cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. API_USAGE TABLE (Rate Limiting tracking)
-- ============================================================================
-- Tracks daily API usage per user for rate limiting
-- Automatically resets per 24-hour window

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  usage_count int DEFAULT 0,
  reset_at timestamptz DEFAULT now() + interval '24 hours',
  UNIQUE (user_id, date)
);

-- Index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, date);

-- Enable Row Level Security
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own usage stats
CREATE POLICY "Users can view own usage" ON api_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System can insert/update usage records (trigger-based)
CREATE POLICY "Allow insert/update on usage tracking" ON api_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update on usage tracking" ON api_usage
  FOR UPDATE
  WITH CHECK (true);
