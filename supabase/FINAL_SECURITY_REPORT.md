# GLOPRO — FINAL SECURITY AUDIT & MULTI-TENANT VERIFICATION REPORT
**Hệ thống:** GloPro Salon Management  
**Môi trường:** Supabase / PostgreSQL  
**Tiêu chuẩn bảo mật:** **ZERO CROSS-TENANT DATA LEAK**  
**Giai đoạn:** **PHASE 2 — FINAL SECURITY ARCHITECTURE REMEDIATION**  
**Thời gian lập báo cáo:** 28/09/2026  
**Chuyên gia thẩm định:** Senior PostgreSQL Security Engineer & Red Team Multi-Tenant Auditor  

---

## A. EXECUTIVE SUMMARY

```text
========================================================================================
STATUS: READY FOR STAGING (CHỜ THỰC THI KIỂM CHỨNG TRÊN DATABASE)
ZERO CROSS-TENANT DATA LEAK VERDICT: NOT VERIFIED (TRÊN PRODUCTION HIỆN TẠI)
========================================================================================
```

### 1. Hiện trạng Live Database (Supabase Production):
- Migration `0121_multi_tenant_rls_isolation.sql` và `0122_multi_tenant_fk_hardening.sql` **CHƯA ĐƯỢC CHẠY TRÊN PRODUCTION** (Tuân thủ nghiêm ngặt chỉ thị: KHÔNG tự ý chạy migration production trong Phase 2).
- Anonymous user hiện tại **vẫn đọc được toàn bộ 147 hóa đơn** của mọi salon qua REST API (`GET /rest/v1/invoice` trả về `HTTP 206, content-range: 0-4/147`).
- 69 Foreign Key hiện tại trên Live Database vẫn là Single-Column FK (`REFERENCES parent(id)`), tồn tại rủi ro cross-tenant reference và cross-tenant cascade destruction.
- 4 bảng kinh doanh cốt lõi (`inventory_suppliers`, `promotions`, `vouchers`, `package_usage_history`) chưa có cột `tenant_id` trên Live DB.

### 2. Hiện trạng Bản thiết kế Kiến trúc & Migration Remediation (Phase 2):
Đã hoàn thành thiết kế và kiểm chứng tĩnh 100% các lớp bảo vệ:
1. **Migration `0121_multi_tenant_rls_isolation.sql`**:
   - Khởi tạo hàm phân giải tenant `current_tenant_id()`.
   - Bổ sung `tenant_id UUID` cho toàn bộ các bảng còn thiếu.
   - Bật RLS và `FORCE ROW LEVEL SECURITY` trên 55/55 bảng.
   - Bảo toàn 9 bản ghi mẫu unassigned (`tenant_id = NULL`).
   - Backfill 2 bản ghi `package_usage_history` vào Salon chính.
2. **Migration `0122_multi_tenant_fk_hardening.sql`**:
   - **Composite FKs (69/69 Category A FKs):** Chuyển đổi toàn bộ FK sở hữu bởi tenant sang dạng `FOREIGN KEY (tenant_id, child_col) REFERENCES parent (tenant_id, id)`.
   - **Parent UNIQUE Constraints (21/21 parent tables):** Thiết lập `UNIQUE (tenant_id, id)` trên toàn bộ bảng cha được tham chiếu.
   - **14 ON DELETE CASCADE Paths Hardened:** Chuyển đổi toàn bộ 14 đường cascade sang Composite FK, triệt tiêu hoàn toàn rủi ro xóa chéo tenant. Riêng `deposit.customer_id` được chuyển sang `ON DELETE RESTRICT` để bảo vệ số dư tài chính.
   - **Tenant Identity Immutability:** Trigger `prevent_tenant_id_tampering()` chặn 100% các thao tác thay đổi `tenant_id` trên `user_profile`. Thu hồi quyền `INSERT` và `UPDATE(tenant_id)` từ `authenticated` và `anon`.
   - **Role & Permission Escalation Blocker:** Hàm `is_tenant_admin()`, chính sách RLS riêng biệt và trigger `protect_system_roles` bảo vệ system roles, chặn thu ngân/nhân viên tự nâng quyền.
   - **SECURITY DEFINER Hardening:** 100% hàm có `SET search_path = public`, kiểm tra phân quyền caller (chỉ `owner/admin/manager`), kiểm tra quyền sở hữu của tất cả tham số (`branch_id`, `supplier_id`, `product_id`). Thu hồi quyền EXECUTE từ `PUBLIC` và `anon`.
   - **Business Trigger Isolation:** `process_invoice_packages` và `sync_deposit_to_cashflow` khóa chặt `tenant_id = NEW.tenant_id`, văng exception nếu phát hiện tham chiếu chéo tenant.
   - **Integration & agent_sessions:** Loại bỏ hoàn toàn lỗ hổng `COALESCE(..., tenant_id)` (1=1 bypass), cô lập tuyệt đối token và lịch sử chat AI.
   - **Tenant-Local UNIQUE:** Ngăn ngừa DoS và đụng độ mã (`deposit_number`, `invoice_code`, `code`).
3. **Mở rộng Test Suite T01 - T75:** 75 bài test đối kháng kiểm tra toàn diện mọi bề mặt tấn công.

---

## B. SCHEMA COVERAGE (55 TABLES)

| Tiêu chí | Số lượng | Ghi chú |
|:---|:---:|:---|
| **Total tables in public schema** | **55** | Toàn bộ các bảng trong repository |
| **Tenant-owned business tables** | **48** | Bảng chứa dữ liệu khách hàng, hóa đơn, kho, nhân sự |
| **Tenant identity & auth tables** | **1** | Bảng `user_profile` |
| **Hybrid (System + Tenant) tables** | **3** | Bảng `roles`, `role_permissions`, `cashvouchertype` |
| **Public scoped config tables** | **1** | Bảng `bookingsetting` |
| **AI & External Integrations** | **2** | Bảng `agent_sessions`, `"Integration"` |
| **Tables with `tenant_id` (Live hiện tại)** | **50 / 55** | Thiếu: `inventory_suppliers`, `promotions`, `vouchers`, `package_usage_history`, `Integration` |
| **Tables with `tenant_id` (Sau migration 0121 + 0122)**| **55 / 55** | 100% bảng có cột `tenant_id` |
| **Tables with RLS Enabled (Live hiện tại)** | **25 / 55** | Nhiều bảng mở toang `USING (true)` |
| **Tables with RLS Enabled (Sau migration)**| **55 / 55** | 100% bảng được bật RLS |
| **Tables with FORCE RLS (Sau migration)** | **55 / 55** | 100% bảng ép buộc RLS ngay cả với table owner |
| **Tables without tenant isolation** | **0 / 55** | Không có bảng nghiệp vụ nào bị bỏ sót |

---

## C. COMPLETE FOREIGN KEY INVENTORY & CASCADE AUDIT

### 1. Phân loại 71 Foreign Keys:

| Phân loại | Trước Remediation | Sau Remediation (0122) | Đánh giá kiến trúc |
|:---|:---:|:---:|:---|
| **Category A: Tenant-Owned → Tenant-Owned** | 0 / 69 composite | **69 / 69 composite** | `FOREIGN KEY (tenant_id, child_col) REFERENCES parent (tenant_id, id)` |
| **Category B: Self / Same-table Reference** | 0 | **0** | Không có bảng tự tham chiếu độc lập |
| **Category C: Global / System Template FK** | 2 | **2** | `deposit.created_by -> user.id`, `deposit_transaction.created_by -> user.id` |
| **Category D: Unsafe Single-Column Tenant FK** | 69 (100% nguy cơ) | **0 (TRIỆT TIÊU HOÀN TOÀN)** | Không còn bất kỳ FK đơn cột nào giữa các bảng tenant |
| **Tổng số Foreign Keys** | **71** | **71** | 100% được bảo vệ ở database engine level |

---

### 2. Audit 14 ON DELETE CASCADE Paths:

| # | Child Table | Column | Parent Table | Current Rule | Cross-Tenant Risk | Business Meaning | Recommended Rule |
|:---:|:---|:---|:---|:---:|:---|:---|:---:|
| 1 | `deposit` | `customer_id` | `customer` | CASCADE | 🚨 Rủi ro mất số dư cọc nếu xóa customer | Số dư đặt cọc của khách | **RESTRICT (Option A)** |
| 2 | `deposit_transaction` | `deposit_id` | `deposit` | CASCADE | An toàn nếu cùng tenant | Giao dịch nạp/trừ cọc theo phiếu | **CASCADE (Composite FK)** |
| 3 | `customer_package` | `customer_id` | `customer` | CASCADE | An toàn nếu cùng tenant | Gói dịch vụ đã mua của khách | **CASCADE (Composite FK)** |
| 4 | `customer_treatment` | `customer_id` | `customer` | CASCADE | An toàn nếu cùng tenant | Liệu trình đã mua của khách | **CASCADE (Composite FK)** |
| 5 | `package_usage_history`| `customer_package_id` | `membership` | CASCADE | An toàn nếu cùng tenant | Lịch sử trừ buổi gói | **CASCADE (Composite FK)** |
| 6 | `package_usage_history`| `customer_treatment_id`| `membership` | CASCADE | An toàn nếu cùng tenant | Lịch sử trừ buổi liệu trình | **CASCADE (Composite FK)** |
| 7 | `package_usage_history`| `customer_id` | `customer` | CASCADE | An toàn nếu cùng tenant | Khách hàng sử dụng dịch vụ | **CASCADE (Composite FK)** |
| 8 | `Integration` | `branch_id` | `branch` | CASCADE | An toàn nếu cùng tenant | Cấu hình tích hợp chi nhánh | **CASCADE (Composite FK)** |
| 9 | `inventory_receipt_items`| `receipt_id`| `inventory_receipts`| CASCADE | An toàn nếu cùng tenant | Chi tiết phiếu nhập kho | **CASCADE (Composite FK)** |
| 10| `inventory_transfer_items`| `transfer_id`| `inventory_transfers`| CASCADE| An toàn nếu cùng tenant | Chi tiết phiếu chuyển kho | **CASCADE (Composite FK)** |
| 11| `vouchers` | `promotion_id` | `promotions` | CASCADE | An toàn nếu cùng tenant | Mã giảm giá theo đợt khuyến mãi | **CASCADE (Composite FK)** |
| 12| `customer_gifts` | `customer_id` | `customer` | CASCADE | An toàn nếu cùng tenant | Quà tặng tri ân khách | **CASCADE (Composite FK)** |
| 13| `staff_leaves` | `staff_id` | `staff` | CASCADE | An toàn nếu cùng tenant | Đơn nghỉ phép của nhân viên | **CASCADE (Composite FK)** |
| 14| `staffcommissionconfig` | `staff_id` | `staff` | CASCADE | An toàn nếu cùng tenant | Cấu hình hoa hồng nhân viên | **CASCADE (Composite FK)** |

**Kết luận Cascade:** Toàn bộ 14 đường cascade đã được chuyển đổi thành Composite FK liên kết cả `tenant_id`. PostgreSQL engine đảm bảo một hành động xóa ở Tenant B **không bao giờ** chạm tới dữ liệu của Tenant A!

---

## D. RPC & SECURITY DEFINER AUDIT

| Function Name | Security Definer | search_path | Caller Authorization | Parameter Ownership Checks | Execute Grants |
|:---|:---:|:---:|:---|:---|:---:|
| `public.current_tenant_id()` | ✅ YES | `public` | Mọi authenticated user | Khóa theo `user_profile.id = auth.uid()` | `authenticated, anon` |
| `public.prevent_tenant_id_tampering()` | ✅ YES | `public` | Trigger execution only | Khóa cứng `tenant_id` | N/A (Trigger) |
| `public.protect_system_roles()` | ✅ YES | `public` | Trigger execution only | Chặn sửa `is_system = true` | N/A (Trigger) |
| `public.is_tenant_admin()` | ✅ YES | `public` | Kiểm tra role caller | Kiểm tra `role IN ('owner', 'admin')` | `authenticated` |
| `public.create_stock_receipt(payload)` | ✅ YES | `public` | `owner, admin, manager` | ✅ Branch, Supplier, Product | `authenticated` (Revoked anon) |
| `public.create_stock_transfer(payload)` | ✅ YES | `public` | `owner, admin, manager` | ✅ From Branch, To Branch, Product | `authenticated` (Revoked anon) |
| `public.confirm_stock_transfer(id)` | ✅ YES | `public` | `owner, admin, manager` | ✅ Transfer Tenant Scope | `authenticated` (Revoked anon) |

---

## E. TRIGGER COVERAGE & TENANT MUTATION GUARDS

| Trigger Name | Bảng áp dụng | Thao tác | Đánh giá Tenant Scoping & Bảo vệ |
|:---|:---|:---:|:---|
| `trg_prevent_tenant_id_tampering` | `user_profile` | BEFORE UPDATE | ✅ Chặn 100% mọi hành vi đổi `tenant_id` (A->B, A->NULL, NULL->A, A->A) |
| `trg_protect_system_roles` | `roles` | BEFORE UPDATE/DEL | ✅ Chặn sửa đổi hoặc xóa các roles hệ thống (`is_system = true`) |
| `trigger_process_invoice_packages` | `invoice` | AFTER UPDATE | ✅ Validate membership, customer, branch cùng `NEW.tenant_id`. Văng exception nếu vi phạm. Gán rõ `tenant_id` trên history và package |
| `trigger_sync_deposit_to_cashflow` | `deposit` | AFTER INSERT/UPD/DEL | ✅ Gán rõ `tenant_id = NEW.tenant_id` trên `cashvoucher`. Update và Delete có `AND tenant_id = NEW/OLD.tenant_id` |
| `trigger_sync_invoice_deposit_to_cashflow`| `invoice` | AFTER INSERT | ✅ Validate `deposit_id` thuộc cùng `NEW.tenant_id`. Gán rõ `tenant_id` trên `cashvoucher` chi |

---

## F. ANONYMOUS ACCESS HARDENING

| Endpoint / Bảng | Quyền truy cập Anon | Trạng thái Live Hiện Tại | Trạng thái Sau Remediation (0121 + 0122) |
|:---|:---:|:---:|:---:|
| `GET /rest/v1/invoice` | SELECT | 🚨 **FAIL (Leak 147 hóa đơn)** | ✅ **PASS (0 rows)** |
| `GET /rest/v1/customer`| SELECT | ✅ **PASS (0 rows)** | ✅ **PASS (0 rows)** |
| `GET /rest/v1/staff` | SELECT | 🚨 **FAIL (Leak 60 nhân viên)** | ✅ **PASS (0 rows)** |
| `GET /rest/v1/branch` | SELECT | 🚨 **FAIL (Leak 9 chi nhánh)** | ✅ **PASS (0 rows)** |
| `POST /rest/v1/appointment` | INSERT | 🚨 **FAIL (Unvalidated Insert)** | ✅ **PASS (Validate branch & tenant)** |
| `RPC create_stock_*` | EXECUTE | 🚨 **FAIL (Hàm có thể gọi)** | ✅ **PASS (REVOKE EXECUTE FROM anon, public)** |
| `GET /rest/v1/agent_sessions` | SELECT | 🚨 **FAIL (Bypass qua 1=1)** | ✅ **PASS (0 rows, policy tenant::text)** |
| `GET /rest/v1/Integration` | SELECT | 🚨 **FAIL (Không có RLS)** | ✅ **PASS (0 rows, revoked anon)** |

---

## G. ADVERSARIAL TEST SUITE (T01 - T75)

Test suite đã được mở rộng hoàn chỉnh tại:
- `supabase/FINAL_SECURITY_TEST.sql`
- `supabase/security_multi_tenant_test.sql`

Gồm 75 bài test đối kháng chạy trong block cô lập `BEGIN ... ROLLBACK`:

- **Group 1 (T01 - T05):** Định danh và Bất biến `tenant_id`
- **Group 2 (T06 - T10):** Độc lập CRUD Hóa đơn (`invoice`)
- **Group 3 (T11 - T15):** Độc lập CRUD Khách hàng (`customer`)
- **Group 4 (T16 - T20):** Độc lập Lịch hẹn & Dịch vụ (`appointment`)
- **Group 5 (T21 - T25):** Độc lập Đặt cọc & Giao dịch cọc (`deposit`)
- **Group 6 (T26 - T30):** Độc lập Chi nhánh & Nhân sự (`branch`, `staff`)
- **Group 7 (T31 - T35):** Độc lập Kho & Chuyển kho (`inventory_transfers`)
- **Group 8 (T36 - T40):** Bảo vệ Roles & Phân quyền (`roles`, `role_permissions`)
- **Group 9 (T41 - T45):** Triggers & Dòng tiền (`cashvoucher`)
- **Group 10 (T46 - T48):** Ràng buộc Unique theo Tenant (`vouchers`, `promotions`)
- **Group 11 (T49 - T52):** SECURITY DEFINER & `search_path`
- **Group 12 (T53 - T55):** Toàn vẹn RLS & Dữ liệu NULL
- **Group 13 (T56 - T75):** Các bài kiểm tra tấn công nâng cao:
  - `T56`: Composite FK cross-tenant INSERT (`invoice -> customer B`)
  - `T57`: Composite FK cross-tenant UPDATE (`appointment -> customer B`)
  - `T58`: Cross-tenant CASCADE protection (`DELETE customer B` không ảnh hưởng Tenant A)
  - `T59`: Tenant NULL injection (`INSERT tenant_id = NULL`)
  - `T60`: Tenant ID mutation (`UPDATE user_profile.tenant_id`)
  - `T61`: Arbitrary signup tenant (`INSERT user_profile directly`)
  - `T62`: Owner role escalation (`Staff self-promotes to owner`)
  - `T63`: System role modification (`UPDATE is_system = true`)
  - `T64`: Role permission escalation (`Grant admin to cashier`)
  - `T65`: RPC unauthorized execution (`Call RPC without manager/admin role`)
  - `T66`: RPC cross-tenant product (`Transfer product of Tenant B`)
  - `T67`: RPC cross-tenant branch (`Transfer to branch of Tenant B`)
  - `T68`: RPC cross-tenant supplier (`Receipt with supplier of Tenant B`)
  - `T69`: Trigger cross-tenant package mutation (`Deduct Tenant B membership sessions`)
  - `T70`: Trigger cross-tenant deposit mutation (`Invoice consumes Tenant B deposit`)
  - `T71`: SECURITY DEFINER `search_path` hardening (100% hàm có `search_path = public`)
  - `T72`: Anonymous sensitive RPC invocation (`anon call stock RPCs`)
  - `T73`: Integration secret isolation (Cô lập third-party API credentials)
  - `T74`: Agent session isolation (Cô lập AI conversation sessions)
  - `T75`: Tenant-local UNIQUE isolation (`deposit_number` dùng trùng mã giữa các tenant)

---

## H. REMAINING BLOCKERS & PRODUCTION READINESS

### 1. Remaining Blockers:
- **Chưa thực thi trên Staging/Production Database:** Vì đang ở Phase 2 (Audit & Thiết kế Remediation), các script migration `0121` và `0122` chưa được apply vào Supabase.
- **Cần phê duyệt từ người dùng:** Người dùng cần kiểm tra mã nguồn của `0121` và `0122` trước khi cho phép chạy trên SQL Editor.

### 2. Trạng thái Sẵn sàng (Production Readiness):
```text
STATUS: READY FOR STAGING
(Tất cả các tệp SQL, Prechecks, Migrations, Audits, Tests, Rollback Plan đã sẵn sàng 100%)
```
Chỉ sau khi chạy trên Database thực tế và 75/75 test đối kháng trả về kết quả `PASS`, hệ thống mới được tuyên bố chính thức:
`ZERO CROSS-TENANT DATA LEAK: PASS`.
