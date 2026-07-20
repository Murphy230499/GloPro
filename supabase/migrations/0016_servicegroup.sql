-- Migration for table: servicegroup
CREATE TABLE IF NOT EXISTS servicegroup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT DEFAULT '#FF6B9D',
    branch_id UUID,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_servicegroup_updated_at
    BEFORE UPDATE ON servicegroup
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
