-- Migration for table: staffcommissionrule
CREATE TABLE IF NOT EXISTS staffcommissionrule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    staff_id UUID NOT NULL,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    commission_type TEXT NOT NULL,
    commission_value NUMERIC(15, 2) NOT NULL
);

CREATE TRIGGER trigger_update_staffcommissionrule_updated_at
    BEFORE UPDATE ON staffcommissionrule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
