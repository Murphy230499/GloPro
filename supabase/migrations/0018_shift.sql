-- Migration for table: shift
CREATE TABLE IF NOT EXISTS shift (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    branch_id UUID NOT NULL,
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    is_overtime BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'scheduled'
);

CREATE TRIGGER trigger_update_shift_updated_at
    BEFORE UPDATE ON shift
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
