-- Migration to expand user profile fields
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'deleted'));
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Employee' CHECK (type IN ('User', 'Employee'));
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS branch_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Convert existing branch_id to branch_ids array for compatibility
UPDATE public.user_profile 
SET branch_ids = json_build_array(branch_id) 
WHERE branch_id IS NOT NULL AND (branch_ids IS NULL OR jsonb_array_length(branch_ids) = 0);
