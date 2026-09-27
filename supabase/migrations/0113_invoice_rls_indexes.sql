-- Migration: 0113_invoice_rls_indexes.sql
-- Description: Add indexes and RLS policies for Invoice table to support Mobile & Web operations

-- 1. Create missing indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_invoice_date ON public.invoice(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON public.invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_code ON public.invoice(invoice_code);
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON public.invoice(created_at DESC);

-- 2. Ensure RLS is enabled
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies for Invoice table
DO $$
BEGIN
  -- SELECT Policy: Allow all authenticated & anon queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice' AND policyname = 'invoice_select_policy'
  ) THEN
    CREATE POLICY invoice_select_policy ON public.invoice
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- INSERT Policy: Allow creating invoices from POS / Mobile / Web
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice' AND policyname = 'invoice_insert_policy'
  ) THEN
    CREATE POLICY invoice_insert_policy ON public.invoice
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  -- UPDATE Policy: Allow updating status, payment_methods, print_count, logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice' AND policyname = 'invoice_update_policy'
  ) THEN
    CREATE POLICY invoice_update_policy ON public.invoice
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- DELETE Policy: Allow deleting invoices when requested
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoice' AND policyname = 'invoice_delete_policy'
  ) THEN
    CREATE POLICY invoice_delete_policy ON public.invoice
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
