-- Migration: 0116_deposits_rls_indexes.sql
-- Description: Add missing indexes and complete RLS policies for deposit, deposit_transaction, and deposit_policy

-- 1. Create missing indexes on deposit
CREATE INDEX IF NOT EXISTS idx_deposit_customer_id ON public.deposit(customer_id);
CREATE INDEX IF NOT EXISTS idx_deposit_branch_id ON public.deposit(branch_id);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON public.deposit(status);
CREATE INDEX IF NOT EXISTS idx_deposit_created_at ON public.deposit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_appointment_id ON public.deposit(appointment_id);

-- 2. Create missing indexes on deposit_transaction
CREATE INDEX IF NOT EXISTS idx_deposit_tx_deposit_id ON public.deposit_transaction(deposit_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_created_at ON public.deposit_transaction(created_at DESC);

-- 3. Create missing indexes on deposit_policy
CREATE INDEX IF NOT EXISTS idx_deposit_policy_entity ON public.deposit_policy(entity_type, entity_id);

-- 4. Ensure RLS is enabled
ALTER TABLE public.deposit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_policy ENABLE ROW LEVEL SECURITY;

-- 5. Add complete RLS policies
DO $$
BEGIN
  -- deposit policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposit' AND policyname = 'deposit_all_policy'
  ) THEN
    CREATE POLICY deposit_all_policy ON public.deposit
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- deposit_transaction policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposit_transaction' AND policyname = 'deposit_transaction_all_policy'
  ) THEN
    CREATE POLICY deposit_transaction_all_policy ON public.deposit_transaction
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- deposit_policy policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deposit_policy' AND policyname = 'deposit_policy_all_policy'
  ) THEN
    CREATE POLICY deposit_policy_all_policy ON public.deposit_policy
      FOR ALL
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
