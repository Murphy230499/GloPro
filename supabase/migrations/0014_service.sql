-- Migration for table: service
CREATE TABLE IF NOT EXISTS service (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    category TEXT,
    group_id UUID,
    price NUMERIC(15, 2),
    price_from NUMERIC(15, 2) DEFAULT 0,
    cost NUMERIC(15, 2) DEFAULT 0,
    duration_minutes INTEGER,
    commission_rate NUMERIC(15, 2) DEFAULT 0,
    description TEXT,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    accompanied_products JSONB,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_service_updated_at
    BEFORE UPDATE ON service
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
