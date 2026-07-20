-- Migration for table: customertier
CREATE TABLE IF NOT EXISTS customertier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    min_spend NUMERIC(15, 2) DEFAULT 0,
    min_points INTEGER DEFAULT 0,
    discount_percent INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    maintenance_period TEXT DEFAULT 'year',
    maintenance_days NUMERIC(15, 2) DEFAULT 365,
    color TEXT DEFAULT '#FF6B9D'
);

CREATE TRIGGER trigger_update_customertier_updated_at
    BEFORE UPDATE ON customertier
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
