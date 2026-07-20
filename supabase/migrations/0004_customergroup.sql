-- Migration for table: customergroup
CREATE TABLE IF NOT EXISTS customergroup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#FF6B9D',
    branch_id UUID
);

CREATE TRIGGER trigger_update_customergroup_updated_at
    BEFORE UPDATE ON customergroup
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
