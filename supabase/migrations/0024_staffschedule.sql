-- Migration for table: staffschedule
CREATE TABLE IF NOT EXISTS staffschedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    date TEXT NOT NULL,
    shift_template_id UUID,
    is_off BOOLEAN DEFAULT FALSE,
    off_type TEXT
);

CREATE TRIGGER trigger_update_staffschedule_updated_at
    BEFORE UPDATE ON staffschedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
