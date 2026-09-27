-- 1. revenuebonusrule
CREATE TABLE IF NOT EXISTS public.revenuebonusrule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_revenue NUMERIC(15, 2) DEFAULT 0,
    bonus_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. staffcommissionconfig
CREATE TABLE IF NOT EXISTS public.staffcommissionconfig (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    service_commission_percent NUMERIC(5, 2) DEFAULT 0,
    product_commission_percent NUMERIC(5, 2) DEFAULT 0,
    package_commission_percent NUMERIC(5, 2) DEFAULT 0,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE public.revenuebonusrule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffcommissionconfig ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.revenuebonusrule FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.staffcommissionconfig FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
