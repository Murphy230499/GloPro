-- Migration for table: branch
CREATE TABLE IF NOT EXISTS branch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    city TEXT,
    manager_name TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TRIGGER trigger_update_branch_updated_at
    BEFORE UPDATE ON branch
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
