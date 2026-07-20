-- Migration for table: prepaidcard
CREATE TABLE IF NOT EXISTS prepaidcard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    card_code TEXT,
    face_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    color TEXT DEFAULT '#FF6B9D',
    expiry_months NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_prepaidcard_updated_at
    BEFORE UPDATE ON prepaidcard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
