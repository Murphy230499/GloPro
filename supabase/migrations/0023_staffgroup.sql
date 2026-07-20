-- Migration for table: staffgroup
CREATE TABLE IF NOT EXISTS staffgroup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#A78BFA',
    description TEXT
);

CREATE TRIGGER trigger_update_staffgroup_updated_at
    BEFORE UPDATE ON staffgroup
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
