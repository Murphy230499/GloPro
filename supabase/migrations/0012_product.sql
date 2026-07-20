-- Migration for table: product
CREATE TABLE IF NOT EXISTS product (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name TEXT NOT NULL,
    category TEXT,
    group_id UUID,
    price NUMERIC(15, 2) NOT NULL,
    cost_price NUMERIC(15, 2) DEFAULT 0,
    stock NUMERIC(15, 2) DEFAULT 0,
    min_stock NUMERIC(15, 2) DEFAULT 0,
    unit TEXT,
    sku TEXT,
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TRIGGER trigger_update_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
