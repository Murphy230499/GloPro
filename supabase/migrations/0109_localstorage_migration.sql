-- Migration: LocalStorage to Supabase Real Tables
-- Purpose: Create tables for Inventory, CRM, Promotions, and HR modules that were previously mocked in localStorage.

-- ==========================================
-- A. MODULE KHO (INVENTORY)
-- ==========================================

-- 1. inventory_suppliers
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    contact_person VARCHAR(255),
    debt NUMERIC(15, 2) DEFAULT 0,
    total_imported NUMERIC(15, 2) DEFAULT 0,
    note TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. inventory_receipts
CREATE TABLE IF NOT EXISTS public.inventory_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment'
    supplier_id UUID REFERENCES public.inventory_suppliers(id),
    branch_id UUID,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. inventory_receipt_items
CREATE TABLE IF NOT EXISTS public.inventory_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES public.inventory_receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.product(id),
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) DEFAULT 0,
    total_price NUMERIC(15, 2) DEFAULT 0
);

-- 4. inventory_transfers
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    from_branch_id UUID NOT NULL,
    to_branch_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'transferred', 'cancelled'
    note TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. inventory_transfer_items
CREATE TABLE IF NOT EXISTS public.inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID REFERENCES public.inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.product(id),
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0
);


-- ==========================================
-- B. MODULE MARKETING & KHUYẾN MÃI
-- ==========================================

-- 6. promotions
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'discount', -- 'discount', 'gift', 'combo'
    discount_type VARCHAR(50) DEFAULT 'percent', -- 'percent', 'amount'
    discount_value NUMERIC(15, 2) DEFAULT 0,
    min_order_value NUMERIC(15, 2) DEFAULT 0,
    max_discount NUMERIC(15, 2) DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    branch_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 7. vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customer(id),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'used', 'expired'
    used_at TIMESTAMP WITH TIME ZONE,
    invoice_id UUID REFERENCES public.invoice(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 8. promo_usages
CREATE TABLE IF NOT EXISTS public.promo_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoice(id),
    promotion_id UUID REFERENCES public.promotions(id),
    voucher_id UUID REFERENCES public.vouchers(id),
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- ==========================================
-- C. MODULE KHÁCH HÀNG & CRM
-- ==========================================

-- 9. customer_gifts
CREATE TABLE IF NOT EXISTS public.customer_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customer(id) ON DELETE CASCADE,
    gift_name VARCHAR(255) NOT NULL,
    qty INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'used', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 10. customer_segments_auto
CREATE TABLE IF NOT EXISTS public.customer_segments_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    criteria_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- ==========================================
-- D. MODULE NHÂN SỰ
-- ==========================================

-- 11. staff_leaves
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS (Allow all for simplicity per base44 pattern)
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_suppliers FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_receipts FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_receipt_items FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_transfers FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.inventory_transfer_items FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.promotions FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.vouchers FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.promo_usages FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.customer_gifts FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.customer_segments_auto FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow all operations for authenticated users" ON public.staff_leaves FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
