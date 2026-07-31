-- Add missing cash_voucher table if it somehow doesn't exist (just in case, but it usually does)
CREATE TABLE IF NOT EXISTS public.cashvoucher (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    flow VARCHAR(20) NOT NULL CHECK (flow IN ('income', 'expense')),
    type_code VARCHAR(50) NOT NULL,
    type_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    note TEXT,
    payment_method VARCHAR(50),
    source VARCHAR(50),
    ref_id UUID,
    ref_code VARCHAR(50),
    branch_id UUID,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.cashvouchertype (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    color VARCHAR(20),
    flow VARCHAR(20),
    is_system BOOLEAN DEFAULT false
);

-- Insert use_deposit if it doesn't exist
INSERT INTO public.cashvouchertype (code, name, color, flow, is_system) 
VALUES ('use_deposit', 'Sử dụng tiền cọc', '#8B5CF6', 'expense', true)
ON CONFLICT (code) DO NOTHING;

-- TRIGGER ON DEPOSIT
CREATE OR REPLACE FUNCTION sync_deposit_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
    -- AFTER INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.paid_amount > 0 THEN
            INSERT INTO public.cashvoucher (
                code, flow, type_code, type_name, amount, date, description, note, payment_method, source, ref_id, ref_code, branch_id, created_by
            ) VALUES (
                'PT-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
                'income',
                'deposit',
                'Đặt cọc',
                NEW.paid_amount,
                CURRENT_DATE,
                'Thu tiền cọc phiếu ' || NEW.deposit_number,
                NEW.notes,
                COALESCE(NEW.payment_method, 'cash'),
                'auto',
                NEW.id,
                NEW.deposit_number,
                NEW.branch_id,
                'system'
            );
        END IF;
        RETURN NEW;
    END IF;

    -- AFTER UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If paid_amount changes, update cash voucher
        IF NEW.paid_amount <> OLD.paid_amount THEN
            UPDATE public.cashvoucher 
            SET amount = NEW.paid_amount 
            WHERE ref_id = NEW.id AND type_code = 'deposit';
        END IF;
        RETURN NEW;
    END IF;

    -- AFTER DELETE
    IF TG_OP = 'DELETE' THEN
        DELETE FROM public.cashvoucher WHERE ref_id = OLD.id AND type_code = 'deposit';
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_deposit_to_cashflow ON public.deposit;
CREATE TRIGGER trigger_sync_deposit_to_cashflow
AFTER INSERT OR UPDATE OR DELETE ON public.deposit
FOR EACH ROW EXECUTE FUNCTION sync_deposit_to_cashflow();

-- TRIGGER ON INVOICE
-- We need invoice to track which deposit it used.
ALTER TABLE public.invoice ADD COLUMN IF NOT EXISTS deposit_id UUID;
ALTER TABLE public.invoice ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15,2) DEFAULT 0;

CREATE OR REPLACE FUNCTION sync_invoice_deposit_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
    -- AFTER INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.deposit_id IS NOT NULL AND NEW.deposit_amount > 0 THEN
            -- Create expense voucher
            INSERT INTO public.cashvoucher (
                code, flow, type_code, type_name, amount, date, description, note, payment_method, source, ref_id, ref_code, branch_id, created_by
            ) VALUES (
                'PC-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
                'expense',
                'use_deposit',
                'Sử dụng tiền cọc',
                NEW.deposit_amount,
                CURRENT_DATE,
                'Sử dụng cọc cho hoá đơn ' || NEW.invoice_code,
                '',
                'deposit',
                'auto',
                NEW.id,
                NEW.invoice_code,
                NEW.branch_id,
                'system'
            );

            -- Update deposit status
            UPDATE public.deposit SET status = 'applied' WHERE id = NEW.deposit_id;
        END IF;
        RETURN NEW;
    END IF;

    -- AFTER UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If invoice is cancelled and it used a deposit, delete the expense voucher and revert deposit
        IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND NEW.deposit_id IS NOT NULL THEN
            DELETE FROM public.cashvoucher WHERE ref_id = NEW.id AND type_code = 'use_deposit';
            UPDATE public.deposit SET status = 'paid' WHERE id = NEW.deposit_id;
        END IF;
        -- If invoice uncancelled (restored)
        IF NEW.status = 'paid' AND OLD.status = 'cancelled' AND NEW.deposit_id IS NOT NULL THEN
            INSERT INTO public.cashvoucher (
                code, flow, type_code, type_name, amount, date, description, note, payment_method, source, ref_id, ref_code, branch_id, created_by
            ) VALUES (
                'PC-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 1000)::text, 3, '0'),
                'expense',
                'use_deposit',
                'Sử dụng tiền cọc',
                NEW.deposit_amount,
                CURRENT_DATE,
                'Sử dụng cọc cho hoá đơn ' || NEW.invoice_code,
                '',
                'deposit',
                'auto',
                NEW.id,
                NEW.invoice_code,
                NEW.branch_id,
                'system'
            );
            UPDATE public.deposit SET status = 'applied' WHERE id = NEW.deposit_id;
        END IF;
        RETURN NEW;
    END IF;

    -- AFTER DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.deposit_id IS NOT NULL THEN
            DELETE FROM public.cashvoucher WHERE ref_id = OLD.id AND type_code = 'use_deposit';
            UPDATE public.deposit SET status = 'paid' WHERE id = OLD.deposit_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_invoice_deposit_to_cashflow ON public.invoice;
CREATE TRIGGER trigger_sync_invoice_deposit_to_cashflow
AFTER INSERT OR UPDATE OR DELETE ON public.invoice
FOR EACH ROW EXECUTE FUNCTION sync_invoice_deposit_to_cashflow();
