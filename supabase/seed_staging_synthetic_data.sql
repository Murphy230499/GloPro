-- ==============================================================================
-- File: seed_staging_synthetic_data.sql
-- Description: Complete Synthetic Dataset for Staging Multi-Tenant Verification
-- Author: Senior PostgreSQL Security Engineer & Red Team Multi-Tenant Auditor
-- Date: 2026-09-28
-- Standard: ZERO PRODUCTION DATA POLLUTION (100% Synthetic / Mocked Data)
-- Target: STAGING / TEST DATABASE ONLY (Never execute on Production)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. SYNTHETIC TENANT IDENTIFIERS & ACTOR USER PROFILES
-- ------------------------------------------------------------------------------
-- Tenant Identifiers
-- Tenant A: a0000000-0000-0000-0000-000000000001 (Salon Alpha)
-- Tenant B: b0000000-0000-0000-0000-000000000002 (Salon Beta)

-- Tenant A Actors:
INSERT INTO public.user_profile (id, tenant_id, role, full_name, email, phone)
VALUES 
    ('a1111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner', 'Owner Alpha Staging', 'owner.alpha@staging.test', '0900000001'),
    ('a1111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'admin', 'Admin Alpha Staging', 'admin.alpha@staging.test', '0900000002'),
    ('a1111111-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'manager', 'Manager Alpha Staging', 'manager.alpha@staging.test', '0900000003'),
    ('a1111111-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'staff', 'Staff Alpha Staging', 'staff.alpha@staging.test', '0900000004')
ON CONFLICT (id) DO NOTHING;

-- Tenant B Actors:
INSERT INTO public.user_profile (id, tenant_id, role, full_name, email, phone)
VALUES 
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
INSERT INTO public.staff (id, tenant_id, branch_id, name, phone, role)
VALUES 
    ('a4444444-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Kỹ Thuật Viên Alpha 1', '0922000001', 'technician'),
    ('b4444444-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'Kỹ Thuật Viên Beta 1', '0922000011', 'technician')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 5. SYNTHETIC SERVICES & PRODUCTS
-- ------------------------------------------------------------------------------
INSERT INTO public.service (id, tenant_id, branch_id, name, price, duration)
VALUES 
    ('a5555555-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Chăm Sóc Da Alpha', 250000, 60),
    ('b5555555-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'Chăm Sóc Da Beta', 300000, 60)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product (id, tenant_id, branch_id, name, price, stock_quantity)
VALUES 
    ('a6666666-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Serum Dưỡng Da Alpha', 150000, 100),
    ('b6666666-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'Serum Dưỡng Da Beta', 180000, 50)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 6. SYNTHETIC APPOINTMENTS & INVOICES
-- ------------------------------------------------------------------------------
INSERT INTO public.appointment (id, tenant_id, branch_id, customer_id, customer_name, service_id, date, start_time, status)
VALUES 
    ('a7777777-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', 'a5555555-0000-0000-0000-000000000001', CURRENT_DATE, '09:00', 'completed'),
    ('b7777777-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 'Khách Hàng Beta 1', 'b5555555-0000-0000-0000-000000000001', CURRENT_DATE, '10:00', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.invoice (id, tenant_id, invoice_code, branch_id, customer_id, customer_name, total_amount, status)
VALUES 
    ('a8888888-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'HD-ALPHA-001', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'Khách Hàng Alpha 1', 250000, 'paid'),
    ('b8888888-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'HD-BETA-001', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 'Khách Hàng Beta 1', 300000, 'paid')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 7. SYNTHETIC DEPOSITS & TRANSACTIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.deposit (id, tenant_id, deposit_number, branch_id, customer_id, paid_amount, status)
VALUES 
    ('a9999999-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DEP-ALPHA-01', 'a2222222-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 50000, 'active'),
    ('b9999999-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'DEP-BETA-01', 'b2222222-0000-0000-0000-000000000001', 'b3333333-0000-0000-0000-000000000001', 100000, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deposit_transaction (id, tenant_id, deposit_id, type, amount)
VALUES 
    (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'a9999999-0000-0000-0000-000000000001', 'deposit', 50000),
    (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'b9999999-0000-0000-0000-000000000001', 'deposit', 100000);


-- ------------------------------------------------------------------------------
-- 8. SYNTHETIC MEMBERSHIPS & PACKAGES
-- ------------------------------------------------------------------------------
INSERT INTO public.membership (id, tenant_id, customer_id, branch_id, package_name, sessions_total, sessions_remaining, status)
VALUES 
    ('aaaa0000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a3333333-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'Gói Trị Liệu Alpha 10 Buổi', 10, 8, 'active'),
    ('bbbb0000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b3333333-0000-0000-0000-000000000001', 'b2222222-0000-0000-0000-000000000001', 'Gói Trị Liệu Beta 5 Buổi', 5, 5, 'active')
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 9. SYNTHETIC PROMOTIONS & VOUCHERS
-- ------------------------------------------------------------------------------
INSERT INTO public.promotions (id, tenant_id, name, code, discount_percent, is_active)
VALUES 
    ('aaaa1111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Khuyến Mãi Mùa Hè Alpha', 'SUMMER_ALPHA', 10, true),
    ('bbbb1111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Khuyến Mãi Mùa Hè Beta', 'SUMMER_BETA', 15, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vouchers (id, tenant_id, promotion_id, code, discount_amount)
VALUES 
    ('aaaa2222-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000001', 'VOUCHER_VIP', 50000),
    ('bbbb2222-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'bbbb1111-0000-0000-0000-000000000001', 'VOUCHER_VIP', 50000)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 10. SYNTHETIC THIRD-PARTY INTEGRATIONS & AI AGENT SESSIONS
-- ------------------------------------------------------------------------------
-- Integration table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Integration') THEN
        INSERT INTO public."Integration" (id, tenant_id, branch_id, provider, status, credentials)
        VALUES 
            ('aaaa3333-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a2222222-0000-0000-0000-000000000001', 'zalo', 'connected', '{"app_id": "SYNTHETIC_ZALO_A", "secret": "SYNTHETIC_SECRET_ALPHA"}'::jsonb),
            ('bbbb3333-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b2222222-0000-0000-0000-000000000001', 'zalo', 'connected', '{"app_id": "SYNTHETIC_ZALO_B", "secret": "SYNTHETIC_SECRET_BETA"}'::jsonb)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- agent_sessions table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_sessions') THEN
        INSERT INTO public.agent_sessions (id, tenant_id, conversation_id, actor_id, branch_id, state_json, expires_at)
        VALUES 
            ('aaaa4444-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'conv-alpha-001', 'actor-alpha', 'a2222222-0000-0000-0000-000000000001', '{"prompt": "Synthetic prompt Alpha"}'::jsonb, NOW() + INTERVAL '7 days'),
            ('bbbb4444-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'conv-beta-001', 'actor-beta', 'b2222222-0000-0000-0000-000000000001', '{"prompt": "Synthetic prompt Beta"}'::jsonb, NOW() + INTERVAL '7 days')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

COMMIT;
