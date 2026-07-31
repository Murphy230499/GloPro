# PLAN: Deposit Report

## 1. Context & Goal
- **User Request:** Bổ sung báo cáo Đặt cọc để theo dõi tình hình tiền cọc của khách hàng.
- **Current State:** The system tracks deposits (`Deposit` entity) and allows using them in POS. However, the Reports section does not fetch or aggregate deposit data yet.
- **Goal:** Add a dedicated "Deposit Report" (Báo cáo Đặt cọc) tab in the main Reports dashboard to visualize deposit metrics.

## 2. Task Breakdown

### Phase 1: Data Integration
- **`src/views/Reports.jsx`**:
  - Add `deposits` state.
  - Fetch `Deposit` entity (`safeFilter(base44.entities?.Deposit, filter)`).
  - Pass `deposits` to the new `DepositReportTab` component.
  - Add `deposits` to `dataForExport`.
  - Add `case 'deposits'` to `renderActiveTab`.

### Phase 2: Navigation & Routing
- **`src/components/reports/ReportLayout.jsx`**:
  - Import a suitable icon (e.g., `PiggyBank` or `ShieldCheck`).
  - Add `{ id: 'deposits', name: 'Báo Cáo Đặt Cọc', icon: PiggyBank }` to `REPORT_MODULES`.

### Phase 3: Component Implementation
- **`src/components/reports/tabs/DepositReportTab.jsx`** (NEW FILE):
  - **KPI Cards:**
    - Tổng tiền cọc đã nhận.
    - Tiền cọc đã sử dụng (thanh toán).
    - Tiền cọc khả dụng (còn lại).
    - Tiền cọc đã hoàn trả/huỷ.
  - **Charts:**
    - Biểu đồ xu hướng nhận cọc theo ngày (Bar Chart / Area Chart).
  - **Data Table:**
    - Danh sách chi tiết các khoản cọc trong kỳ báo cáo (Khách hàng, Số tiền, Trạng thái, Ngày tạo).

## 3. Verification Plan
- Check if "Báo Cáo Đặt Cọc" appears in the sidebar menu of the Reports page.
- Verify that clicking the tab shows the new dashboard without crashing.
- Test that filtering by date updates the KPIs and charts correctly.
- Ensure the total deposits amount matches the actual deposit data in the database.

## 4. Affected Files
- `src/views/Reports.jsx` (Update)
- `src/components/reports/ReportLayout.jsx` (Update)
- `src/components/reports/tabs/DepositReportTab.jsx` (Create)

## 5. Agent Assignments
- **`frontend-specialist`**: Implement the UI components (`DepositReportTab.jsx`) and wire up the state in `Reports.jsx` and `ReportLayout.jsx`.
- **`backend-specialist`**: Ensure the Supabase `Deposit` entity queries are performant if needed (though existing Base44 client `list` should suffice).
