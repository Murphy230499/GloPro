-- ==========================================
-- GLO-PRO MULTI-TENANT MIGRATION SCRIPT
-- ==========================================

DO $$
DECLARE
    target_tenant_id UUID;
BEGIN
    -- 1. Lấy ID của tài khoản Admin đầu tiên để gán cho các dữ liệu cũ (bảo toàn dữ liệu)
    SELECT id INTO target_tenant_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- Nếu không có user nào, thoát
    IF target_tenant_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users.';
        RETURN;
    END IF;


    -----------------------------------------
    -- Table: appointment
    -----------------------------------------
    BEGIN
        ALTER TABLE public."appointment" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table appointment does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."appointment" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."appointment" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."appointment" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."appointment";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."appointment";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."appointment";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."appointment"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đặt lịch / tạo tài khoản
    BEGIN
        CREATE POLICY "Allow Anon Insert" ON public."appointment"
        FOR INSERT
        TO anon
        WITH CHECK (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: branch
    -----------------------------------------
    BEGIN
        ALTER TABLE public."branch" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table branch does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."branch" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."branch" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."branch" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."branch";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."branch";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."branch";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."branch"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."branch"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customer
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customer" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customer does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customer" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customer" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customer" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customer";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customer";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customer";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customer"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đặt lịch / tạo tài khoản
    BEGIN
        CREATE POLICY "Allow Anon Insert" ON public."customer"
        FOR INSERT
        TO anon
        WITH CHECK (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customergroup
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customergroup" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customergroup does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customergroup" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customergroup" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customergroup" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customergroup";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customergroup";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customergroup";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customergroup"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customersegment
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customersegment" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customersegment does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customersegment" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customersegment" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customersegment" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customersegment";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customersegment";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customersegment";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customersegment"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customertier
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customertier" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customertier does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customertier" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customertier" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customertier" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customertier";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customertier";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customertier";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customertier"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."customertier"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customertierhistory
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customertierhistory" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customertierhistory does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customertierhistory" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customertierhistory" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customertierhistory" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customertierhistory";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customertierhistory";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customertierhistory";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customertierhistory"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: deposit
    -----------------------------------------
    BEGIN
        ALTER TABLE public."deposit" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table deposit does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."deposit" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."deposit" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."deposit" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."deposit";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."deposit";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."deposit";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."deposit"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: deposit_policy
    -----------------------------------------
    BEGIN
        ALTER TABLE public."deposit_policy" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table deposit_policy does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."deposit_policy" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."deposit_policy" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."deposit_policy" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."deposit_policy";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."deposit_policy";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."deposit_policy";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."deposit_policy"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: deposit_transaction
    -----------------------------------------
    BEGIN
        ALTER TABLE public."deposit_transaction" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table deposit_transaction does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."deposit_transaction" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."deposit_transaction" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."deposit_transaction" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."deposit_transaction";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."deposit_transaction";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."deposit_transaction";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."deposit_transaction"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: facility
    -----------------------------------------
    BEGIN
        ALTER TABLE public."facility" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table facility does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."facility" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."facility" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."facility" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."facility";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."facility";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."facility";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."facility"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: invoice
    -----------------------------------------
    BEGIN
        ALTER TABLE public."invoice" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table invoice does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."invoice" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."invoice" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."invoice" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."invoice";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."invoice";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."invoice";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."invoice"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: loyaltyrule
    -----------------------------------------
    BEGIN
        ALTER TABLE public."loyaltyrule" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table loyaltyrule does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."loyaltyrule" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."loyaltyrule" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."loyaltyrule" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."loyaltyrule";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."loyaltyrule";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."loyaltyrule";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."loyaltyrule"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."loyaltyrule"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: membership
    -----------------------------------------
    BEGIN
        ALTER TABLE public."membership" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table membership does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."membership" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."membership" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."membership" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."membership";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."membership";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."membership";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."membership"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: prepaidcard
    -----------------------------------------
    BEGIN
        ALTER TABLE public."prepaidcard" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table prepaidcard does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."prepaidcard" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."prepaidcard" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."prepaidcard" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."prepaidcard";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."prepaidcard";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."prepaidcard";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."prepaidcard"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: product
    -----------------------------------------
    BEGIN
        ALTER TABLE public."product" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table product does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."product" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."product" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."product" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."product";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."product";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."product";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."product"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."product"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: productcombo
    -----------------------------------------
    BEGIN
        ALTER TABLE public."productcombo" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table productcombo does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."productcombo" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."productcombo" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."productcombo" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."productcombo";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."productcombo";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."productcombo";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."productcombo"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: service
    -----------------------------------------
    BEGIN
        ALTER TABLE public."service" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table service does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."service" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."service" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."service" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."service";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."service";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."service";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."service"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."service"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: servicecombo
    -----------------------------------------
    BEGIN
        ALTER TABLE public."servicecombo" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table servicecombo does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."servicecombo" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."servicecombo" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."servicecombo" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."servicecombo";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."servicecombo";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."servicecombo";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."servicecombo"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: servicegroup
    -----------------------------------------
    BEGIN
        ALTER TABLE public."servicegroup" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table servicegroup does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."servicegroup" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."servicegroup" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."servicegroup" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."servicegroup";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."servicegroup";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."servicegroup";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."servicegroup"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."servicegroup"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: servicepackage
    -----------------------------------------
    BEGIN
        ALTER TABLE public."servicepackage" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table servicepackage does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."servicepackage" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."servicepackage" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."servicepackage" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."servicepackage";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."servicepackage";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."servicepackage";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."servicepackage"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: treatment
    -----------------------------------------
    BEGIN
        ALTER TABLE public."treatment" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table treatment does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."treatment" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."treatment" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."treatment" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."treatment";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."treatment";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."treatment";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."treatment"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: shift
    -----------------------------------------
    BEGIN
        ALTER TABLE public."shift" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table shift does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."shift" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."shift" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."shift" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."shift";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."shift";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."shift";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."shift"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: shifttemplate
    -----------------------------------------
    BEGIN
        ALTER TABLE public."shifttemplate" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table shifttemplate does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."shifttemplate" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."shifttemplate" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."shifttemplate" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."shifttemplate";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."shifttemplate";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."shifttemplate";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."shifttemplate"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staff
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staff" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staff does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staff" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staff" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staff" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staff";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staff";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staff";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staff"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."staff"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffattendance
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffattendance" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffattendance does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffattendance" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffattendance" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffattendance" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffattendance";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffattendance";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffattendance";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffattendance"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffcommissionconfig
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffcommissionconfig" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffcommissionconfig does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffcommissionconfig" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffcommissionconfig" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffcommissionconfig" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffcommissionconfig";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffcommissionconfig";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffcommissionconfig";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffcommissionconfig"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffcommissionlog
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffcommissionlog" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffcommissionlog does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffcommissionlog" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffcommissionlog" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffcommissionlog" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffcommissionlog";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffcommissionlog";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffcommissionlog";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffcommissionlog"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffcommissionrule
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffcommissionrule" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffcommissionrule does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffcommissionrule" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffcommissionrule" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffcommissionrule" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffcommissionrule";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffcommissionrule";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffcommissionrule";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffcommissionrule"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffgroup
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffgroup" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffgroup does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffgroup" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffgroup" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffgroup" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffgroup";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffgroup";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffgroup";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffgroup"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: staffschedule
    -----------------------------------------
    BEGIN
        ALTER TABLE public."staffschedule" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table staffschedule does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."staffschedule" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."staffschedule" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."staffschedule" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."staffschedule";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."staffschedule";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."staffschedule";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."staffschedule"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: voucher
    -----------------------------------------
    BEGIN
        ALTER TABLE public."voucher" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table voucher does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."voucher" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."voucher" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."voucher" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."voucher";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."voucher";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."voucher";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."voucher"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: revenuebonusrule
    -----------------------------------------
    BEGIN
        ALTER TABLE public."revenuebonusrule" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table revenuebonusrule does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."revenuebonusrule" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."revenuebonusrule" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."revenuebonusrule" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."revenuebonusrule";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."revenuebonusrule";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."revenuebonusrule";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."revenuebonusrule"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: automation
    -----------------------------------------
    BEGIN
        ALTER TABLE public."automation" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table automation does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."automation" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."automation" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."automation" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."automation";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."automation";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."automation";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."automation"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: cashvoucher
    -----------------------------------------
    BEGIN
        ALTER TABLE public."cashvoucher" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table cashvoucher does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."cashvoucher" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."cashvoucher" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."cashvoucher" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."cashvoucher";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."cashvoucher";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."cashvoucher";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."cashvoucher"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: cashvouchertype
    -----------------------------------------
    BEGIN
        ALTER TABLE public."cashvouchertype" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table cashvouchertype does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."cashvouchertype" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."cashvouchertype" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."cashvouchertype" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."cashvouchertype";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."cashvouchertype";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."cashvouchertype";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."cashvouchertype"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: bookingsetting
    -----------------------------------------
    BEGIN
        ALTER TABLE public."bookingsetting" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table bookingsetting does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."bookingsetting" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."bookingsetting" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."bookingsetting" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."bookingsetting";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."bookingsetting";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."bookingsetting";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."bookingsetting"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đọc thông tin cấu hình đặt lịch / dịch vụ
    BEGIN
        CREATE POLICY "Allow Anon Select" ON public."bookingsetting"
        FOR SELECT
        TO anon
        USING (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customer_package
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customer_package" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customer_package does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customer_package" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customer_package" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customer_package" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customer_package";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customer_package";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customer_package";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customer_package"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đặt lịch / tạo tài khoản
    BEGIN
        CREATE POLICY "Allow Anon Insert" ON public."customer_package"
        FOR INSERT
        TO anon
        WITH CHECK (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: customer_treatment
    -----------------------------------------
    BEGIN
        ALTER TABLE public."customer_treatment" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table customer_treatment does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."customer_treatment" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."customer_treatment" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."customer_treatment" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."customer_treatment";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."customer_treatment";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."customer_treatment";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."customer_treatment"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Cho phép Khách vãng lai (Anon) đặt lịch / tạo tài khoản
    BEGIN
        CREATE POLICY "Allow Anon Insert" ON public."customer_treatment"
        FOR INSERT
        TO anon
        WITH CHECK (true);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: user_profile
    -----------------------------------------
    BEGIN
        ALTER TABLE public."user_profile" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table user_profile does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."user_profile" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."user_profile" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."user_profile" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."user_profile";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."user_profile";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."user_profile";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."user_profile"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: role_permissions
    -----------------------------------------
    BEGIN
        ALTER TABLE public."role_permissions" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table role_permissions does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."role_permissions" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."role_permissions" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."role_permissions" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."role_permissions";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."role_permissions";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."role_permissions";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."role_permissions"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: roles
    -----------------------------------------
    BEGIN
        ALTER TABLE public."roles" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table roles does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."roles" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."roles" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."roles" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."roles";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."roles";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."roles";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."roles"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -----------------------------------------
    -- Table: integration
    -----------------------------------------
    BEGIN
        ALTER TABLE public."integration" ADD COLUMN IF NOT EXISTS tenant_id UUID;
    EXCEPTION
        WHEN OTHERS THEN RAISE NOTICE 'Table integration does not exist or error adding column.';
    END;
    
    -- Gán dữ liệu cũ cho Admin
    BEGIN
        UPDATE public."integration" SET tenant_id = target_tenant_id WHERE tenant_id IS NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Đặt mặc định tenant_id = auth.uid() cho các record mới (chỉ áp dụng nếu insert mà không truyền tenant_id)
    BEGIN
        ALTER TABLE public."integration" ALTER COLUMN tenant_id SET DEFAULT auth.uid();
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Bật Row Level Security
    BEGIN
        ALTER TABLE public."integration" ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Xoá policy cũ nếu có
    BEGIN
        DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public."integration";
        DROP POLICY IF EXISTS "Allow Anon Insert" ON public."integration";
        DROP POLICY IF EXISTS "Allow Anon Select" ON public."integration";
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
    
    -- Tạo Policy cho người dùng đã đăng nhập (Authenticated): Chỉ xem/sửa/xóa dữ liệu của mình
    BEGIN
        CREATE POLICY "Tenant Isolation Policy" ON public."integration"
        FOR ALL
        TO authenticated
        USING (tenant_id = auth.uid())
        WITH CHECK (tenant_id = auth.uid());
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

END $$;
