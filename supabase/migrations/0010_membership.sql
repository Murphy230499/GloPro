-- Migration for table: membership
CREATE TABLE IF NOT EXISTS membership (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    branch_id UUID,
    type TEXT NOT NULL,
    name TEXT,
    balance NUMERIC(15, 2) DEFAULT 0,
    sessions_remaining NUMERIC(15, 2) DEFAULT 0,
    total_sessions NUMERIC(15, 2) DEFAULT 0,
    purchased_date DATE,
    expiry_date DATE,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    invoice_id UUID,
    invoice_code TEXT,
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT FALSE,
    suspended_at DATE
);

CREATE TRIGGER trigger_update_membership_updated_at
    BEFORE UPDATE ON membership
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
