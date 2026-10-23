-- ==============================================================================
-- File: PRE_MIGRATION_AUDIT.sql
-- Description: Comprehensive Pre-Migration Diagnostic & Snapshot Script for GloPro
-- Author: Senior PostgreSQL Security Engineer & Multi-Tenant Architect
-- Date: 2026-09-28
-- Usage: Run in Supabase SQL Editor prior to executing migration 0121.
-- ==============================================================================

-- 1. Table & RLS Status Snapshot
SELECT 
    t.tablename AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'tenant_id'
    ) AS has_tenant_id,
    (
        SELECT is_nullable FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t.tablename AND column_name = 'tenant_id'
    ) AS tenant_id_nullable,
    pg_total_relation_size('"' || t.tablename || '"') AS size_bytes
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- 2. Row Counts and NULL tenant_id Counts Across All Tables
DO $$
DECLARE
    tbl RECORD;
    v_total_rows BIGINT;
    v_null_tenant_rows BIGINT;
    v_has_col BOOLEAN;
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'TABLE AUDIT: ROW COUNTS AND NULL TENANT_ID STATUS';
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
            RAISE NOTICE 'Table: % | Total Rows: % | NULL tenant_id: %', 
                rpad(tbl.tablename, 30), lpad(v_total_rows::text, 6), lpad(v_null_tenant_rows::text, 6);
        ELSE
            RAISE NOTICE 'Table: % | Total Rows: % | tenant_id column: MISSING', 
                rpad(tbl.tablename, 30), lpad(v_total_rows::text, 6);
        END IF;
    END LOOP;
END $$;

-- 3. Existing RLS Policies Snapshot
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Foreign Key Constraints Snapshot
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Database Triggers Snapshot
SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_timing AS timing,
    action_statement AS statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. SECURITY DEFINER Functions Snapshot
SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS is_security_definer,
    p.proconfig AS execution_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef = true
ORDER BY p.proname;

-- 7. Unique Constraints and Indexes Snapshot
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    ix.indisunique AS is_unique,
    string_agg(a.attname, ', ') AS columns
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public' AND ix.indisunique = true
GROUP BY t.relname, i.relname, ix.indisunique
ORDER BY t.relname, i.relname;
