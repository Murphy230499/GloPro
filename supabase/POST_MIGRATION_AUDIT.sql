-- ==============================================================================
-- File: POST_MIGRATION_AUDIT.sql
-- Description: Post-Migration Security & Data Verification Script for GloPro
-- Author: Senior PostgreSQL Security Engineer & Multi-Tenant Architect
-- Date: 2026-09-28
-- Usage: Run in Supabase SQL Editor immediately after executing migration 0121.
-- ==============================================================================

DO $$
DECLARE
    v_missing_rls INT := 0;
    v_missing_tenant_col INT := 0;
    v_unexpected_null_rows INT := 0;
    v_trigger_count INT := 0;
    tbl RECORD;
    v_cnt BIGINT;
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'POST-MIGRATION VERIFICATION AUDIT START';
    RAISE NOTICE '====================================================================';

    -- 1. Check RLS on All Tables
    FOR tbl IN 
        SELECT t.tablename, c.relrowsecurity, c.relforcerowsecurity
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public'
          AND t.tablename NOT IN ('schema_migrations', '_prisma_migrations')
    LOOP
        IF NOT tbl.relrowsecurity THEN
            RAISE WARNING 'SECURITY VIOLATION: Table % DOES NOT have RLS enabled!', tbl.tablename;
            v_missing_rls := v_missing_rls + 1;
        END IF;
    END LOOP;

    IF v_missing_rls = 0 THEN
        RAISE NOTICE '✅ 1. RLS ENABLED: 100%% of public business tables have Row Level Security enabled.';
    ELSE
        RAISE WARNING '❌ 1. RLS DEFECT: % tables lack Row Level Security!', v_missing_rls;
    END IF;

    -- 2. Check tenant_id Column on All Business Tables
    FOR tbl IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT IN ('schema_migrations', '_prisma_migrations')
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl.tablename AND column_name = 'tenant_id'
        ) THEN
            RAISE WARNING 'SCHEMA DEFECT: Table % is missing tenant_id column!', tbl.tablename;
            v_missing_tenant_col := v_missing_tenant_col + 1;
        END IF;
    END LOOP;

    IF v_missing_tenant_col = 0 THEN
        RAISE NOTICE '✅ 2. TENANT_ID COLUMN: All business tables have tenant_id column.';
    ELSE
        RAISE WARNING '❌ 2. SCHEMA DEFECT: % tables missing tenant_id!', v_missing_tenant_col;
    END IF;

    -- 3. Check for Unexpected NULL tenant_id Rows on Core Business Tables
    -- (Excluding intentional system templates: inventory_suppliers, promotions, vouchers, roles, role_permissions, cashvouchertype)
    FOR tbl IN
        SELECT tablename FROM (VALUES 
            ('customer'), ('invoice'), ('appointment'), ('branch'), ('staff'),
            ('product'), ('service'), ('membership'), ('cashvoucher'), ('deposit'),
            ('facility'), ('room'), ('customer_treatment'), ('customer_package'),
            ('package_usage_history')
        ) AS t(tablename)
    LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl.tablename) THEN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE tenant_id IS NULL', tbl.tablename) INTO v_cnt;
            IF v_cnt > 0 THEN
                RAISE WARNING 'DATA INTEGRITY VIOLATION: Table % has % rows with tenant_id IS NULL!', tbl.tablename, v_cnt;
                v_unexpected_null_rows := v_unexpected_null_rows + v_cnt;
            END IF;
        END IF;
    END LOOP;

    IF v_unexpected_null_rows = 0 THEN
        RAISE NOTICE '✅ 3. DATA INTEGRITY: Zero unexpected NULL tenant_id rows on core business tables.';
    ELSE
        RAISE WARNING '❌ 3. DATA DEFECT: Found % unexpected NULL tenant_id rows!', v_unexpected_null_rows;
    END IF;

    -- 4. Check user_profile Tampering Trigger
    SELECT count(*) INTO v_trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
      AND event_object_table = 'user_profile' 
      AND trigger_name = 'trg_prevent_tenant_id_tampering';

    IF v_trigger_count > 0 THEN
        RAISE NOTICE '✅ 4. IMMUTABLE IDENTITY: trg_prevent_tenant_id_tampering is active on user_profile.';
    ELSE
        RAISE WARNING '❌ 4. CRITICAL DEFECT: trg_prevent_tenant_id_tampering is MISSING from user_profile!';
    END IF;

    -- 5. Summary
    IF v_missing_rls = 0 AND v_missing_tenant_col = 0 AND v_unexpected_null_rows = 0 AND v_trigger_count > 0 THEN
        RAISE NOTICE '====================================================================';
        RAISE NOTICE 'POST-MIGRATION AUDIT RESULT: ALL PASS (DATABASE READY FOR ADVERSARIAL TEST)';
        RAISE NOTICE '====================================================================';
    ELSE
        RAISE WARNING '====================================================================';
        RAISE WARNING 'POST-MIGRATION AUDIT RESULT: DEFECTS DETECTED — REVIEW WARNINGS ABOVE';
        RAISE WARNING '====================================================================';
    END IF;
END $$;
