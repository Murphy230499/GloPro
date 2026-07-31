-- Migration to support dynamic roles management
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TRIGGER trigger_update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed initial system roles
INSERT INTO public.roles (code, name, description, is_system) VALUES
('owner', 'Chủ Salon (Owner)', 'Quyền hạn tối cao toàn hệ thống.', TRUE),
('admin', 'Quản trị (Admin)', 'Quản lý các hoạt động vận hành thường nhật.', TRUE),
('cashier', 'Thu ngân', 'Thực hiện bán hàng và quản lý danh sách khách hàng.', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Drop check constraints on role columns to allow custom roles
ALTER TABLE public.user_profile DROP CONSTRAINT IF EXISTS user_profile_role_check;
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_check;
