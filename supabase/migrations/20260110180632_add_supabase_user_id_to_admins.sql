-- Add supabase_user_id column to link admins with Supabase Auth users
ALTER TABLE public.admins 
ADD COLUMN IF NOT EXISTS supabase_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_supabase_user_id ON public.admins(supabase_user_id);

-- Add comment
COMMENT ON COLUMN public.admins.supabase_user_id IS 'Reference to Supabase Auth user for consolidated authentication';;
