-- Migration for table: staffattendance
CREATE TABLE IF NOT EXISTS staffattendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT,
    ot_minutes INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_staffattendance_updated_at
    BEFORE UPDATE ON staffattendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
