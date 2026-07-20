-- Migration for table: customertierhistory
CREATE TABLE IF NOT EXISTS customertierhistory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    old_tier_name TEXT,
    new_tier_name TEXT NOT NULL,
    reason TEXT,
    date TEXT
);

CREATE TRIGGER trigger_update_customertierhistory_updated_at
    BEFORE UPDATE ON customertierhistory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
