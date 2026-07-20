-- Migration for table: shifttemplate
CREATE TABLE IF NOT EXISTS shifttemplate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    branch_id UUID,
    color TEXT DEFAULT '#A78BFA',
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    late_grace_minutes INTEGER DEFAULT 0,
    early_grace_minutes INTEGER DEFAULT 0,
    overtime_after_minutes INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_shifttemplate_updated_at
    BEFORE UPDATE ON shifttemplate
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
