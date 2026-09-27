-- STEP 8B-DB: Stock Receipt Schema Enhancements + Atomic RPC

-- 1. ENHANCE inventory_receipts (add missing columns)
ALTER TABLE public.inventory_receipts
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- 2. ENHANCE inventory_receipt_items (add missing columns)
ALTER TABLE public.inventory_receipt_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- 3. ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_inv_receipts_branch ON public.inventory_receipts(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_receipts_type ON public.inventory_receipts(type);
CREATE INDEX IF NOT EXISTS idx_inv_receipts_created ON public.inventory_receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_receipt_items_receipt ON public.inventory_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_inv_receipt_items_product ON public.inventory_receipt_items(product_id);

-- 4. RLS POLICIES
ALTER TABLE public.inventory_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_receipt_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_receipts_auth_policy" ON public.inventory_receipts;
DROP POLICY IF EXISTS "inventory_receipt_items_auth_policy" ON public.inventory_receipt_items;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.inventory_receipts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.inventory_receipt_items;

CREATE POLICY "inventory_receipts_auth_policy" ON public.inventory_receipts
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "inventory_receipt_items_auth_policy" ON public.inventory_receipt_items
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 5. ATOMIC RPC
DROP FUNCTION IF EXISTS public.create_stock_receipt(jsonb);

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

  -- Pre-validate
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'qty')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'qty must be > 0 for product %', v_product_id;
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.product WHERE id = v_product_id::UUID) INTO v_product_exists;
    IF NOT v_product_exists THEN
      RAISE EXCEPTION 'Product % not found', v_product_id;
    END IF;
  END LOOP;

  -- Insert receipt header
  INSERT INTO public.inventory_receipts (
    code, type, supplier_id, supplier_name, branch_id,
    total_amount, paid_amount, debt_amount, reason, note,
    status, created_by, created_at
  ) VALUES (
    payload->>'code',
    v_type,
    CASE WHEN (payload->>'supplier_id') = '' OR (payload->>'supplier_id') IS NULL
         THEN NULL ELSE (payload->>'supplier_id')::UUID END,
    payload->>'supplier_name',
    CASE WHEN (payload->>'branch_id') = '' OR (payload->>'branch_id') IS NULL
         THEN NULL ELSE (payload->>'branch_id')::UUID END,
    COALESCE((payload->>'total_amount')::NUMERIC, 0),
    COALESCE((payload->>'paid_amount')::NUMERIC, 0),
    COALESCE((payload->>'debt_amount')::NUMERIC, 0),
    payload->>'reason',
    payload->>'note',
    COALESCE(payload->>'status', 'completed'),
    COALESCE(payload->>'created_by', 'system'),
    timezone('utc', now())
  ) RETURNING id INTO v_receipt_id;

  -- Process items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := v_item->>'product_id';
    v_qty := (v_item->>'qty')::NUMERIC;
    v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);

    SELECT COALESCE(stock, 0) INTO v_current_stock
    FROM public.product WHERE id = v_product_id::UUID;

    IF v_type = 'in' THEN
      v_new_stock := v_current_stock + v_qty;
      UPDATE public.product SET stock = v_new_stock, cost_price = v_unit_price WHERE id = v_product_id::UUID;
    ELSE
      v_new_stock := GREATEST(0, v_current_stock - v_qty);
      UPDATE public.product SET stock = v_new_stock WHERE id = v_product_id::UUID;
    END IF;

    INSERT INTO public.inventory_receipt_items (
      receipt_id, product_id, product_name, unit, qty, unit_price, total_price, created_at
    ) VALUES (
      v_receipt_id, v_product_id::UUID,
      v_item->>'product_name', v_item->>'unit',
      v_qty, v_unit_price,
      COALESCE((v_item->>'total_price')::NUMERIC, v_qty * v_unit_price),
      timezone('utc', now())
    );
  END LOOP;

  RETURN jsonb_build_object(
    'id', v_receipt_id,
    'success', true,
    'type', v_type
  );
EXCEPTION WHEN OTHERS THEN RAISE;
END; $$;

GRANT EXECUTE ON FUNCTION public.create_stock_receipt(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stock_receipt(jsonb) TO anon;
