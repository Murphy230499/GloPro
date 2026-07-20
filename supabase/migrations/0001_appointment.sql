-- Migration for table: appointment
CREATE TABLE IF NOT EXISTS appointment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_id UUID,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    branch_id UUID NOT NULL,
    service_id UUID,
    service_name TEXT,
    price NUMERIC(15, 2) DEFAULT 0,
    staff_id UUID,
    staff_name TEXT,
    assistant_staff_id UUID,
    assistant_staff_name TEXT,
    services JSONB,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    source TEXT DEFAULT 'reception',
    is_customer_requested_staff BOOLEAN DEFAULT FALSE
);

CREATE TRIGGER trigger_update_appointment_updated_at
    BEFORE UPDATE ON appointment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
