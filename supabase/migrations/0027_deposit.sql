-- Deposit Module

CREATE TABLE IF NOT EXISTS public.deposit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customer(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointment(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branch(id) ON DELETE SET NULL,
    required_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, partially_paid, paid, applied, refunded, forfeited, cancelled, expired
    payment_method VARCHAR(50),
    expiration_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.deposit_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'service', 'category', 'staff', 'branch'
    entity_id UUID NOT NULL,
    rule_type VARCHAR(50) NOT NULL DEFAULT 'none', -- 'fixed', 'percentage', 'none'
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deposit_transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_id UUID NOT NULL REFERENCES public.deposit(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'collected', 'applied', 'refunded', 'transferred', 'adjusted', 'forfeited'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.user(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.deposit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transaction ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Enable read access for all users" ON public.deposit FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.deposit FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.deposit FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.deposit FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.deposit_policy FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.deposit_policy FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.deposit_policy FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.deposit_policy FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.deposit_transaction FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.deposit_transaction FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.deposit_transaction FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.deposit_transaction FOR DELETE USING (true);
