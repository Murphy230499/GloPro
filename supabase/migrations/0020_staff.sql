-- Migration for table: staff
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    branch_id UUID NOT NULL,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    specialties TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    avatar_color TEXT DEFAULT '#FF6B9D',
    avatar_url TEXT,
    group_id UUID,
    service_ids JSONB,
    can_be_booked BOOLEAN DEFAULT TRUE,
    max_concurrent_bookings NUMERIC(15, 2) DEFAULT 1
);

CREATE TRIGGER trigger_update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
