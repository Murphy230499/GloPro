-- 0120_room_and_facility_enhancements.sql
-- Create room and facility tables for Bed & Room management

-- 1. Create table room
CREATE TABLE IF NOT EXISTS public.room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch_id UUID,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Create or enhance table facility
CREATE TABLE IF NOT EXISTS public.facility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    room_id UUID REFERENCES public.room(id) ON DELETE SET NULL,
    branch_id UUID,
    applicable_services TEXT[] DEFAULT '{}',
    allow_overlap BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ensure columns exist if facility table already was partially created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'facility' AND column_name = 'room_id') THEN
        ALTER TABLE public.facility ADD COLUMN room_id UUID REFERENCES public.room(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'facility' AND column_name = 'allow_overlap') THEN
        ALTER TABLE public.facility ADD COLUMN allow_overlap BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'facility' AND column_name = 'applicable_services') THEN
        ALTER TABLE public.facility ADD COLUMN applicable_services TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'facility' AND column_name = 'branch_id') THEN
        ALTER TABLE public.facility ADD COLUMN branch_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'facility' AND column_name = 'is_active') THEN
        ALTER TABLE public.facility ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. RLS
ALTER TABLE public.room ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for room" ON public.room FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for facility" ON public.facility FOR ALL USING (true) WITH CHECK (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_room_branch ON public.room(branch_id);
CREATE INDEX IF NOT EXISTS idx_facility_room ON public.facility(room_id);
CREATE INDEX IF NOT EXISTS idx_facility_branch ON public.facility(branch_id);
