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
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id()', tbl);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)', tbl, tbl);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Skipping column addition for %: %', tbl, SQLERRM;
        END;
    END LOOP;
END $$;


-- ------------------------------------------------------------------------------
-- 4. DATA BACKFILL & STRICT PRESERVATION
-- ------------------------------------------------------------------------------
-- 4A. package_usage_history: 100% verified ownership to Salon Main
UPDATE public.package_usage_history
SET tenant_id = '6cb88c32-06c6-4b95-b286-99bc8c141c79'
WHERE id IN ('f317add0-d41a-499e-98c1-809ca19de456', '9f194c6f-e9b8-45c0-a5ff-d75899c0b741')
  AND tenant_id IS NULL;

-- 4B. 9 unassigned records remain tenant_id = NULL
-- (inventory_suppliers: 3, promotions: 3, vouchers: 3)


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
        ALTER TABLE public."Integration" ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT public.current_tenant_id();
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
