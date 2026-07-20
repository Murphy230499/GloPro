-- Migration for table: treatment
CREATE TABLE IF NOT EXISTS treatment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    group_id UUID,
    expiry_months NUMERIC(15, 2) DEFAULT 0,
    expiry_days NUMERIC(15, 2) DEFAULT 0,
    price NUMERIC(15, 2) DEFAULT 0,
    services JSONB,
    description TEXT,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_treatment_updated_at
    BEFORE UPDATE ON treatment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
