/*
  # Create Profiles Table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Unique profile identifier
      - `user_id` (uuid, nullable, FK to auth.users) - Links to registered user
      - `session_id` (text, unique, not null) - Session identifier for anonymous users
      - `email` (text, nullable) - User email
      - `full_name` (text, nullable) - User's full name
      - `status` (text) - Profile status: 'anonymous', 'registered', 'active'
      - `is_anonymous` (boolean) - Whether user is anonymous or registered
      - `registered_at` (timestamp, nullable) - When user registered
      - `created_at` (timestamp) - Profile creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Indexes
    - Unique index on `session_id`
    - Unique partial index on `user_id` (where user_id is not null)
    - Index on `status` for filtering

  3. Security
    - Enable RLS on `profiles` table
    - Policies will be added in separate migration
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text UNIQUE NOT NULL,
  email text,
  full_name text,
  status text DEFAULT 'anonymous' CHECK (status IN ('anonymous', 'registered', 'active')),
  is_anonymous boolean DEFAULT true,
  registered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_session_id_idx ON profiles(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;