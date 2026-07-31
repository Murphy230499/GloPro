-- Migration to support salon accounts management and role permissions
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier')),
    branch_id UUID REFERENCES public.branch(id) ON DELETE SET NULL
);

CREATE TRIGGER trigger_update_user_profile_updated_at
    BEFORE UPDATE ON public.user_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cashier')),
    module TEXT NOT NULL, -- 'pos' (Thu ngân), 'customers' (Khách hàng), 'staff' (Nhân viên), 'reports' (Báo cáo), 'settings' (Cài đặt)
    can_view BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(role, module)
);

CREATE TRIGGER trigger_update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed initial default permissions for admin and cashier roles
-- Note: 'owner' role will have full access checked dynamically in code
INSERT INTO public.role_permissions (role, module, can_view, can_edit) VALUES
('admin', 'pos', TRUE, TRUE),
('admin', 'customers', TRUE, TRUE),
('admin', 'staff', TRUE, TRUE),
('admin', 'reports', TRUE, FALSE),
('admin', 'settings', TRUE, FALSE),
('cashier', 'pos', TRUE, TRUE),
('cashier', 'customers', TRUE, FALSE),
('cashier', 'staff', FALSE, FALSE),
('cashier', 'reports', FALSE, FALSE),
('cashier', 'settings', FALSE, FALSE)
ON CONFLICT (role, module) DO NOTHING;
