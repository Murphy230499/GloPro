-- Migration for table: invoice
CREATE TABLE IF NOT EXISTS invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invoice_code TEXT,
    appointment_id UUID,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    branch_id UUID NOT NULL,
    items JSONB,
    subtotal NUMERIC(15, 2) DEFAULT 0,
    discount INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    membership_used NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tip NUMERIC(15, 2) DEFAULT 0,
    tip_splits JSONB,
    payment_methods JSONB,
    status TEXT DEFAULT 'paid',
    date DATE,
    print_count INTEGER DEFAULT 0,
    previous_status TEXT
);

CREATE TRIGGER trigger_update_invoice_updated_at
    BEFORE UPDATE ON invoice
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
