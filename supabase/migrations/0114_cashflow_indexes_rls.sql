-- Migration: 0114_cashflow_indexes_rls.sql
-- Description: Add missing indexes and ensure complete RLS policies for cashvoucher and cashvouchertype tables

-- 1. Create missing indexes on cashvoucher
CREATE INDEX IF NOT EXISTS idx_cashvoucher_branch_id ON public.cashvoucher(branch_id);
CREATE INDEX IF NOT EXISTS idx_cashvoucher_date ON public.cashvoucher(date DESC);
CREATE INDEX IF NOT EXISTS idx_cashvoucher_flow ON public.cashvoucher(flow);
CREATE INDEX IF NOT EXISTS idx_cashvoucher_type_code ON public.cashvoucher(type_code);
CREATE INDEX IF NOT EXISTS idx_cashvoucher_created_at ON public.cashvoucher(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashvoucher_ref_id ON public.cashvoucher(ref_id);

-- 2. Create missing indexes on cashvouchertype
CREATE INDEX IF NOT EXISTS idx_cashvouchertype_flow ON public.cashvouchertype(flow);
CREATE INDEX IF NOT EXISTS idx_cashvouchertype_branch_id ON public.cashvouchertype(branch_id);

-- 3. Ensure RLS is enabled
ALTER TABLE public.cashvoucher ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashvouchertype ENABLE ROW LEVEL SECURITY;

-- 4. Ensure public access policies exist for cashvoucher
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cashvoucher' AND policyname = 'cashvoucher_all_policy'
  ) THEN
    CREATE POLICY cashvoucher_all_policy ON public.cashvoucher
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cashvouchertype' AND policyname = 'cashvouchertype_all_policy'
  ) THEN
    CREATE POLICY cashvouchertype_all_policy ON public.cashvouchertype
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
