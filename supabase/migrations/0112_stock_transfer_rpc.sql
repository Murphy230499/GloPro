-- Migration: 0112_stock_transfer_rpc.sql
-- Description: Add missing columns, indexes, and atomic RPC functions for Stock Transfer (Record-Only)

-- 1. Alter inventory_transfers
ALTER TABLE public.inventory_transfers
  ADD COLUMN IF NOT EXISTS from_branch_name varchar,
  ADD COLUMN IF NOT EXISTS to_branch_name varchar,
  ADD COLUMN IF NOT EXISTS date varchar,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Alter inventory_transfer_items
ALTER TABLE public.inventory_transfer_items
  ADD COLUMN IF NOT EXISTS product_name varchar,
  ADD COLUMN IF NOT EXISTS unit varchar,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_transfers_from_branch ON public.inventory_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_branch ON public.inventory_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.inventory_transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON public.inventory_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON public.inventory_transfer_items(product_id);

-- 4. RPC: create_stock_transfer
CREATE OR REPLACE FUNCTION public.create_stock_transfer(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_from_branch_id uuid;
  v_to_branch_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_product_name text;
  v_unit text;
  v_items_count int;
BEGIN
  -- 1. Validate from_branch_id and to_branch_id
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

  -- 2. Validate items
  IF payload->'items' IS NULL OR jsonb_typeof(payload->'items') != 'array' THEN
    RAISE EXCEPTION 'items must be a valid array';
  END IF;

  v_items_count := jsonb_array_length(payload->'items');
  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'Transfer must contain at least 1 item';
  END IF;

  -- 3. Insert inventory_transfers header (status = 'pending')
  INSERT INTO public.inventory_transfers (
    code,
    from_branch_id,
    from_branch_name,
    to_branch_id,
    to_branch_name,
    date,
    status,
    note,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(payload->>'code', 'CK-' || to_char(now(), 'YYYYMMDD') || '-' || floor(100 + random() * 900)::text),
    v_from_branch_id,
    payload->>'from_branch_name',
    v_to_branch_id,
    payload->>'to_branch_name',
    COALESCE(payload->>'date', to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    'pending',
    payload->>'note',
    COALESCE(payload->>'created_by', 'system'),
    now(),
    now()
  )
  RETURNING id INTO v_transfer_id;

  -- 4. Validate and Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    IF v_item->>'product_id' IS NULL OR v_item->>'product_id' = '' THEN
      RAISE EXCEPTION 'product_id is required for all items';
    END IF;

    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::numeric;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'qty must be > 0 for product %', v_product_id;
    END IF;

    -- Verify product exists
    SELECT name, unit INTO v_product_name, v_unit
    FROM public.product
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;

    INSERT INTO public.inventory_transfer_items (
      transfer_id,
      product_id,
      product_name,
      unit,
      qty,
      created_at
    ) VALUES (
      v_transfer_id,
      v_product_id,
      COALESCE(v_item->>'product_name', v_product_name),
      COALESCE(v_item->>'unit', v_unit),
      v_qty,
      now()
    );
  END LOOP;

  -- Return result
  RETURN jsonb_build_object(
    'id', v_transfer_id,
    'status', 'pending',
    'success', true
  );
END;
$$;

-- 5. RPC: confirm_stock_transfer
CREATE OR REPLACE FUNCTION public.confirm_stock_transfer(p_transfer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
BEGIN
  -- 1. Check if transfer exists
  SELECT status INTO v_current_status
  FROM public.inventory_transfers
  WHERE id = p_transfer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
  END IF;

  -- 2. Validate current status
  IF v_current_status = 'transferred' THEN
    RAISE EXCEPTION 'Transfer % is already transferred', p_transfer_id;
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Transfer % cannot be confirmed because status is %', p_transfer_id, v_current_status;
  END IF;

  -- 3. Update status
  UPDATE public.inventory_transfers
  SET status = 'transferred',
      updated_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'id', p_transfer_id,
    'status', 'transferred',
    'success', true
  );
END;
$$;
