-- Migration for table: loyaltyrule
CREATE TABLE IF NOT EXISTS loyaltyrule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    earn_on_service BOOLEAN DEFAULT TRUE,
    earn_on_product BOOLEAN DEFAULT TRUE,
    earn_on_package BOOLEAN DEFAULT TRUE,
    earn_on_treatment BOOLEAN DEFAULT TRUE,
    earn_on_prepaid_card BOOLEAN DEFAULT FALSE,
    earn_on_booking BOOLEAN DEFAULT TRUE,
    earn_on_referral BOOLEAN DEFAULT TRUE,
    points_per_vnd INTEGER DEFAULT 10000,
    booking_points INTEGER DEFAULT 50,
    referral_points INTEGER DEFAULT 100,
    reset_schedule TEXT DEFAULT 'none',
    reset_inactivity_days NUMERIC(15, 2) DEFAULT 365,
    excluded_item_ids TEXT DEFAULT '[]'
);

CREATE TRIGGER trigger_update_loyaltyrule_updated_at
    BEFORE UPDATE ON loyaltyrule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
