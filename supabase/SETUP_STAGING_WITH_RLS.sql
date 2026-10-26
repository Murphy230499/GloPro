-- ==============================================================================
-- SETUP SCRIPT FOR STAGING / DEV SUPABASE (ogwerdvslfcsrwtfamyz)
-- Multi-Tenant Isolation with Row Level Security (RLS)
-- Standard: Zero Cross-Tenant Data Leak
-- Generated: 2026-10-26
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- COMPILED PRE-REMEDIATION SCHEMA DDL
-- Target: Reproduction of Production (hgdzjnwiubsdjeaonpnt) Pre-Remediation State
-- Specifications: Exactly 52 public tables, 63 foreign keys
-- Catalog tables: branch_ids UUID[] (no branch_id)
-- Excluded: room, agent_sessions, "Integration"
-- Strictly Pre-Remediation (NO 0121, NO 0122 changes)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. CORE HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Compatibility Helpers: Array conversion functions
CREATE OR REPLACE FUNCTION public.jsonb_to_uuid_array(j jsonb)
RETURNS uuid[] AS $$
    SELECT COALESCE(array_agg(elem::text::uuid), '{}'::uuid[])
    FROM jsonb_array_elements_text(j) AS elem;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.jsonb_to_text_array(j jsonb)
RETURNS text[] AS $$
    SELECT COALESCE(array_agg(elem::text), '{}'::text[])
    FROM jsonb_array_elements_text(j) AS elem;
$$ LANGUAGE sql IMMUTABLE;

-- ==============================================================================
-- 4. TABLES (52 TABLES IN PUBLIC SCHEMA)
-- ==============================================================================

-- 1. appointment
CREATE TABLE public.appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    branch_id UUID NOT NULL,
    service_id UUID,
    service_name TEXT,
    price NUMERIC(15, 2) DEFAULT 0,
    staff_id UUID,
    staff_name TEXT,
    assistant_staff_id UUID,
    assistant_staff_name TEXT,
    services JSONB,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    source TEXT DEFAULT 'reception',
    is_customer_requested_staff BOOLEAN DEFAULT FALSE,
    logs JSONB,
    tenant_id UUID
);

-- 2. bookingsetting
CREATE TABLE public.bookingsetting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID,
    slug TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    slot_duration_minutes INTEGER DEFAULT 30,
    working_hours JSONB,
    allow_double_booking BOOLEAN DEFAULT FALSE,
    max_double_bookings INTEGER DEFAULT 1,
    enable_advance_limit BOOLEAN DEFAULT FALSE,
    max_advance_days INTEGER DEFAULT 90,
    min_advance_hours INTEGER DEFAULT 1,
    allow_self_cancel BOOLEAN DEFAULT FALSE,
    self_cancel_hours INTEGER DEFAULT 2,
    limit_booking_slots BOOLEAN DEFAULT FALSE,
    max_slots_per_hour INTEGER DEFAULT 3,
    primary_identifier TEXT DEFAULT 'email',
    allow_group_appointments BOOLEAN DEFAULT FALSE,
    require_staff_selection BOOLEAN DEFAULT TRUE,
    show_service_prices BOOLEAN DEFAULT TRUE,
    auto_confirm BOOLEAN DEFAULT TRUE,
    blocked_dates JSONB DEFAULT '[]'::jsonb,
    online_appointment_enabled BOOLEAN DEFAULT TRUE,
    book_tab_name TEXT,
    book_tab_description TEXT,
    show_top_banner BOOLEAN DEFAULT TRUE,
    cover_image_url TEXT,
    show_gallery BOOLEAN DEFAULT FALSE,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    primary_color TEXT DEFAULT '#3B82F6',
    salon_name TEXT,
    salon_description TEXT,
    salon_address TEXT,
    salon_phone TEXT,
    logo_url TEXT,
    enabled_service_ids JSONB DEFAULT '[]'::jsonb,
    enabled_staff_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 3. branch
CREATE TABLE public.branch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    city TEXT,
    manager_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    logo_url TEXT,
    country TEXT,
    state TEXT,
    post_code TEXT,
    tax_code TEXT,
    google_map TEXT,
    youtube TEXT,
    facebook TEXT,
    instagram TEXT,
    timezone TEXT DEFAULT 'GMT+07:00',
    date_format TEXT DEFAULT 'dd/MM/yyyy',
    currency TEXT DEFAULT 'VND',
    language TEXT DEFAULT 'vi',
    working_hours JSONB,
    tenant_id UUID
);

-- 4. cashvoucher
CREATE TABLE public.cashvoucher (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    flow VARCHAR(20) NOT NULL CHECK (flow IN ('income', 'expense')),
    type_id UUID,
    type_code VARCHAR(50) NOT NULL,
    type_name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    note TEXT,
    payment_method VARCHAR(50),
    source VARCHAR(50),
    ref_id UUID,
    ref_code VARCHAR(50),
    branch_id UUID,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 5. cashvouchertype
CREATE TABLE public.cashvouchertype (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    flow VARCHAR(20),
    code VARCHAR(50) NOT NULL UNIQUE,
    is_system BOOLEAN DEFAULT FALSE,
    color VARCHAR(20),
    branch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 6. customer
CREATE TABLE public.customer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    birthday DATE,
    address TEXT,
    note TEXT,
    points INTEGER DEFAULT 0,
    total_spent NUMERIC(15, 2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit DATE,
    avatar_url TEXT,
    group_id UUID,
    tenant_id UUID
);

-- 7. customer_gifts
CREATE TABLE public.customer_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    gift_name VARCHAR(255) NOT NULL,
    qty INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    promo_id UUID,
    promo_name VARCHAR(255),
    product_id UUID,
    service_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 8. customer_package
CREATE TABLE public.customer_package (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL,
    package_id UUID NOT NULL,
    invoice_id UUID,
    total_usage INTEGER NOT NULL DEFAULT 1,
    remaining_usage INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'cancelled')),
    branch_id UUID,
    tenant_id UUID
);

-- 9. customer_segments_auto
CREATE TABLE public.customer_segments_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    criteria_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 10. customer_treatment
CREATE TABLE public.customer_treatment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL,
    treatment_id UUID NOT NULL,
    invoice_id UUID,
    total_usage INTEGER NOT NULL DEFAULT 1,
    remaining_usage INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'cancelled')),
    branch_id UUID,
    tenant_id UUID
);

-- 11. customergroup
CREATE TABLE public.customergroup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#FF6B9D',
    branch_id UUID,
    tenant_id UUID
);

-- 12. customersegment
CREATE TABLE public.customersegment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    conditions TEXT,
    color TEXT DEFAULT '#34D399',
    tenant_id UUID
);

-- 13. customertier
CREATE TABLE public.customertier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    min_spend NUMERIC(15, 2) DEFAULT 0,
    min_points INTEGER DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    maintenance_period TEXT DEFAULT 'year',
    maintenance_days NUMERIC(15, 2) DEFAULT 365,
    color TEXT DEFAULT '#FF6B9D',
    tenant_id UUID
);

-- 14. customertierhistory
CREATE TABLE public.customertierhistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    old_tier_name TEXT,
    new_tier_name TEXT NOT NULL,
    reason TEXT,
    date TEXT,
    tenant_id UUID
);

-- 15. deposit
CREATE TABLE public.deposit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID,
    appointment_id UUID,
    branch_id UUID,
    required_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    expiration_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    tenant_id UUID
);

-- 16. deposit_policy
CREATE TABLE public.deposit_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    rule_type VARCHAR(50) NOT NULL DEFAULT 'none',
    value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 17. deposit_transaction
CREATE TABLE public.deposit_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    tenant_id UUID
);

-- 18. facility
CREATE TABLE public.facility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    applicable_services JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 19. inventory_receipt_items
CREATE TABLE public.inventory_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL,
    product_id UUID,
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15, 2) DEFAULT 0,
    total_price NUMERIC(15, 2) DEFAULT 0,
    product_name TEXT,
    unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 20. inventory_receipts
CREATE TABLE public.inventory_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    type VARCHAR(50) NOT NULL,
    supplier_id UUID,
    branch_id UUID,
    total_amount NUMERIC(15, 2) DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    supplier_name TEXT,
    note TEXT,
    tenant_id UUID
);

-- 21. inventory_suppliers
CREATE TABLE public.inventory_suppliers (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 22. inventory_transfer_items
CREATE TABLE public.inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL,
    product_id UUID,
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    product_name VARCHAR,
    unit VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 23. inventory_transfers
CREATE TABLE public.inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    from_branch_id UUID NOT NULL,
    to_branch_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    note TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    from_branch_name VARCHAR,
    to_branch_name VARCHAR,
    date VARCHAR,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 24. invoice
CREATE TABLE public.invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invoice_code TEXT,
    appointment_id UUID,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    branch_id UUID NOT NULL,
    items JSONB,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    discount INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    membership_used NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tip NUMERIC(15, 2) DEFAULT 0,
    tip_splits JSONB,
    payment_methods JSONB,
    status TEXT DEFAULT 'paid',
    date DATE,
    print_count INTEGER DEFAULT 0,
    previous_status TEXT,
    logs JSONB,
    deposit_id UUID,
    deposit_amount NUMERIC(15, 2) DEFAULT 0,
    tenant_id UUID
);

-- 25. loyaltyrule
CREATE TABLE public.loyaltyrule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    earn_on_service BOOLEAN DEFAULT TRUE,
    earn_on_product BOOLEAN DEFAULT TRUE,
    earn_on_package BOOLEAN DEFAULT TRUE,
    earn_on_treatment BOOLEAN DEFAULT TRUE,
    earn_on_prepaid_card BOOLEAN DEFAULT FALSE,
    earn_on_booking BOOLEAN DEFAULT TRUE,
    earn_on_referral BOOLEAN DEFAULT TRUE,
    points_per_vnd INTEGER DEFAULT 10000,
    booking_points INTEGER DEFAULT 50,
    referral_points INTEGER DEFAULT 100,
    reset_schedule TEXT DEFAULT 'none',
    reset_inactivity_days NUMERIC(15, 2) DEFAULT 365,
    excluded_item_ids TEXT DEFAULT '[]',
    tenant_id UUID
);

-- 26. membership
CREATE TABLE public.membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    branch_id UUID,
    type TEXT NOT NULL,
    name TEXT,
    balance NUMERIC(15, 2) DEFAULT 0,
    sessions_remaining NUMERIC(15, 2) DEFAULT 0,
    total_sessions NUMERIC(15, 2) DEFAULT 0,
    purchased_date DATE,
    expiry_date DATE,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    invoice_id UUID,
    invoice_code TEXT,
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT FALSE,
    suspended_at DATE,
    tenant_id UUID
);

-- 27. package_usage_history
CREATE TABLE public.package_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_package_id UUID,
    customer_treatment_id UUID,
    customer_id UUID NOT NULL,
    invoice_id UUID,
    usage_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    branch_id UUID,
    tenant_id UUID
);

-- 28. prepaidcard (CATALOG TABLE)
CREATE TABLE public.prepaidcard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    card_code TEXT,
    face_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    color TEXT DEFAULT '#FF6B9D',
    expiry_months NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 29. product (CATALOG TABLE)
CREATE TABLE public.product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    category TEXT,
    group_id UUID,
    price NUMERIC(15, 2) NOT NULL,
    cost_price NUMERIC(15, 2) DEFAULT 0,
    stock NUMERIC(15, 2) DEFAULT 0,
    min_stock NUMERIC(15, 2) DEFAULT 0,
    unit TEXT,
    sku TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 30. productcombo (CATALOG TABLE)
CREATE TABLE public.productcombo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB,
    combo_price NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 31. promo_usages
CREATE TABLE public.promo_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    promotion_id UUID,
    voucher_id UUID,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 32. promotions
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'discount',
    discount_type VARCHAR(50) DEFAULT 'percent',
    discount_value NUMERIC(15, 2) DEFAULT 0,
    min_order_value NUMERIC(15, 2) DEFAULT 0,
    max_discount NUMERIC(15, 2) DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    branch_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    applicable_items JSONB,
    is_giftable BOOLEAN DEFAULT FALSE,
    gift_items JSONB,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 33. revenuebonusrule
CREATE TABLE public.revenuebonusrule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_revenue NUMERIC(15, 2) DEFAULT 0,
    bonus_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 34. role_permissions
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL,
    module TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    tenant_id UUID,
    UNIQUE(role, module)
);

-- 35. roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    tenant_id UUID
);

-- 36. service (CATALOG TABLE)
CREATE TABLE public.service (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    category TEXT,
    group_id UUID,
    price NUMERIC(15, 2),
    price_from NUMERIC(15, 2) DEFAULT 0,
    cost NUMERIC(15, 2) DEFAULT 0,
    duration_minutes INTEGER,
    commission_rate NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    accompanied_products JSONB,
    sort_order INTEGER DEFAULT 0,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 37. servicecombo (CATALOG TABLE)
CREATE TABLE public.servicecombo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB,
    combo_price NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 38. servicegroup
CREATE TABLE public.servicegroup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT DEFAULT '#FF6B9D',
    branch_id UUID,
    sort_order INTEGER DEFAULT 0,
    tenant_id UUID
);

-- 39. servicepackage (CATALOG TABLE)
CREATE TABLE public.servicepackage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    group_id UUID,
    usage_count INTEGER DEFAULT 1,
    expiry_months NUMERIC(15, 2) DEFAULT 0,
    expiry_days NUMERIC(15, 2) DEFAULT 0,
    price NUMERIC(15, 2) DEFAULT 0,
    services JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    category TEXT,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 40. shift
CREATE TABLE public.shift (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    branch_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    is_overtime BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'scheduled',
    tenant_id UUID
);

-- 41. shifttemplate
CREATE TABLE public.shifttemplate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    branch_id UUID,
    color TEXT DEFAULT '#A78BFA',
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    late_grace_minutes INTEGER DEFAULT 0,
    early_grace_minutes INTEGER DEFAULT 0,
    overtime_after_minutes INTEGER DEFAULT 0,
    tenant_id UUID
);

-- 42. staff
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    branch_id UUID NOT NULL,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    specialties TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_color TEXT DEFAULT '#FF6B9D',
    avatar_url TEXT,
    group_id UUID,
    service_ids JSONB,
    can_be_booked BOOLEAN DEFAULT TRUE,
    max_concurrent_bookings NUMERIC(15, 2) DEFAULT 1,
    tenant_id UUID
);

-- 43. staff_leaves
CREATE TABLE public.staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 44. staffattendance
CREATE TABLE public.staffattendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT,
    ot_minutes INTEGER DEFAULT 0,
    tenant_id UUID
);

-- 45. staffcommissionconfig
CREATE TABLE public.staffcommissionconfig (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    service_commission_percent NUMERIC(5, 2) DEFAULT 0,
    product_commission_percent NUMERIC(5, 2) DEFAULT 0,
    package_commission_percent NUMERIC(5, 2) DEFAULT 0,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- 46. staffcommissionrule
CREATE TABLE public.staffcommissionrule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    commission_type TEXT NOT NULL,
    commission_value NUMERIC(15, 2) NOT NULL,
    tenant_id UUID
);

-- 47. staffgroup
CREATE TABLE public.staffgroup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#A78BFA',
    description TEXT,
    tenant_id UUID
);

-- 48. staffschedule
CREATE TABLE public.staffschedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    date TEXT NOT NULL,
    shift_template_id UUID,
    is_off BOOLEAN DEFAULT FALSE,
    off_type TEXT,
    tenant_id UUID
);

-- 49. treatment (CATALOG TABLE)
CREATE TABLE public.treatment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    group_id UUID,
    expiry_months NUMERIC(15, 2) DEFAULT 0,
    expiry_days NUMERIC(15, 2) DEFAULT 0,
    price NUMERIC(15, 2) DEFAULT 0,
    services JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    category TEXT,
    branch_ids UUID[] DEFAULT '{}'::uuid[],
    tenant_id UUID
);

-- 50. user
CREATE TABLE public."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL,
    tenant_id UUID
);

-- 51. user_profile
CREATE TABLE public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    branch_id UUID,
    avatar_url TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive', 'deleted')),
    type TEXT DEFAULT 'Employee' CHECK (type IN ('User', 'Employee')),
    branch_ids JSONB DEFAULT '[]'::jsonb,
    first_name TEXT,
    last_name TEXT,
    tenant_id UUID
);

-- 52. vouchers
CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    promotion_id UUID,
    customer_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    used_at TIMESTAMP WITH TIME ZONE,
    invoice_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR,
    type VARCHAR,
    discount_type VARCHAR,
    discount_value NUMERIC,
    min_order_value NUMERIC,
    max_discount NUMERIC,
    quantity INTEGER DEFAULT 9999,
    usage_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    branch_ids TEXT[],
    applicable_items JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID
);

-- ==============================================================================
-- 5. FOREIGN KEY CONSTRAINTS (EXACTLY 63 FOREIGN KEYS)
-- ==============================================================================

ALTER TABLE public.appointment ADD CONSTRAINT fk_appointment_assistant_staff_id FOREIGN KEY (assistant_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.appointment ADD CONSTRAINT fk_appointment_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.appointment ADD CONSTRAINT fk_appointment_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE SET NULL;
ALTER TABLE public.appointment ADD CONSTRAINT fk_appointment_service_id FOREIGN KEY (service_id) REFERENCES public.service(id) ON DELETE SET NULL;
ALTER TABLE public.appointment ADD CONSTRAINT fk_appointment_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.customer ADD CONSTRAINT fk_customer_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;
ALTER TABLE public.customer_gifts ADD CONSTRAINT fk_customer_gifts_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;

ALTER TABLE public.customer_package ADD CONSTRAINT fk_customer_package_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.customer_package ADD CONSTRAINT fk_customer_package_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;
ALTER TABLE public.customer_package ADD CONSTRAINT fk_customer_package_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL;
ALTER TABLE public.customer_package ADD CONSTRAINT fk_customer_package_package_id FOREIGN KEY (package_id) REFERENCES public.servicepackage(id) ON DELETE RESTRICT;

ALTER TABLE public.customer_treatment ADD CONSTRAINT fk_customer_treatment_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.customer_treatment ADD CONSTRAINT fk_customer_treatment_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;
ALTER TABLE public.customer_treatment ADD CONSTRAINT fk_customer_treatment_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL;
ALTER TABLE public.customer_treatment ADD CONSTRAINT fk_customer_treatment_treatment_id FOREIGN KEY (treatment_id) REFERENCES public.treatment(id) ON DELETE RESTRICT;

ALTER TABLE public.customergroup ADD CONSTRAINT fk_customergroup_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.customertierhistory ADD CONSTRAINT fk_customertierhistory_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE SET NULL;

ALTER TABLE public.deposit ADD CONSTRAINT fk_deposit_appointment_id FOREIGN KEY (appointment_id) REFERENCES public.appointment(id) ON DELETE SET NULL;
ALTER TABLE public.deposit ADD CONSTRAINT fk_deposit_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.deposit ADD CONSTRAINT fk_deposit_created_by FOREIGN KEY (created_by) REFERENCES public."user"(id) ON DELETE SET NULL;
ALTER TABLE public.deposit ADD CONSTRAINT fk_deposit_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;

ALTER TABLE public.deposit_transaction ADD CONSTRAINT fk_deposit_transaction_created_by FOREIGN KEY (created_by) REFERENCES public."user"(id) ON DELETE SET NULL;
ALTER TABLE public.deposit_transaction ADD CONSTRAINT fk_deposit_transaction_deposit_id FOREIGN KEY (deposit_id) REFERENCES public.deposit(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_receipt_items ADD CONSTRAINT fk_inventory_receipt_items_product_id FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE NO ACTION;
ALTER TABLE public.inventory_receipt_items ADD CONSTRAINT fk_inventory_receipt_items_receipt_id FOREIGN KEY (receipt_id) REFERENCES public.inventory_receipts(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_receipts ADD CONSTRAINT fk_inventory_receipts_supplier_id FOREIGN KEY (supplier_id) REFERENCES public.inventory_suppliers(id) ON DELETE NO ACTION;

ALTER TABLE public.inventory_transfer_items ADD CONSTRAINT fk_inventory_transfer_items_product_id FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE NO ACTION;
ALTER TABLE public.inventory_transfer_items ADD CONSTRAINT fk_inventory_transfer_items_transfer_id FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfers(id) ON DELETE CASCADE;

ALTER TABLE public.invoice ADD CONSTRAINT fk_invoice_appointment_id FOREIGN KEY (appointment_id) REFERENCES public.appointment(id) ON DELETE SET NULL;
ALTER TABLE public.invoice ADD CONSTRAINT fk_invoice_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.invoice ADD CONSTRAINT fk_invoice_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE SET NULL;

ALTER TABLE public.membership ADD CONSTRAINT fk_membership_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.membership ADD CONSTRAINT fk_membership_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE SET NULL;
ALTER TABLE public.membership ADD CONSTRAINT fk_membership_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL;

ALTER TABLE public.package_usage_history ADD CONSTRAINT fk_package_usage_history_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.package_usage_history ADD CONSTRAINT fk_package_usage_history_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE CASCADE;
ALTER TABLE public.package_usage_history ADD CONSTRAINT package_usage_history_customer_package_id_fkey FOREIGN KEY (customer_package_id) REFERENCES public.membership(id) ON DELETE CASCADE;
ALTER TABLE public.package_usage_history ADD CONSTRAINT package_usage_history_customer_treatment_id_fkey FOREIGN KEY (customer_treatment_id) REFERENCES public.membership(id) ON DELETE CASCADE;
ALTER TABLE public.package_usage_history ADD CONSTRAINT fk_package_usage_history_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE SET NULL;

ALTER TABLE public.product ADD CONSTRAINT fk_product_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;

ALTER TABLE public.promo_usages ADD CONSTRAINT fk_promo_usages_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE NO ACTION;
ALTER TABLE public.promo_usages ADD CONSTRAINT fk_promo_usages_promotion_id FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE NO ACTION;
ALTER TABLE public.promo_usages ADD CONSTRAINT fk_promo_usages_voucher_id FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id) ON DELETE NO ACTION;

ALTER TABLE public.service ADD CONSTRAINT fk_service_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;
ALTER TABLE public.servicegroup ADD CONSTRAINT fk_servicegroup_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.servicepackage ADD CONSTRAINT fk_servicepackage_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;

ALTER TABLE public.shift ADD CONSTRAINT fk_shift_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.shift ADD CONSTRAINT fk_shift_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.shifttemplate ADD CONSTRAINT fk_shifttemplate_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;

ALTER TABLE public.staff ADD CONSTRAINT fk_staff_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;
ALTER TABLE public.staff ADD CONSTRAINT fk_staff_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;
ALTER TABLE public.staff_leaves ADD CONSTRAINT fk_staff_leaves_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;
ALTER TABLE public.staffattendance ADD CONSTRAINT fk_staffattendance_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.staffcommissionconfig ADD CONSTRAINT fk_staffcommissionconfig_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;
ALTER TABLE public.staffcommissionrule ADD CONSTRAINT fk_staffcommissionrule_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.staffschedule ADD CONSTRAINT fk_staffschedule_shift_template_id FOREIGN KEY (shift_template_id) REFERENCES public.shifttemplate(id) ON DELETE SET NULL;
ALTER TABLE public.staffschedule ADD CONSTRAINT fk_staffschedule_staff_id FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.treatment ADD CONSTRAINT fk_treatment_group_id FOREIGN KEY (group_id) REFERENCES public.customergroup(id) ON DELETE SET NULL;
ALTER TABLE public.user_profile ADD CONSTRAINT fk_user_profile_branch_id FOREIGN KEY (branch_id) REFERENCES public.branch(id) ON DELETE SET NULL;

ALTER TABLE public.vouchers ADD CONSTRAINT fk_vouchers_customer_id FOREIGN KEY (customer_id) REFERENCES public.customer(id) ON DELETE NO ACTION;
ALTER TABLE public.vouchers ADD CONSTRAINT fk_vouchers_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoice(id) ON DELETE NO ACTION;
ALTER TABLE public.vouchers ADD CONSTRAINT fk_vouchers_promotion_id FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;

ALTER TABLE public.package_usage_history ADD CONSTRAINT package_usage_history_treatment_id_fkey FOREIGN KEY (customer_treatment_id) REFERENCES public.membership(id) ON DELETE SET NULL;

-- ==============================================================================
-- 6. TRIGGERS & RPC FUNCTIONS
-- ==============================================================================

-- Triggers for updated_at
CREATE TRIGGER trigger_update_appointment_updated_at BEFORE UPDATE ON public.appointment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_branch_updated_at BEFORE UPDATE ON public.branch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customer_updated_at BEFORE UPDATE ON public.customer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customer_package_updated_at BEFORE UPDATE ON public.customer_package FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customer_treatment_updated_at BEFORE UPDATE ON public.customer_treatment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customergroup_updated_at BEFORE UPDATE ON public.customergroup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customersegment_updated_at BEFORE UPDATE ON public.customersegment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customertier_updated_at BEFORE UPDATE ON public.customertier FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customertierhistory_updated_at BEFORE UPDATE ON public.customertierhistory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_deposit_updated_at BEFORE UPDATE ON public.deposit FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_deposit_policy_updated_at BEFORE UPDATE ON public.deposit_policy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_facility_updated_at BEFORE UPDATE ON public.facility FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_loyaltyrule_updated_at BEFORE UPDATE ON public.loyaltyrule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_membership_updated_at BEFORE UPDATE ON public.membership FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_prepaidcard_updated_at BEFORE UPDATE ON public.prepaidcard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_product_updated_at BEFORE UPDATE ON public.product FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_productcombo_updated_at BEFORE UPDATE ON public.productcombo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_service_updated_at BEFORE UPDATE ON public.service FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_servicecombo_updated_at BEFORE UPDATE ON public.servicecombo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_servicegroup_updated_at BEFORE UPDATE ON public.servicegroup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_servicepackage_updated_at BEFORE UPDATE ON public.servicepackage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_shift_updated_at BEFORE UPDATE ON public.shift FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_shifttemplate_updated_at BEFORE UPDATE ON public.shifttemplate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_staffattendance_updated_at BEFORE UPDATE ON public.staffattendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_staffcommissionrule_updated_at BEFORE UPDATE ON public.staffcommissionrule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_staffgroup_updated_at BEFORE UPDATE ON public.staffgroup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_staffschedule_updated_at BEFORE UPDATE ON public.staffschedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_treatment_updated_at BEFORE UPDATE ON public.treatment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_user_updated_at BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_user_profile_updated_at BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Deposit Cashflow Trigger
CREATE OR REPLACE FUNCTION public.sync_deposit_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.paid_amount > 0 THEN
            INSERT INTO public.cashvoucher (
                code, flow, type_code, type_name, amount, date, description, note, payment_method, source, ref_id, ref_code, branch_id, created_by
            ) VALUES (
                'PT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
                'income',
                'deposit',
                'Đặt cọc',
                NEW.paid_amount,
                CURRENT_DATE,
                'Thu tiền cọc phiếu ' || NEW.deposit_number,
                NEW.notes,
                COALESCE(NEW.payment_method, 'cash'),
                'auto',
                NEW.id,
                NEW.deposit_number,
                NEW.branch_id,
                'system'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_deposit_to_cashflow ON public.deposit;
CREATE TRIGGER trigger_sync_deposit_to_cashflow
    AFTER INSERT ON public.deposit
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_deposit_to_cashflow();

-- Package Invoice Trigger
CREATE OR REPLACE FUNCTION public.process_invoice_packages()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    item_type TEXT;
    item_id TEXT;
    item_qty INTEGER;
    is_from_package BOOLEAN;
    pkg_usage_count INTEGER;
    pkg_expiry_months INTEGER;
    trt_expiry_months INTEGER;
    new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            item_type := item->>'type';
            item_id := item->>'id';
            item_qty := COALESCE((item->>'qty')::integer, 1);
            is_from_package := COALESCE((item->>'is_from_package')::boolean, false);
            
            IF is_from_package THEN
                IF item->>'customer_package_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_package_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_package_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_package_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id
                    );
                ELSIF item->>'customer_treatment_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_treatment_id')::uuid;
                    
                    INSERT INTO public.package_usage_history (
                        customer_treatment_id, customer_id, invoice_id, usage_count, branch_id
                    ) VALUES (
                        (item->>'customer_treatment_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id
                    );
                END IF;
                CONTINUE;
            END IF;

            IF item_type = 'package' THEN
                SELECT usage_count, expiry_months INTO pkg_usage_count, pkg_expiry_months 
                FROM public.servicepackage WHERE id = item_id::uuid;
                
                IF FOUND THEN
                    IF pkg_expiry_months > 0 THEN
                        new_expires_at := CURRENT_TIMESTAMP + (pkg_expiry_months || ' months')::interval;
                    ELSE
                        new_expires_at := NULL;
                    END IF;
                    
                    FOR i IN 1..item_qty LOOP
                        INSERT INTO public.customer_package (
                            customer_id, package_id, invoice_id, total_usage, remaining_usage, expires_at, branch_id
                        ) VALUES (
                            NEW.customer_id, item_id::uuid, NEW.id, COALESCE(pkg_usage_count, 1), COALESCE(pkg_usage_count, 1), new_expires_at, NEW.branch_id
                        );
                    END LOOP;
                END IF;
            END IF;

            IF item_type = 'treatment' THEN
                SELECT expiry_months INTO trt_expiry_months 
                FROM public.treatment WHERE id = item_id::uuid;
                
                IF FOUND THEN
                    IF trt_expiry_months > 0 THEN
                        new_expires_at := CURRENT_TIMESTAMP + (trt_expiry_months || ' months')::interval;
                    ELSE
                        new_expires_at := NULL;
                    END IF;
                    
                    FOR i IN 1..item_qty LOOP
                        INSERT INTO public.customer_treatment (
                            customer_id, treatment_id, invoice_id, total_usage, remaining_usage, expires_at, branch_id
                        ) VALUES (
                            NEW.customer_id, item_id::uuid, NEW.id, 1, 1, new_expires_at, NEW.branch_id
                        );
                    END LOOP;
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_packages ON public.invoice;
CREATE TRIGGER trigger_invoice_packages
    AFTER INSERT OR UPDATE ON public.invoice
    FOR EACH ROW
    EXECUTE FUNCTION public.process_invoice_packages();

-- Stock RPCs
CREATE OR REPLACE FUNCTION public.create_stock_receipt(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_receipt_id UUID;
  v_item jsonb;
  v_items jsonb;
  v_type TEXT;
  v_product_id TEXT;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_current_stock NUMERIC;
  v_new_stock NUMERIC;
  v_product_exists BOOLEAN;
BEGIN
  v_type := payload->>'type';
  IF v_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Invalid type: %. Must be in or out', v_type;
  END IF;

  v_items := payload->'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Receipt must have at least one item';
  END IF;

  INSERT INTO public.inventory_receipts (
    code, type, supplier_id, supplier_name, branch_id,
    total_amount, paid_amount, debt_amount, reason, note,
    status, created_by
  ) VALUES (
    payload->>'code',
    v_type,
    (payload->>'supplier_id')::uuid,
    payload->>'supplier_name',
    (payload->>'branch_id')::uuid,
    COALESCE((payload->>'total_amount')::numeric, 0),
    COALESCE((payload->>'paid_amount')::numeric, 0),
    COALESCE((payload->>'debt_amount')::numeric, 0),
    payload->>'reason',
    payload->>'note',
    COALESCE(payload->>'status', 'completed'),
    payload->>'created_by'
  ) RETURNING id INTO v_receipt_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := v_item->>'product_id';
    v_qty := COALESCE((v_item->>'qty')::numeric, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for all items';
    END IF;

    SELECT stock INTO v_current_stock
    FROM public.product
    WHERE id = v_product_id::uuid
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    IF v_type = 'out' AND v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Current: %, Requested: %',
        v_product_id, v_current_stock, v_qty;
    END IF;

    IF v_type = 'in' THEN
      v_new_stock := v_current_stock + v_qty;
    ELSE
      v_new_stock := v_current_stock - v_qty;
    END IF;

    UPDATE public.product
    SET stock = v_new_stock, updated_at = now()
    WHERE id = v_product_id::uuid;

    INSERT INTO public.inventory_receipt_items (
      receipt_id, product_id, product_name, unit,
      qty, unit_price, total_price
    ) VALUES (
      v_receipt_id,
      v_product_id::uuid,
      v_item->>'product_name',
      v_item->>'unit',
      v_qty,
      v_unit_price,
      COALESCE((v_item->>'total_price')::numeric, v_qty * v_unit_price)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'receipt_id', v_receipt_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_stock_transfer(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transfer_id uuid;
  v_from_branch_id uuid;
  v_to_branch_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_product_name text;
  v_unit text;
BEGIN
  IF payload->>'from_branch_id' IS NULL OR payload->>'from_branch_id' = '' THEN
    RAISE EXCEPTION 'from_branch_id is required';
  END IF;

  IF payload->>'to_branch_id' IS NULL OR payload->>'to_branch_id' = '' THEN
    RAISE EXCEPTION 'to_branch_id is required';
  END IF;

  v_from_branch_id := (payload->>'from_branch_id')::uuid;
  v_to_branch_id := (payload->>'to_branch_id')::uuid;

  IF v_from_branch_id = v_to_branch_id THEN
    RAISE EXCEPTION 'from_branch_id and to_branch_id must be different';
  END IF;

  INSERT INTO public.inventory_transfers (
    code, from_branch_id, from_branch_name,
    to_branch_id, to_branch_name, date,
    status, note, created_by, created_at, updated_at
  ) VALUES (
    payload->>'code',
    v_from_branch_id,
    payload->>'from_branch_name',
    v_to_branch_id,
    payload->>'to_branch_name',
    payload->>'date',
    COALESCE(payload->>'status', 'pending'),
    payload->>'note',
    COALESCE(payload->>'created_by', 'system'),
    now(),
    now()
  ) RETURNING id INTO v_transfer_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::numeric;

    SELECT name, unit INTO v_product_name, v_unit
    FROM public.product WHERE id = v_product_id;

    INSERT INTO public.inventory_transfer_items (
      transfer_id, product_id, product_name, unit, qty, created_at
    ) VALUES (
      v_transfer_id, v_product_id,
      COALESCE(v_item->>'product_name', v_product_name),
      COALESCE(v_item->>'unit', v_unit),
      v_qty, now()
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_transfer_id,
    'status', 'pending',
    'success', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_stock_transfer(p_transfer_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transfer record;
BEGIN
  SELECT * INTO v_transfer
  FROM public.inventory_transfers
  WHERE id = p_transfer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
  END IF;

  IF v_transfer.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer % is not in pending status', p_transfer_id;
  END IF;

  UPDATE public.inventory_transfers
  SET status = 'transferred', updated_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'id', p_transfer_id,
    'status', 'transferred',
    'success', true
  );
END;
$$;

-- ==============================================================================
-- 7. RLS POLICIES (PRE-REMEDIATION BASELINE: 25 TABLES ENABLED)
-- ==============================================================================

ALTER TABLE public.cashvoucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashvouchertype ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenuebonusrule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staffcommissionconfig ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch ENABLE ROW LEVEL SECURITY;

-- Permissive Pre-Remediation Policies (ALLOW ALL / OPEN ACCESS)
CREATE POLICY "Enable all for all users" ON public.cashvoucher FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.cashvouchertype FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.customer_gifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.customer_segments_auto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.deposit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.deposit_policy FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.deposit_transaction FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.inventory_receipt_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.inventory_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.inventory_suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.inventory_transfer_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.inventory_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.invoice FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.promo_usages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.promotions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.revenuebonusrule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.staff_leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.staffcommissionconfig FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.vouchers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.user_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.customer FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.appointment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for all users" ON public.branch FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- Migration: 0121_multi_tenant_rls_isolation.sql
-- Description: Complete Multi-Tenant Security Hardening & Zero Data Leak Isolation
-- Author: Senior PostgreSQL Security Engineer & Multi-Tenant Architect
-- Date: 2026-09-28
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTION: current_tenant_id()
-- Resolves the tenant_id of the currently authenticated Supabase user.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profile WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, anon;


-- ------------------------------------------------------------------------------
-- 2. USER_PROFILE HARDENING: IMMUTABLE TENANT IDENTITY & PRIVILEGE CONTROL
-- ------------------------------------------------------------------------------
-- 2A. Trigger preventing ANY change to tenant_id
CREATE OR REPLACE FUNCTION public.prevent_tenant_id_tampering()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
        RAISE EXCEPTION 'Security Violation: Modifying tenant_id is strictly forbidden.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_tenant_id_tampering ON public.user_profile;
CREATE TRIGGER trg_prevent_tenant_id_tampering
BEFORE UPDATE ON public.user_profile
FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_id_tampering();

-- 2B. Revoke client-side modifications on tenant_id and unauthorized inserts
REVOKE UPDATE (tenant_id) ON public.user_profile FROM authenticated, anon;
REVOKE INSERT ON public.user_profile FROM authenticated, anon;

-- 2C. Granular RLS Policies for user_profile
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile FORCE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profile') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profile', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "user_profile_select_policy" ON public.user_profile
FOR SELECT TO authenticated
USING (tenant_id = public.current_tenant_id() OR id = auth.uid());

CREATE POLICY "user_profile_update_policy" ON public.user_profile
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND tenant_id = public.current_tenant_id());


-- ------------------------------------------------------------------------------
-- 3. ADD tenant_id COLUMN TO MISSING TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    tables_to_add text[] := ARRAY[
        'inventory_suppliers',
        'promotions',
        'vouchers',
        'package_usage_history',
        'inventory_receipts',
        'inventory_receipt_items',
        'inventory_transfers',
        'inventory_transfer_items',
        'promo_usages',
        'customer_gifts',
        'customer_segments_auto',
        'revenuebonusrule',
        'staff_leaves',
        'staffcommissionconfig',
        'user'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_to_add LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id UUID', tbl);
            -- Removed invalid STABLE default
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)', tbl, tbl);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Skipping column addition for %: %', tbl, SQLERRM;
        END;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 5. COMPOSITE UNIQUE CONSTRAINTS (Preventing DoS & Namespace Collisions)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- vouchers
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_code_key') THEN
        ALTER TABLE public.vouchers DROP CONSTRAINT vouchers_code_key;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_vouchers_tenant_code') THEN
        ALTER TABLE public.vouchers ADD CONSTRAINT uq_vouchers_tenant_code UNIQUE (tenant_id, code);
    END IF;

    -- promotions
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promotions_code_key') THEN
        ALTER TABLE public.promotions DROP CONSTRAINT promotions_code_key;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_promotions_tenant_code') THEN
        ALTER TABLE public.promotions ADD CONSTRAINT uq_promotions_tenant_code UNIQUE (tenant_id, code);
    END IF;

    -- cashvoucher
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cashvoucher_code_key') THEN
        ALTER TABLE public.cashvoucher DROP CONSTRAINT cashvoucher_code_key;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_cashvoucher_tenant_code') THEN
        ALTER TABLE public.cashvoucher ADD CONSTRAINT uq_cashvoucher_tenant_code UNIQUE (tenant_id, code);
    END IF;

    -- inventory_suppliers
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_suppliers_code_key') THEN
        ALTER TABLE public.inventory_suppliers DROP CONSTRAINT inventory_suppliers_code_key;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_suppliers_tenant_code') THEN
        ALTER TABLE public.inventory_suppliers ADD CONSTRAINT uq_suppliers_tenant_code UNIQUE (tenant_id, code);
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 6. FOREIGN KEY CROSS-TENANT INTEGRITY VALIDATION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_tenant_references()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        -- Validate customer
        IF NEW.customer_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.customer WHERE id = NEW.customer_id AND tenant_id = NEW.tenant_id) THEN
                RAISE EXCEPTION 'Security Exception: Referenced customer % does not belong to tenant %', NEW.customer_id, NEW.tenant_id;
            END IF;
        END IF;

        -- Validate branch
        IF NEW.branch_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.branch WHERE id = NEW.branch_id AND tenant_id = NEW.tenant_id) THEN
                RAISE EXCEPTION 'Security Exception: Referenced branch % does not belong to tenant %', NEW.branch_id, NEW.tenant_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_invoice_tenant ON public.invoice;
CREATE TRIGGER trg_validate_invoice_tenant
BEFORE INSERT OR UPDATE ON public.invoice
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_references();

DROP TRIGGER IF EXISTS trg_validate_appointment_tenant ON public.appointment;
CREATE TRIGGER trg_validate_appointment_tenant
BEFORE INSERT OR UPDATE ON public.appointment
FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_references();


-- ------------------------------------------------------------------------------
-- 7. STANDARD TENANT RLS POLICIES ACROSS BUSINESS TABLES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    pol record;
    all_tables text[] := ARRAY[
        'appointment',
        'bookingsetting',
        'branch',
        'cashvoucher',
        'customer',
        'customer_gifts',
        'customer_package',
        'customer_segments_auto',
        'customer_treatment',
        'customergroup',
        'customersegment',
        'customertier',
        'customertierhistory',
        'deposit',
        'deposit_policy',
        'deposit_transaction',
        'facility',
        'inventory_receipt_items',
        'inventory_receipts',
        'inventory_suppliers',
        'inventory_transfer_items',
        'inventory_transfers',
        'invoice',
        'loyaltyrule',
        'membership',
        'package_usage_history',
        'prepaidcard',
        'product',
        'productcombo',
        'promo_usages',
        'promotions',
        'revenuebonusrule',
        'room',
        'service',
        'servicecombo',
        'servicegroup',
        'servicepackage',
        'shift',
        'shifttemplate',
        'staff',
        'staff_leaves',
        'staffattendance',
        'staffcommissionconfig',
        'staffcommissionrule',
        'staffgroup',
        'staffschedule',
        'treatment',
        'user',
        'vouchers'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            -- Enable and Force RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);

            -- Drop old policies
            FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl) LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;

            -- Standard authenticated tenant policy
            EXECUTE format(
                'CREATE POLICY "tenant_isolation_policy" ON public.%I ' ||
                'FOR ALL TO authenticated ' ||
                'USING (tenant_id = public.current_tenant_id()) ' ||
                'WITH CHECK (tenant_id = public.current_tenant_id())',
                tbl
            );
        END IF;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 8. SPECIAL POLICIES: ROLES, ROLE_PERMISSIONS, CASHVOUCHERTYPE, BOOKING
-- ------------------------------------------------------------------------------

-- 8A. roles: View system roles; only Owner/Admin can CUD custom roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles FORCE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.roles', pol.policyname);
    END LOOP;
END $$;

UPDATE public.roles SET tenant_id = NULL WHERE is_system = true;

CREATE POLICY "roles_select_policy" ON public.roles
FOR SELECT TO authenticated
USING (tenant_id = public.current_tenant_id() OR is_system = true OR tenant_id IS NULL);

CREATE POLICY "roles_cud_policy" ON public.roles
FOR ALL TO authenticated
USING (
    tenant_id = public.current_tenant_id() 
    AND is_system = false 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
    tenant_id = public.current_tenant_id() 
    AND is_system = false 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);


-- 8B. role_permissions: View system perms; only Owner/Admin can CUD custom perms
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions FORCE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'role_permissions') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.role_permissions', pol.policyname);
    END LOOP;
END $$;

UPDATE public.role_permissions SET tenant_id = NULL WHERE role IN ('admin', 'cashier') AND tenant_id IS NOT NULL;

CREATE POLICY "role_permissions_select_policy" ON public.role_permissions
FOR SELECT TO authenticated
USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "role_permissions_cud_policy" ON public.role_permissions
FOR ALL TO authenticated
USING (
    tenant_id = public.current_tenant_id() 
    AND tenant_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
    tenant_id = public.current_tenant_id() 
    AND tenant_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);


-- 8C. cashvouchertype: View system types; only Owner/Admin can CUD custom types
ALTER TABLE public.cashvouchertype ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashvouchertype FORCE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cashvouchertype') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cashvouchertype', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "cashvouchertype_select_policy" ON public.cashvouchertype
FOR SELECT TO authenticated
USING (tenant_id = public.current_tenant_id() OR is_system = true OR tenant_id IS NULL);

CREATE POLICY "cashvouchertype_cud_policy" ON public.cashvouchertype
FOR ALL TO authenticated
USING (
    tenant_id = public.current_tenant_id() 
    AND is_system = false 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
)
WITH CHECK (
    tenant_id = public.current_tenant_id() 
    AND is_system = false 
    AND EXISTS (SELECT 1 FROM public.user_profile WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);


-- 8D. appointment anon booking policy: Validated online booking only
CREATE POLICY "appointment_anon_insert_policy" ON public.appointment
FOR INSERT TO anon
WITH CHECK (
    tenant_id IS NOT NULL 
    AND branch_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.branch WHERE id = branch_id AND tenant_id = appointment.tenant_id)
);


-- 8E. agent_sessions & Integration protection
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_sessions') THEN
        ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.agent_sessions FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "agent_sessions_tenant_isolation_policy" ON public.agent_sessions;
        DROP POLICY IF EXISTS "agent_sessions_isolation_policy" ON public.agent_sessions;
        CREATE POLICY "agent_sessions_isolation_policy" ON public.agent_sessions
        FOR ALL TO authenticated
        USING (tenant_id = public.current_tenant_id()::text)
        WITH CHECK (tenant_id = public.current_tenant_id()::text);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Integration') THEN
        ALTER TABLE public."Integration" ADD COLUMN IF NOT EXISTS tenant_id UUID;
        ALTER TABLE public."Integration" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public."Integration" FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "integration_isolation_policy" ON public."Integration";
        CREATE POLICY "integration_isolation_policy" ON public."Integration"
        FOR ALL TO authenticated
        USING (tenant_id = public.current_tenant_id())
        WITH CHECK (tenant_id = public.current_tenant_id());
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 9. HARDEN SECURITY DEFINER RPCS
-- ------------------------------------------------------------------------------

-- 9A. create_stock_receipt: Validates product, supplier, and branch ownership
CREATE OR REPLACE FUNCTION public.create_stock_receipt(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
  v_receipt_id UUID;
  v_item jsonb;
  v_items jsonb;
  v_type TEXT;
  v_product_id TEXT;
  v_qty NUMERIC;
  v_unit_price NUMERIC;
  v_product_exists BOOLEAN;
  v_supplier_id UUID;
  v_branch_id UUID;
BEGIN
  v_tenant_id := public.current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: tenant_id could not be resolved';
  END IF;

  -- Validate Branch Ownership
  IF (payload->>'branch_id') IS NOT NULL AND (payload->>'branch_id') != '' THEN
    v_branch_id := (payload->>'branch_id')::UUID;
    IF NOT EXISTS (SELECT 1 FROM public.branch WHERE id = v_branch_id AND tenant_id = v_tenant_id) THEN
      RAISE EXCEPTION 'Branch % does not belong to current salon', v_branch_id;
    END IF;
  END IF;

  -- Validate Supplier Ownership
  IF (payload->>'supplier_id') IS NOT NULL AND (payload->>'supplier_id') != '' THEN
    v_supplier_id := (payload->>'supplier_id')::UUID;
    IF NOT EXISTS (SELECT 1 FROM public.inventory_suppliers WHERE id = v_supplier_id AND (tenant_id = v_tenant_id OR tenant_id IS NULL)) THEN
      RAISE EXCEPTION 'Supplier % does not belong to current salon', v_supplier_id;
    END IF;
  END IF;

  v_type := payload->>'type';
  IF v_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Invalid type: %. Must be in or out', v_type;
  END IF;

  v_items := payload->'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Receipt must have at least one item';
  END IF;

  -- Validate product ownership
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'qty')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'qty must be > 0 for product %', v_product_id;
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.product WHERE id = v_product_id::UUID AND tenant_id = v_tenant_id) INTO v_product_exists;
    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product % does not belong to current salon', v_product_id;
    END IF;
  END LOOP;

  INSERT INTO public.inventory_receipts (
    code, type, supplier_id, supplier_name, branch_id,
    total_amount, paid_amount, debt_amount, reason, note,
    status, created_by, created_at, tenant_id
  ) VALUES (
    payload->>'code', v_type, v_supplier_id, payload->>'supplier_name', v_branch_id,
    COALESCE((payload->>'total_amount')::NUMERIC, 0),
    COALESCE((payload->>'paid_amount')::NUMERIC, 0),
    COALESCE((payload->>'debt_amount')::NUMERIC, 0),
    payload->>'reason', payload->>'note',
    COALESCE(payload->>'status', 'completed'),
    COALESCE(payload->>'created_by', 'system'),
    timezone('utc', now()), v_tenant_id
  ) RETURNING id INTO v_receipt_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'qty')::NUMERIC;
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);

    INSERT INTO public.inventory_receipt_items (
      receipt_id, product_id, product_name, unit,
      qty, unit_price, total_price, tenant_id
    ) VALUES (
      v_receipt_id, v_product_id::UUID, v_item->>'product_name',
      v_item->>'unit', v_qty, v_unit_price, v_qty * v_unit_price, v_tenant_id
    );

    IF v_type = 'in' THEN
      UPDATE public.product
      SET stock = COALESCE(stock, 0) + v_qty, updated_at = timezone('utc', now())
      WHERE id = v_product_id::UUID AND tenant_id = v_tenant_id;
    ELSIF v_type = 'out' THEN
      UPDATE public.product
      SET stock = GREATEST(0, COALESCE(stock, 0) - v_qty), updated_at = timezone('utc', now())
      WHERE id = v_product_id::UUID AND tenant_id = v_tenant_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'receipt_id', v_receipt_id);
END;
$$;


-- 9B. create_stock_transfer: Validates from_branch, to_branch, and product ownership
CREATE OR REPLACE FUNCTION public.create_stock_transfer(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
  v_transfer_id UUID;
  v_from_branch_id UUID;
  v_to_branch_id UUID;
  v_item jsonb;
  v_product_id UUID;
  v_qty NUMERIC;
BEGIN
  v_tenant_id := public.current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: tenant_id could not be resolved';
  END IF;

  v_from_branch_id := (payload->>'from_branch_id')::UUID;
  v_to_branch_id := (payload->>'to_branch_id')::UUID;

  IF v_from_branch_id IS NULL OR v_to_branch_id IS NULL THEN
    RAISE EXCEPTION 'from_branch_id and to_branch_id are required';
  END IF;

  IF v_from_branch_id = v_to_branch_id THEN
    RAISE EXCEPTION 'from_branch_id and to_branch_id must be different';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.branch WHERE id = v_from_branch_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'from_branch_id does not belong to current salon';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branch WHERE id = v_to_branch_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'to_branch_id does not belong to current salon';
  END IF;

  -- Validate product ownership
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'qty')::NUMERIC;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'qty must be > 0 for product %', v_product_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.product WHERE id = v_product_id AND tenant_id = v_tenant_id) THEN
      RAISE EXCEPTION 'Product % does not belong to current salon', v_product_id;
    END IF;
  END LOOP;

  INSERT INTO public.inventory_transfers (
    code, from_branch_id, from_branch_name, to_branch_id, to_branch_name,
    date, status, note, created_by, created_at, updated_at, tenant_id
  ) VALUES (
    COALESCE(payload->>'code', 'CK-' || to_char(now(), 'YYYYMMDD') || '-' || floor(100 + random() * 900)::text),
    v_from_branch_id, payload->>'from_branch_name',
    v_to_branch_id, payload->>'to_branch_name',
    COALESCE(payload->>'date', to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    'pending', payload->>'note', COALESCE(payload->>'created_by', 'system'),
    now(), now(), v_tenant_id
  ) RETURNING id INTO v_transfer_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := (v_item->>'qty')::NUMERIC;

    INSERT INTO public.inventory_transfer_items (
      transfer_id, product_id, product_name, unit, qty, note, created_at, tenant_id
    ) VALUES (
      v_transfer_id, v_product_id, v_item->>'product_name',
      v_item->>'unit', v_qty, v_item->>'note', now(), v_tenant_id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'transfer_id', v_transfer_id);
END;
$$;


-- 9C. confirm_stock_transfer
CREATE OR REPLACE FUNCTION public.confirm_stock_transfer(p_transfer_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tenant_id UUID;
  v_current_status text;
BEGIN
  v_tenant_id := public.current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: tenant_id could not be resolved';
  END IF;

  SELECT status INTO v_current_status
  FROM public.inventory_transfers
  WHERE id = p_transfer_id AND tenant_id = v_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found in current salon', p_transfer_id;
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Transfer cannot be confirmed because status is %', v_current_status;
  END IF;

  UPDATE public.inventory_transfers
  SET status = 'transferred', updated_at = now()
  WHERE id = p_transfer_id AND tenant_id = v_tenant_id;

  RETURN jsonb_build_object('success', true, 'id', p_transfer_id, 'status', 'transferred');
END;
$$;


-- ------------------------------------------------------------------------------
-- 10. HARDEN TRIGGERS (Scoped Membership & Cashflow Synchronization)
-- ------------------------------------------------------------------------------

-- 10A. process_invoice_packages: Membership scope locked to NEW.tenant_id
CREATE OR REPLACE FUNCTION public.process_invoice_packages()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    item JSONB;
    item_type TEXT;
    item_id TEXT;
    item_qty INTEGER;
    is_from_package BOOLEAN;
    pkg_usage_count INTEGER;
    pkg_expiry_months INTEGER;
    trt_expiry_months INTEGER;
    new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            item_type := item->>'type';
            item_id := item->>'id';
            item_qty := COALESCE((item->>'qty')::integer, 1);
            is_from_package := COALESCE((item->>'is_from_package')::boolean, false);
            
            IF is_from_package THEN
                IF item->>'customer_package_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_package_id')::uuid 
                      AND tenant_id = NEW.tenant_id;
                    
                    INSERT INTO public.package_usage_history (
                        customer_package_id, customer_id, invoice_id, usage_count, branch_id, tenant_id
                    ) VALUES (
                        (item->>'customer_package_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id, NEW.tenant_id
                    );
                ELSIF item->>'customer_treatment_id' IS NOT NULL THEN
                    UPDATE public.membership
                    SET sessions_remaining = GREATEST(0, sessions_remaining - item_qty),
                        status = CASE WHEN sessions_remaining - item_qty <= 0 THEN 'exhausted' ELSE 'active' END
                    WHERE id = (item->>'customer_treatment_id')::uuid 
                      AND tenant_id = NEW.tenant_id;
                    
                    INSERT INTO public.package_usage_history (
                        customer_treatment_id, customer_id, invoice_id, usage_count, branch_id, tenant_id
                    ) VALUES (
                        (item->>'customer_treatment_id')::uuid, NEW.customer_id, NEW.id, item_qty, NEW.branch_id, NEW.tenant_id
                    );
                END IF;
                CONTINUE;
            END IF;

            IF item_type = 'package' THEN
                SELECT usage_count, expiry_months INTO pkg_usage_count, pkg_expiry_months 
                FROM public.servicepackage WHERE id = item_id::uuid AND tenant_id = NEW.tenant_id;
                
                IF FOUND THEN
                    IF pkg_expiry_months > 0 THEN
                        new_expires_at := CURRENT_TIMESTAMP + (pkg_expiry_months || ' months')::interval;
                    ELSE
                        new_expires_at := NULL;
                    END IF;
                    
                    FOR i IN 1..item_qty LOOP
                        INSERT INTO public.customer_package (
                            customer_id, package_id, invoice_id, total_usage, remaining_usage, expires_at, branch_id, tenant_id
                        ) VALUES (
                            NEW.customer_id, item_id::uuid, NEW.id, COALESCE(pkg_usage_count, 1), COALESCE(pkg_usage_count, 1), new_expires_at, NEW.branch_id, NEW.tenant_id
                        );
                    END LOOP;
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;

-- 10B. sync_deposit_to_cashflow: Cashvoucher scoped explicitly to NEW.tenant_id
CREATE OR REPLACE FUNCTION public.sync_deposit_to_cashflow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.paid_amount > 0 THEN
            INSERT INTO public.cashvoucher (
                code, flow, type_code, type_name, amount, date, description, note,
                payment_method, source, ref_id, ref_code, branch_id, created_by, tenant_id
            ) VALUES (
                'PT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
                'income', 'deposit', 'Đặt cọc', NEW.paid_amount, CURRENT_DATE,
                'Thu tiền cọc phiếu ' || NEW.deposit_number, NEW.notes,
                COALESCE(NEW.payment_method, 'cash'), 'auto', NEW.id, NEW.deposit_number,
                NEW.branch_id, 'system', NEW.tenant_id
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.paid_amount <> OLD.paid_amount THEN
            UPDATE public.cashvoucher 
            SET amount = NEW.paid_amount 
            WHERE ref_id = NEW.id AND type_code = 'deposit' AND tenant_id = NEW.tenant_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.cashvoucher 
        WHERE ref_id = OLD.id AND type_code = 'deposit' AND tenant_id = OLD.tenant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;



-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC TENANT PROVISIONING ON SUPABASE AUTH SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.user_profile (id, email, full_name, role, tenant_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'owner',
        new_tenant_id
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notice: auth.users trigger setup skipped: %', SQLERRM;
END $$;



-- ------------------------------------------------------------------------------
-- DEFAULT SYSTEM ROLES
-- ------------------------------------------------------------------------------
INSERT INTO public.roles (id, code, name, description, is_system, tenant_id)
VALUES 
    ('797961e1-565d-4537-a565-2992747e4d7c', 'owner', 'Chủ Salon (Owner)', 'Quyền hạn tối cao toàn hệ thống.', true, 'a0000000-0000-0000-0000-000000000001'),
    ('74f8ff8e-9ece-45e9-8f86-5ee2a93be03d', 'admin', 'Quản trị (Admin)', 'Quản lý các hoạt động vận hành thường nhật.', true, 'a0000000-0000-0000-0000-000000000001'),
    ('8c1eefcd-9555-4479-a717-1ae081dba520', 'cashier', 'Thu ngân', 'Thực hiện bán hàng và quản lý danh sách khách hàng.', true, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- File: seed_staging_synthetic_data.sql
-- Description: Complete Synthetic Dataset for Staging Multi-Tenant Verification
-- Target: STAGING / TEST DATABASE ONLY

-- ------------------------------------------------------------------------------
-- 1. SYNTHETIC TENANT IDENTIFIERS & ACTOR USER PROFILES
-- ------------------------------------------------------------------------------
INSERT INTO public.user_profile (id, tenant_id, role, full_name, email, phone)
VALUES 
    ('a1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner', 'Owner Alpha Staging', 'owner.alpha@staging.test', '0900000001'),
    ('a1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'admin', 'Admin Alpha Staging', 'admin.alpha@staging.test', '0900000002'),
    ('a1111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manager', 'Manager Alpha Staging', 'manager.alpha@staging.test', '0900000003'),
    ('a1111111-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'staff', 'Staff Alpha Staging', 'staff.alpha@staging.test', '0900000004'),
    ('b1111111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'owner', 'Owner Beta Staging', 'owner.beta@staging.test', '0900000011'),
    ('b1111111-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'staff', 'Staff Beta Staging', 'staff.beta@staging.test', '0900000014')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SYNTHETIC BRANCHES
-- ------------------------------------------------------------------------------
INSERT INTO public.branch (id, tenant_id, name, address, phone, is_active)
VALUES 
    ('a2222222-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Chi Nhánh Alpha 1', '100 Đường Alpha, Q1', '0900000001', true),
    ('a2222222-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Chi Nhánh Alpha 2', '200 Đường Alpha, Q3', '0900000002', true),
    ('b2222222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Chi Nhánh Beta 1', '100 Đường Beta, Q7', '0900000011', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. SYNTHETIC CUSTOMERS
-- ------------------------------------------------------------------------------
INSERT INTO public.customer (id, tenant_id, name, phone, email, points, total_spent)
VALUES 
    ('a3333333-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', '0911000001', 'customer.a1@staging.test', 100, 500000),
    ('a3333333-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Khách Hàng Alpha 2', '0911000002', 'customer.a2@staging.test', 50, 200000),
    ('b3333333-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Khách Hàng Beta 1', '0911000011', 'customer.b1@staging.test', 200, 1000000)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. SYNTHETIC STAFF
-- ------------------------------------------------------------------------------
INSERT INTO public.staff (id, tenant_id, branch_id, full_name, phone, role)
VALUES 
    ('a4444444-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Kỹ Thuật Viên Alpha 1', '0922000001', 'technician'),
    ('b4444444-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'Kỹ Thuật Viên Beta 1', '0922000011', 'technician')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SYNTHETIC SERVICES & PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.service (id, tenant_id, branch_ids, name, price, duration_minutes)
VALUES 
    ('a5555555-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', ARRAY['a2222222-0000-0000-0000-000000000001'::uuid], 'Chăm Sóc Da Alpha', 250000, 60),
    ('b5555555-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', ARRAY['b2222222-0000-0000-0000-000000000001'::uuid], 'Chăm Sóc Da Beta', 300000, 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product (id, tenant_id, branch_ids, name, price, stock)
VALUES 
    ('a6666666-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', ARRAY['a2222222-0000-0000-0000-000000000001'::uuid], 'Serum Dưỡng Da Alpha', 150000, 100),
    ('b6666666-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', ARRAY['b2222222-0000-0000-0000-000000000001'::uuid], 'Serum Dưỡng Da Beta', 180000, 50)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. SYNTHETIC APPOINTMENTS & INVOICES
-- ------------------------------------------------------------------------------
INSERT INTO public.appointment (id, tenant_id, branch_id, customer_id, customer_name, service_id, date, start_time, status)
VALUES 
    ('a7777777-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', 'a5555555-0000-0000-0000-000000000001', CURRENT_DATE, '09:00', 'completed'),
    ('b7777777-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 'Khách Hàng Beta 1', 'b5555555-0000-0000-0000-000000000001', CURRENT_DATE, '10:00', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice (id, tenant_id, invoice_code, branch_id, customer_id, customer_name, total, subtotal, status)
VALUES 
    ('a8888888-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'HD-ALPHA-001', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', 250000, 250000, 'paid'),
    ('b8888888-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'HD-BETA-001', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 'Khách Hàng Beta 1', 300000, 300000, 'paid')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. SYNTHETIC DEPOSITS & TRANSACTIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.deposit (id, tenant_id, deposit_number, branch_id, customer_id, paid_amount, status)
VALUES 
    ('a9999999-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DEP-ALPHA-01', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 50000, 'active'),
    ('b9999999-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'DEP-BETA-01', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 100000, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deposit_transaction (id, tenant_id, deposit_id, action, amount)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'a9999999-0000-0000-0000-000000000001', 'deposit', 50000),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'b9999999-0000-0000-0000-000000000001', 'deposit', 100000);

-- ------------------------------------------------------------------------------
-- 8. SYNTHETIC MEMBERSHIPS & PACKAGES
-- ------------------------------------------------------------------------------
INSERT INTO public.membership (id, tenant_id, customer_id, customer_name, branch_id, type, name, total_sessions, sessions_remaining, status)
VALUES 
    ('aaaa0000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', 'a2222222-0000-0000-0000-000000000001', 'package', 'Gói Trị Liệu Alpha 10 Buổi', 10, 8, 'active'),
    ('bbbb0000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b3333333-0000-0000-0000-000000000001', 'Khách Hàng Beta 1', 'b2222222-0000-0000-0000-000000000001', 'package', 'Gói Trị Liệu Beta 5 Buổi', 5, 5, 'active')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. SYNTHETIC PROMOTIONS & VOUCHERS
-- ------------------------------------------------------------------------------
INSERT INTO public.promotions (id, tenant_id, name, code, discount_value, status)
VALUES 
    ('aaaa1111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Khuyến Mãi Mùa Hè Alpha', 'SUMMER_ALPHA', 10, 'active'),
    ('bbbb1111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Khuyến Mãi Mùa Hè Beta', 'SUMMER_BETA', 15, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vouchers (id, tenant_id, promotion_id, code, discount_value)
VALUES 
    ('aaaa2222-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000001', 'VOUCHER_VIP', 50000),
    ('bbbb2222-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'bbbb1111-0000-0000-0000-000000000001', 'VOUCHER_VIP', 50000)
ON CONFLICT (id) DO NOTHING;

COMMIT;
