-- ==============================================================================
-- File: FINAL_SECURITY_AUDIT.sql
-- Description: Comprehensive Multi-Tenant Security & Schema Audit Script (Phase 2)
-- Author: Senior PostgreSQL Security Engineer & Red Team Multi-Tenant Auditor
-- Date: 2026-09-28
-- Standard: ZERO CROSS-TENANT DATA LEAK
-- Usage: Execute in Supabase SQL Editor. 100% Non-destructive (Read-Only).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE & RLS / FORCE RLS COVERAGE AUDIT (55 TABLES)
-- ------------------------------------------------------------------------------
SELECT 
    t.tablename AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'tenant_id'
    ) AS has_tenant_id,
    (
        SELECT count(*) FROM pg_policies p 
        WHERE p.schemaname = 'public' AND p.tablename = t.tablename
    ) AS policy_count,
    CASE 
        WHEN t.tablename IN ('roles', 'role_permissions', 'cashvouchertype') THEN 'Hybrid (System+Tenant)'
        WHEN t.tablename = 'user_profile' THEN 'Identity (Tenant Bound)'
        WHEN t.tablename = 'bookingsetting' THEN 'Public Config (Scoped)'
        WHEN t.tablename IN ('schema_migrations', '_prisma_migrations') THEN 'Internal System'
        WHEN t.tablename IN ('Integration', 'agent_sessions') THEN 'AI & External Integrations'
        ELSE 'Tenant-Scoped Business Data'
    END AS classification
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY classification, t.tablename;


-- ------------------------------------------------------------------------------
-- 2. COMPOSITE FOREIGN KEY AUDIT & CASCADE RISK CLASSIFICATION (71 FKS)
-- ------------------------------------------------------------------------------
WITH fk_info AS (
    SELECT
        tc.table_name AS child_table,
        kcu.column_name AS child_column,
        ccu.table_name AS parent_table,
        ccu.column_name AS parent_column,
        rc.delete_rule,
        rc.update_rule,
        tc.constraint_name,
        EXISTS (
            SELECT 1 FROM information_schema.key_column_usage k2 
            WHERE k2.constraint_name = tc.constraint_name AND k2.column_name = 'tenant_id'
        ) AS is_composite_tenant
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
)
SELECT 
    child_table,
    child_column,
    parent_table,
    parent_column,
    delete_rule,
    CASE 
        WHEN delete_rule = 'CASCADE' AND NOT is_composite_tenant THEN '🚨 CRITICAL (Cross-Tenant Cascade Destruction Risk!)'
        WHEN delete_rule = 'CASCADE' AND is_composite_tenant THEN '✅ SAFE CASCADE (Tenant-Scoped Composite FK)'
        WHEN delete_rule = 'SET NULL' AND NOT is_composite_tenant THEN '⚠️ UNSAFE SET NULL (Single-Column Reference)'
        WHEN delete_rule = 'SET NULL' AND is_composite_tenant THEN '✅ SAFE SET NULL (Tenant-Scoped Composite FK)'
        ELSE delete_rule
    END AS cascade_assessment,
    CASE
        WHEN is_composite_tenant THEN 'Category A — Tenant-Safe Composite FK'
        WHEN child_table = parent_table THEN 'Category B — Self/Same-Table Reference'
        WHEN parent_table IN ('roles', 'cashvouchertype', 'servicegroup', 'user') THEN 'Category C — Shared/System Template'
        ELSE '🚨 Category D — UNSAFE Single-Column Tenant FK'
    END AS fk_classification,
    constraint_name
FROM fk_info
ORDER BY is_composite_tenant ASC, child_table, child_column;


-- ------------------------------------------------------------------------------
-- 3. PARENT TABLES UNIQUE (tenant_id, id) AUDIT
-- ------------------------------------------------------------------------------
SELECT
    t.tablename AS parent_table,
    EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = t.tablename AND c.conname = 'uq_' || t.tablename || '_tenant_id'
    ) AS has_parent_tenant_unique
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'branch', 'customer', 'customergroup', 'appointment', 'invoice', 
    'service', 'servicepackage', 'treatment', 'staff', 'shifttemplate', 
    'deposit', 'membership', 'room', 'promotions', 'vouchers', 
    'inventory_suppliers', 'inventory_receipts', 'inventory_transfers', 
    'product', 'customer_package', 'customer_treatment'
  )
ORDER BY t.tablename;


-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER FUNCTIONS, SEARCH_PATH & EXECUTE PRIVILEGES AUDIT
-- ------------------------------------------------------------------------------
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS is_security_definer,
    CASE 
        WHEN p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') ~* 'search_path=public' 
        THEN '✅ SAFE (search_path=public)' 
        ELSE '🚨 VULNERABLE (Missing secure search_path)' 
    END AS search_path_status,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_execute,
    CASE 
        WHEN p.proname IN ('create_stock_transfer', 'create_stock_receipt', 'confirm_stock_transfer') THEN 'Inventory RPC (Must require owner/admin/manager)'
        WHEN p.proname = 'current_tenant_id' THEN 'Core Identity Resolver'
        WHEN p.proname = 'prevent_tenant_id_tampering' THEN 'Tenant Identity Boundary'
        WHEN p.proname = 'protect_system_roles' THEN 'System Role Boundary'
        WHEN p.proname = 'is_tenant_admin' THEN 'Tenant Role Validator'
        ELSE 'General Stored Procedure'
    END AS security_role
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef = true
ORDER BY p.proname;


-- ------------------------------------------------------------------------------
-- 5. DATABASE TRIGGERS AUDIT
-- ------------------------------------------------------------------------------
SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS statement,
    CASE 
        WHEN trigger_name = 'trg_prevent_tenant_id_tampering' THEN '✅ Identity Protection Trigger'
        WHEN trigger_name = 'trg_protect_system_roles' THEN '✅ System Role Protection Trigger'
        WHEN trigger_name = 'trigger_process_invoice_packages' THEN '✅ Package Sync (Scoped to NEW.tenant_id)'
        WHEN trigger_name = 'trigger_sync_deposit_to_cashflow' THEN '✅ Deposit Cashflow Sync (Scoped to NEW.tenant_id)'
        WHEN trigger_name = 'trigger_sync_invoice_deposit_to_cashflow' THEN '✅ Invoice Deposit Sync (Scoped to NEW.tenant_id)'
        WHEN trigger_name LIKE 'trigger_update_%_updated_at' THEN 'Timestamp Trigger'
        ELSE 'Custom Business Trigger'
    END AS trigger_classification
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ------------------------------------------------------------------------------
-- 6. DATA PROVENANCE & NULL TENANT_ID AUDIT
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    tbl RECORD;
    v_total_rows BIGINT;
    v_null_tenant_rows BIGINT;
    v_has_col BOOLEAN;
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'AUDIT: DATA ROWS AND NULL TENANT_ID STATUS';
    RAISE NOTICE '====================================================================';
    
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT count(*) FROM public.%I', tbl.tablename) INTO v_total_rows;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl.tablename AND column_name = 'tenant_id'
        ) INTO v_has_col;
        
        IF v_has_col THEN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id IS NULL', tbl.tablename) INTO v_null_tenant_rows;
            IF v_null_tenant_rows > 0 THEN
                RAISE NOTICE 'Table: % | Total: % | NULL: % (CLASSIFICATION: %)', 
                    rpad(tbl.tablename, 28), lpad(v_total_rows::text, 6), lpad(v_null_tenant_rows::text, 6),
                    CASE 
                        WHEN tbl.tablename IN ('roles', 'role_permissions', 'cashvouchertype') THEN 'VALID SYSTEM TEMPLATE'
                        WHEN tbl.tablename IN ('inventory_suppliers', 'promotions', 'vouchers') THEN 'UNASSIGNED SEEDER TEMPLATE (9 Rows Preserved)'
                        WHEN tbl.tablename = 'package_usage_history' THEN 'PENDING BACKFILL (SALON MAIN)'
                        ELSE '🚨 DATA INTEGRITY DEFECT'
                    END;
            ELSE
                RAISE NOTICE 'Table: % | Total: % | NULL: 0 (100%% TENANT SCOPED)', 
                    rpad(tbl.tablename, 28), lpad(v_total_rows::text, 6);
            END IF;
        ELSE
            RAISE NOTICE 'Table: % | Total: % | tenant_id: ❌ MISSING COLUMN', 
                rpad(tbl.tablename, 28), lpad(v_total_rows::text, 6);
        END IF;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 7. UNIQUE CONSTRAINTS & NAMESPACE COLLISION AUDIT
-- ------------------------------------------------------------------------------
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    string_agg(a.attname, ', ') AS indexed_columns,
    CASE 
        WHEN string_agg(a.attname, ', ') LIKE '%tenant_id%' THEN '✅ Composite Tenant-Aware UNIQUE'
        WHEN t.relname = 'user_profile' AND string_agg(a.attname, ', ') = 'email' THEN '✅ Valid Global Unique (User Email)'
        WHEN string_agg(a.attname, ', ') = 'id' THEN 'Primary Key'
        WHEN string_agg(a.attname, ', ') IN ('code', 'deposit_number', 'number') THEN '🚨 UNSAFE Global Unique (DoS / Collision Vector)'
        ELSE 'Review Semantic'
    END AS namespace_assessment
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND ix.indisunique = true
GROUP BY t.relname, i.relname
ORDER BY namespace_assessment DESC, t.relname;
