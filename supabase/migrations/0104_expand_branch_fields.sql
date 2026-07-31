-- Migration to expand branch information columns
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS post_code TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS google_map TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'GMT+07:00';
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'dd/MM/yyyy';
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'VND';
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'vi';
ALTER TABLE public.branch ADD COLUMN IF NOT EXISTS working_hours JSONB;

-- Set default working hours structure for existing branches
UPDATE public.branch 
SET working_hours = '[
  {"day": "Thứ 2", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Thứ 3", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Thứ 4", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Thứ 5", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Thứ 6", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Thứ 7", "enabled": true, "open": "08:00", "close": "20:00"},
  {"day": "Chủ Nhật", "enabled": true, "open": "08:00", "close": "20:00"}
]'::jsonb
WHERE working_hours IS NULL;
