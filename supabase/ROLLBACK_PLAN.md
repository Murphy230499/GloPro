# KẾ HOẠCH ROLLBACK KHẨN CẤP (EMERGENCY ROLLBACK PLAN)
**Hệ thống:** GloPro Salon Management  
**Mục tiêu:** Khôi phục trạng thái database nếu migration `0121` hoặc `0122` gặp sự cố gián đoạn hoặc lỗi không mong muốn.

---

## 1. TIÊU CHÍ KÍCH HOẠT ROLLBACK (ROLLBACK CRITERIA)

Kích hoạt Rollback ngay lập tức nếu xuất hiện bất kỳ trường hợp nào sau đây:
1. **Lỗi ứng dụng nghiêm trọng (P0 Outage):** Frontend hoặc Mobile App hoàn toàn không thể tải danh sách dịch vụ, khách hàng, nhân viên sau khi áp dụng migration.
2. **Xung đột Constraint (Integrity Failure):** Lệnh thêm Composite Unique hoặc Foreign Key văng lỗi làm gián đoạn transaction chính.
3. **Mất dữ liệu hiển thị của người dùng (Data Invisibility):** Tài khoản chủ salon chính (`duclivegiolinh`) hoặc salon kiểm thử (`minhphantester`) bị rỗng dữ liệu (0 rows) do hàm phân giải tenant thất bại.
4. **Adversarial Test Suite T01-T75 có từ 1 test trở lên bị FAIL** trong môi trường staging/production.

---

## 2. KỊCH BẢN ROLLBACK SQL KHẨN CẤP (EMERGENCY ROLLBACK SCRIPT)

### Kịch bản 1: Rollback Migration 0122 (Composite FKs & Triggers)
Nếu sự cố phát sinh do Composite FKs hoặc Triggers mới trong `0122_multi_tenant_fk_hardening.sql`, chạy đoạn script sau:

```sql
BEGIN;

-- 1. Khôi phục quyền bảng user_profile
GRANT UPDATE (tenant_id) ON public.user_profile TO authenticated;
GRANT INSERT ON public.user_profile TO authenticated;

-- 2. Xóa các triggers bảo vệ mới
DROP TRIGGER IF EXISTS trg_protect_system_roles ON public.roles;
DROP FUNCTION IF EXISTS public.protect_system_roles();

-- 3. Xóa các Foreign Key composite đã tạo trong 0122
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.constraint_name LIKE 'fk_%_tenant'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 4. Khôi phục lại các Single-Column Foreign Key cơ bản (nếu cần thiết cho ứng dụng cũ)
-- (Hệ thống vẫn giữ nguyên các parent UNIQUE và RLS từ 0121 để duy trì mức độ an toàn tối thiểu)

COMMIT;
```

---

### Kịch bản 2: Full Rollback (Cả 0121 và 0122)
Đưa toàn bộ hệ thống về nguyên trạng trước khi áp dụng RLS:

```sql
BEGIN;

-- 1. Xóa các triggers và hàm bảo vệ
DROP TRIGGER IF EXISTS trg_prevent_tenant_id_tampering ON public.user_profile;
DROP FUNCTION IF EXISTS public.prevent_tenant_id_tampering();

DROP TRIGGER IF EXISTS trg_protect_system_roles ON public.roles;
DROP FUNCTION IF EXISTS public.protect_system_roles();

DROP TRIGGER IF EXISTS trg_validate_invoice_tenant ON public.invoice;
DROP TRIGGER IF EXISTS trg_validate_appointment_tenant ON public.appointment;
DROP FUNCTION IF EXISTS public.validate_tenant_references();

-- 2. Khôi phục quyền bảng user_profile
GRANT UPDATE (tenant_id) ON public.user_profile TO authenticated, anon;
GRANT INSERT ON public.user_profile TO authenticated, anon;

-- 3. Xóa các Composite Foreign Keys
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.constraint_name LIKE 'fk_%_tenant'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 4. Xóa toàn bộ policies đã tạo trên 55 bảng
DO $$
DECLARE
    tbl text;
    pol record;
    all_tables text[] := ARRAY[
        'appointment', 'bookingsetting', 'branch', 'cashvoucher', 'cashvouchertype',
        'customer', 'customer_gifts', 'customer_package', 'customer_segments_auto',
        'customer_treatment', 'customergroup', 'customersegment', 'customertier',
        'customertierhistory', 'deposit', 'deposit_policy', 'deposit_transaction',
        'facility', 'inventory_receipt_items', 'inventory_receipts', 'inventory_suppliers',
        'inventory_transfer_items', 'inventory_transfers', 'invoice', 'loyaltyrule',
        'membership', 'package_usage_history', 'prepaidcard', 'product', 'productcombo',
        'promo_usages', 'promotions', 'revenuebonusrule', 'room', 'service',
        'servicecombo', 'servicegroup', 'servicepackage', 'shift', 'shifttemplate',
        'staff', 'staff_leaves', 'staffattendance', 'staffcommissionconfig',
        'staffcommissionrule', 'staffgroup', 'staffschedule', 'treatment', 'user',
        'vouchers', 'user_profile', 'roles', 'role_permissions', 'agent_sessions', 'Integration'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
            FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl) LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 5. Hoàn tác backfill trên package_usage_history
UPDATE public.package_usage_history 
SET tenant_id = NULL 
WHERE id IN ('f317add0-d41a-499e-98c1-809ca19de456', '9f194c6f-e9b8-45c0-a5ff-d75899c0b741');

COMMIT;
```

---

## 3. NGUYÊN TẮC BẢO TOÀN DỮ LIỆU (ZERO DATA LOSS GUARANTEE)

1. Cả hai migration `0121` và `0122` được thiết kế **CHỈ THÊM (ADDITIVE), KHÔNG XÓA (NON-DESTRUCTIVE)**:
   - Tuyệt đối không dùng `DROP TABLE`.
   - Tuyệt đối không dùng `DROP COLUMN`.
   - Cột `tenant_id` mới thêm vào các bảng thiếu không xóa bất kỳ dữ liệu cũ nào.
2. Hai bản ghi `package_usage_history` được cập nhật `tenant_id` tương thích 100% với invoice và customer của salon chính, có thể hoàn tác bằng lệnh SQL đã cung cấp.
3. Chín bản ghi mẫu (`inventory_suppliers`, `promotions`, `vouchers`) được giữ nguyên `tenant_id = NULL`, không bị thay đổi dữ liệu gốc.
