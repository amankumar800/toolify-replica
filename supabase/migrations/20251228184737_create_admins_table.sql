-- Create admins table for dedicated admin authentication
-- Requirements: 1.1, 1.2, 1.3, 1.5

-- Create the admins table with all required columns
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on email column for fast lookups and uniqueness constraint
-- Requirements: 1.3
CREATE UNIQUE INDEX idx_admins_email ON admins(email);

-- Enable Row Level Security
-- Requirements: 1.5
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Only service role can access admins table
-- This ensures admin credentials are only accessible via server-side code
-- Requirements: 1.5
CREATE POLICY "Service role only" ON admins
  FOR ALL
  USING (auth.role() = 'service_role');

-- Apply updated_at trigger to automatically update timestamp on row changes
CREATE TRIGGER set_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE admins IS 'Dedicated admin authentication table, separate from Supabase Auth';
COMMENT ON COLUMN admins.email IS 'Admin email address, must be unique';
COMMENT ON COLUMN admins.password_hash IS 'bcrypt hashed password with minimum 12 salt rounds';
COMMENT ON COLUMN admins.is_active IS 'Whether the admin account is active and can log in';
COMMENT ON COLUMN admins.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN admins.failed_login_attempts IS 'Count of consecutive failed login attempts';
COMMENT ON COLUMN admins.locked_until IS 'Account locked until this timestamp after too many failed attempts';;
