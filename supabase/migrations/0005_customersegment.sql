-- Migration for table: customersegment
CREATE TABLE IF NOT EXISTS customersegment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    conditions TEXT,
    color TEXT DEFAULT '#34D399'
);

CREATE TRIGGER trigger_update_customersegment_updated_at
    BEFORE UPDATE ON customersegment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
