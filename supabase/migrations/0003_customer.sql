-- Migration for table: customer
CREATE TABLE IF NOT EXISTS customer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    birthday DATE,
    address TEXT,
    note TEXT,
    points INTEGER DEFAULT 0,
    total_spent NUMERIC(15, 2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    last_visit DATE,
    avatar_url TEXT,
    group_id UUID
);

CREATE TRIGGER trigger_update_customer_updated_at
    BEFORE UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
