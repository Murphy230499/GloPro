-- Migration: 0115_discounts_rls_indexes.sql
-- Description: Add missing columns, indexes, and full RLS policies for discounts (promotions, vouchers, promo_usages, customer_gifts)

-- 1. Alter promotions table
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS applicable_items jsonb,
  ADD COLUMN IF NOT EXISTS is_giftable boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_items jsonb,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Alter vouchers table
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS name varchar,
  ADD COLUMN IF NOT EXISTS type varchar,
  ADD COLUMN IF NOT EXISTS discount_type varchar,
  ADD COLUMN IF NOT EXISTS discount_value numeric,
  ADD COLUMN IF NOT EXISTS min_order_value numeric,
  ADD COLUMN IF NOT EXISTS max_discount numeric,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 9999,
  ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS branch_ids text[],
  ADD COLUMN IF NOT EXISTS applicable_items jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Alter customer_gifts table
ALTER TABLE public.customer_gifts
  ADD COLUMN IF NOT EXISTS promo_id uuid,
  ADD COLUMN IF NOT EXISTS promo_name varchar,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS service_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. Create missing indexes
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_start_date ON public.promotions(start_date);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON public.promotions(end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);

CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_customer_id ON public.vouchers(customer_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_promotion_id ON public.vouchers(promotion_id);

CREATE INDEX IF NOT EXISTS idx_promo_usages_promo_id ON public.promo_usages(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promo_usages_voucher_id ON public.promo_usages(voucher_id);
CREATE INDEX IF NOT EXISTS idx_promo_usages_invoice_id ON public.promo_usages(invoice_id);

CREATE INDEX IF NOT EXISTS idx_customer_gifts_customer_id ON public.customer_gifts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_gifts_status ON public.customer_gifts(status);

-- 5. Ensure RLS is enabled
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_gifts ENABLE ROW LEVEL SECURITY;

-- 6. Add complete RLS policies
DO $$
BEGIN
  -- promotions policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'promotions_all_policy'
  ) THEN
    CREATE POLICY promotions_all_policy ON public.promotions
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- vouchers policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vouchers' AND policyname = 'vouchers_all_policy'
  ) THEN
    CREATE POLICY vouchers_all_policy ON public.vouchers
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- promo_usages policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promo_usages' AND policyname = 'promo_usages_all_policy'
  ) THEN
    CREATE POLICY promo_usages_all_policy ON public.promo_usages
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- customer_gifts policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customer_gifts' AND policyname = 'customer_gifts_all_policy'
  ) THEN
    CREATE POLICY customer_gifts_all_policy ON public.customer_gifts
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
