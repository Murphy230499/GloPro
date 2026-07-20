-- Migration for table: servicecombo
CREATE TABLE IF NOT EXISTS servicecombo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB,
    combo_price NUMERIC(15, 2) DEFAULT 0,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_servicecombo_updated_at
    BEFORE UPDATE ON servicecombo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
