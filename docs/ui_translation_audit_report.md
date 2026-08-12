# UI Translation Audit Report

## 1. Summary
This report lists all hardcoded user interface strings found in the application source code. All strings have been categorized, deduplicated, and mapped to translation keys for systematic internationalization.

## 2. Statistics
| Metric | Value |
|--------|-------|
| **Total Files Scanned** | 436 |
| **Total Components Scanned** | 436 |
| **Total UI Strings Found** | 6419 |
| **Unique UI Strings** | 4327 |
| **Duplicate Strings** | 2092 |
| **Potential Translation Keys** | 4327 |

## 3. Top Duplicated UI Strings
| Text | Count | Suggested Key | Recommended Action |
|------|-------|---------------|--------------------|
| `Hủy` | 42 | `common.huy` | Consolidate to common key |
| `Khách vãng lai` | 40 | `common.khach_vang_lai` | Consolidate to common key |
| `Khách hàng` | 37 | `common.khach_hang` | Consolidate to common key |
| `Lễ tân` | 35 | `common.le_tan` | Consolidate to common key |
| `Dịch vụ` | 32 | `common.dich_vu` | Consolidate to common key |
| `Sản phẩm` | 30 | `common.san_pham` | Consolidate to common key |
| `Lỗi:` | 28 | `common.loi` | Consolidate to common key |
| `Tiền mặt` | 19 | `common.tien_mat` | Consolidate to common key |
| `Khách mới` | 19 | `common.khach_moi` | Consolidate to common key |
| `sản phẩm` | 18 | `common.san_pham` | Consolidate to common key |
| `Số điện thoại` | 18 | `common.so_dien_thoai` | Consolidate to common key |
| `Hoàn thành` | 17 | `common.hoan_thanh` | Consolidate to common key |
| `Kỹ thuật viên` | 17 | `common.ky_thuat_vien` | Consolidate to common key |
| `Khác` | 17 | `common.khac` | Consolidate to common key |
| `Đồng` | 16 | `common.dong` | Consolidate to common key |
| `Quản lý` | 15 | `common.quan_ly` | Consolidate to common key |
| `Thẻ tiền mặt` | 14 | `common.the_tien_mat` | Consolidate to common key |
| `Chọn tất cả` | 14 | `common.chon_tat_ca` | Consolidate to common key |
| `Trạng thái` | 14 | `common.trang_thai` | Consolidate to common key |
| `dịch vụ` | 14 | `common.dich_vu` | Consolidate to common key |
| `Sửa` | 13 | `common.sua` | Consolidate to common key |
| `Đóng` | 12 | `common.dong` | Consolidate to common key |
| `Huỷ` | 12 | `common.huy` | Consolidate to common key |
| `Liệu trình` | 12 | `common.lieu_trinh` | Consolidate to common key |
| `Vàng` | 11 | `common.vang` | Consolidate to common key |
| `Không đến` | 11 | `common.khong_den` | Consolidate to common key |
| `Số tiền` | 11 | `common.so_tien` | Consolidate to common key |
| `Số lượng` | 11 | `common.so_luong` | Consolidate to common key |
| `Bạc` | 10 | `common.bac` | Consolidate to common key |
| `Đang lưu...` | 10 | `common.dang_luu` | Consolidate to common key |

## 4. Inconsistent Wording Analysis
The audit detected several terms representing similar actions but using inconsistent Vietnamese vocabulary. We recommend unifying these variants:

### Unified Recommendation: **`Hủy`**
- Variant `Hủy`: appears **42** times
- Variant `Hủy bỏ`: appears **1** times
- Variant `Huỷ bỏ`: appears **1** times
- Variant `Huỷ`: appears **12** times

### Unified Recommendation: **`Thêm`**
- Variant `Thêm mới`: appears **4** times
- Variant `Tạo mới`: appears **4** times

## 5. Top Files Requiring Refactoring
The following files contain the highest density of hardcoded UI strings and should be targeted first during translation refactoring:

| File | Hardcoded String Count | Primary Module |
|------|------------------------|----------------|
| [`Customers.jsx`](file:////Volumes/Coding/GloPro/src/views/Customers.jsx) | 401 | Customer |
| [`StaffPayrollDetailView.jsx`](file:////Volumes/Coding/GloPro/src/components/staff/StaffPayrollDetailView.jsx) | 259 | Common |
| [`Settings.jsx`](file:////Volumes/Coding/GloPro/src/views/Settings.jsx) | 233 | Settings |
| [`aiAssistantEngine.js`](file:////Volumes/Coding/GloPro/src/lib/aiAssistantEngine.js) | 221 | Common |
| [`Discounts.jsx`](file:////Volumes/Coding/GloPro/src/views/Discounts.jsx) | 172 | Common |
| [`EditEventModal.jsx`](file:////Volumes/Coding/GloPro/src/components/automations/EditEventModal.jsx) | 158 | Common |
| [`AppointmentModal.jsx`](file:////Volumes/Coding/GloPro/src/components/AppointmentModal.jsx) | 157 | Appointment |
| [`OverviewTab.jsx`](file:////Volumes/Coding/GloPro/src/components/reports/tabs/OverviewTab.jsx) | 130 | Report |
| [`StaffPayrollDetailModal.jsx`](file:////Volumes/Coding/GloPro/src/components/staff/StaffPayrollDetailModal.jsx) | 127 | Common |
| [`InvoiceDetail.jsx`](file:////Volumes/Coding/GloPro/src/views/InvoiceDetail.jsx) | 113 | Common |
| [`ManageTemplatesView.jsx`](file:////Volumes/Coding/GloPro/src/components/automations/ManageTemplatesView.jsx) | 111 | Common |
| [`TicketColumn.jsx`](file:////Volumes/Coding/GloPro/src/components/pos/TicketColumn.jsx) | 108 | POS |
| [`SchedulerGrid.jsx`](file:////Volumes/Coding/GloPro/src/components/staff/SchedulerGrid.jsx) | 94 | Common |
| [`POS.jsx`](file:////Volumes/Coding/GloPro/src/views/POS.jsx) | 92 | POS |
| [`Invoices.jsx`](file:////Volumes/Coding/GloPro/src/views/Invoices.jsx) | 90 | Common |
| [`CustomerSegmentsTab.jsx`](file:////Volumes/Coding/GloPro/src/components/customers/CustomerSegmentsTab.jsx) | 82 | Customer |
| [`Services.jsx`](file:////Volumes/Coding/GloPro/src/views/Services.jsx) | 80 | Common |
| [`Appointments.jsx`](file:////Volumes/Coding/GloPro/src/views/Appointments.jsx) | 76 | Appointment |
| [`CheckoutModal.jsx`](file:////Volumes/Coding/GloPro/src/components/pos/CheckoutModal.jsx) | 74 | POS |
| [`AutomationDetailView.jsx`](file:////Volumes/Coding/GloPro/src/views/AutomationDetailView.jsx) | 73 | Common |

## 6. Complete Table of Extracted Strings (Sample / Top 100)
> [!NOTE]
> For the full list of 6,000+ entries, please refer to the raw JSON file: [raw_audit_results.json](file:///Users/minhthu/.gemini/antigravity-ide/brain/060f0cd9-9959-4d78-a224-9bd8a9fc8351/scratch/raw_audit_results.json).

| File | Line | Component | Text | Suggested Key | Category |
|------|------|-----------|------|---------------|----------|
| `AnalyticsAgent.ts` | 74 | AnalyticsAgent | `Tôi có thể giúp bạn phân tích doanh thu, lợi nhuận ròng, năng suất nhân viên, LTV khách hàng, biên lợi nhuận dịch vụ, đưa ra đề xuất kinh doanh, dự báo doanh thu tương lai và phát hiện xu hướng thị trường. Bạn cần tôi phân tích chỉ số nào?` | `common.toi_co_the_giup_ban_phan_tich_` | Common |
| `AnalyticsAgent.ts` | 77 | AnalyticsAgent | `lợi nhuận` | `common.loi_nhuan` | Common |
| `AnalyticsAgent.ts` | 77 | AnalyticsAgent | `lãi` | `common.lai` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ** (Tăng trưởng: +$r.growthPercentage%)\n  - Doanh thu Dịch vụ: $r.serviceRevenue.toLocaleString(` | `common.d_tang_truong_r_growthpercenta` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ\n  - Bán lẻ Sản phẩm: $r.productSalesRevenue.toLocaleString(` | `common.d_n_ban_le_san_pham_r_products` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ\n\n• **Chi phí**: Vốn hàng ($p.cogsMaterialCost.toLocaleString(` | `common.d_n_n_chi_phi_von_hang_p_cogsm` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ), Lương nhân viên ($p.laborPayrollExpense.toLocaleString(` | `common.d_luong_nhan_vien_p_laborpayro` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ), Vận hành ($p.overheadExpenses.toLocaleString(` | `common.d_van_hanh_p_overheadexpenses_` | Common |
| `AnalyticsAgent.ts` | 89 | AnalyticsAgent | `)đ)\n• **LỢI NHUẬN RÒNG**: **$p.netProfit.toLocaleString(` | `common.d_n_loi_nhuan_rong_p_netprofit` | Common |
| `AnalyticsAgent.ts` | 93 | AnalyticsAgent | `dự báo` | `common.du_bao` | Common |
| `AnalyticsAgent.ts` | 93 | AnalyticsAgent | `xu hướng` | `common.xu_huong` | Common |
| `AnalyticsAgent.ts` | 93 | AnalyticsAgent | `đề xuất` | `common.de_xuat` | Common |
| `AnalyticsAgent.ts` | 105 | AnalyticsAgent | `)đ** (Độ tin cậy: $f.confidenceScore%)\n• **Dự báo lượt khách**: **$f.predictedCustomerCount lượt**\n\n🔥 **Dịch vụ đang thành Trend**: $t.trendingServices.join(` | `common.d_do_tin_cay_f_confidencescore` | Common |
| `AnalyticsAgent.ts` | 105 | AnalyticsAgent | `)\n⏰ **Khung giờ cao điểm**: $t.peakHours.join(` | `common.n_khung_gio_cao_diem_t_peakhou` | Common |
| `examples.ts` | 20 | examples | `Phân tích tổng doanh thu salon trong tháng này` | `common.phan_tich_tong_doanh_thu_salon` | Common |
| `examples.ts` | 21 | examples | `📈 **Báo cáo Doanh thu**: Tổng **125.000.000đ** (Dịch vụ: 102.000.000đ, Bán lẻ sản phẩm: 23.000.000đ) - Tăng trưởng +14.2% so với tháng trước.` | `common.bao_cao_doanh_thu_tong_125_000` | Common |
| `examples.ts` | 32 | examples | `Báo cáo chi tiết lợi nhuận ròng và biên lợi nhuận salon tháng này` | `common.bao_cao_chi_tiet_loi_nhuan_ron` | Common |
| `examples.ts` | 33 | examples | `💵 **Báo cáo Lợi nhuận Ròng**: Doanh thu 125.000.000đ trừ Vốn hàng (18.5tr), Lương (45tr), Chi phí vận hành (15tr) -> **LỢI NHUẬN RÒNG: 46.500.000đ** (Biên lợi nhuận ròng: **37%**).` | `common.bao_cao_loi_nhuan_rong_doanh_t` | Common |
| `examples.ts` | 44 | examples | `Xếp hạng năng suất và doanh thu của các thợ làm tóc salon` | `common.xep_hang_nang_suat_va_doanh_th` | Common |
| `examples.ts` | 45 | examples | `🏆 **Bảng Xếp Hạng Năng Suất Nhân Viên**:\n1. **Minh Thu**: 27.500.000đ (85 lượt khách | Rating 4.9★)\n2. **Trần Văn B**: 19.800.000đ (62 lượt khách | Rating 4.8★)` | `common.bang_xep_hang_nang_suat_nhan_v` | Common |
| `examples.ts` | 56 | examples | `Phân tích tỷ lệ giữ chân khách hàng và giá trị vòng đời khách hàng (LTV)` | `common.phan_tich_ty_le_giu_chan_khach` | Common |
| `examples.ts` | 57 | examples | `👥 **Phân tích Khách hàng**: Giá trị vòng đời trung bình (LTV) đạt **3.450.000đ/khách**, Tỷ lệ giữ chân khách hàng đạt **84.5%**.` | `common.phan_tich_khach_hang_gia_tri_v` | Common |
| `examples.ts` | 68 | examples | `Top dịch vụ mang lại doanh thu & biên lợi nhuận cao nhất salon` | `common.top_dich_vu_mang_lai_doanh_thu` | Common |
| `examples.ts` | 69 | examples | `💇‍♀️ **Top Dịch Vụ Sinh Lời**:\n1. **Gội đầu dưỡng sinh**: 142 lượt (Doanh thu: 21.3tr | Lãi 78.5%)\n2. **Uốn tóc Hàn Quốc**: 48 lượt (Doanh thu: 28.8tr | Lãi 65.0%)` | `common.top_dich_vu_sinh_loi_n1_goi_da` | Common |
| `examples.ts` | 80 | examples | `Đề xuất giải pháp AI để tối ưu hóa doanh thu và lấp đầy khung giờ trống salon` | `common.de_xuat_giai_phap_ai_de_toi_uu` | Common |
| `examples.ts` | 81 | examples | `💡 **Đề xuất Đột phá AI**:\n• **Cơ hội**: 65% khách gội đầu sẵn sàng mua Combo Ủ Keratin -> Tạo gói Upsell Combo tại POS.\n• **Khung giờ vắng**: Chạy Happy Hour giảm 25% buổi trưa (13:00 - 15:00).` | `common.de_xuat_dot_pha_ai_n_co_hoi_65` | Common |
| `examples.ts` | 92 | examples | `Dự báo doanh thu và lượng khách hàng salon trong tháng tới` | `common.du_bao_doanh_thu_va_luong_khac` | Common |
| `examples.ts` | 93 | examples | `🔮 **Dự báo Doanh thu AI**: Dự kiến tháng tới đạt **138.000.000đ** (Độ tin cậy 89.5%) với khoảng **420 lượt khách**.` | `common.du_bao_doanh_thu_ai_du_kien_th` | Common |
| `examples.ts` | 104 | examples | `Phát hiện xu hướng làm đẹp và khung giờ cao điểm khách đông nhất` | `common.phat_hien_xu_huong_lam_dep_va_` | Common |
| `examples.ts` | 105 | examples | `🔥 **Xu hướng & Giờ Cao Điểm**:\n• Service Trend: Nhuộm Nâu Tây Ánh Khói, Gội đầu thảo dược.\n• Giờ cao điểm: 10:00 - 11:30 & 17:00 - 19:30 Thứ 7, CN.` | `common.xu_huong_gio_cao_diem_n_servic` | Common |
| `AnalyzeEmployeePerformanceTool.ts` | 32 | AnalyzeEmployeePerformanceTool | `Trần Văn B` | `common.tran_van_b` | Common |
| `AnalyzeServicePerformanceTool.ts` | 31 | AnalyzeServicePerformanceTool | `Gội đầu dưỡng sinh` | `common.goi_dau_duong_sinh` | Common |
| `AnalyzeServicePerformanceTool.ts` | 32 | AnalyzeServicePerformanceTool | `Uốn tócsetting phong cách Hàn Quốc` | `common.uon_tocsetting_phong_cach_han_` | Common |
| `AnalyzeServicePerformanceTool.ts` | 34 | AnalyzeServicePerformanceTool | `Duỗi tóc thẳng tự nhiên` | `common.duoi_toc_thang_tu_nhien` | Common |
| `AnalyzeServicePerformanceTool.ts` | 34 | AnalyzeServicePerformanceTool | `Nhuộm highlight đơn sắc` | `common.nhuom_highlight_don_sac` | Common |
| `DetectTrendsTool.ts` | 30 | DetectTrendsTool | `Nhuộm Nâu Tây Ánh Khói` | `common.nhuom_nau_tay_anh_khoi` | Common |
| `DetectTrendsTool.ts` | 30 | DetectTrendsTool | `Gội đầu thảo dược trị liệu` | `common.goi_dau_thao_duoc_tri_lieu` | Common |
| `DetectTrendsTool.ts` | 30 | DetectTrendsTool | `Phục hồi Keratin Nano` | `common.phuc_hoi_keratin_nano` | Common |
| `DetectTrendsTool.ts` | 32 | DetectTrendsTool | `Thứ 7` | `common.thu_7` | Common |
| `DetectTrendsTool.ts` | 32 | DetectTrendsTool | `Chủ Nhật` | `common.chu_nhat` | Common |
| `DetectTrendsTool.ts` | 33 | DetectTrendsTool | `Nhu cầu làm tóc tăng 35% trong giai đoạn chuẩn bị Lễ/Tết.` | `common.nhu_cau_lam_toc_tang_35_trong_` | Common |
| `ForecastRevenueTool.ts` | 31 | ForecastRevenueTool | `timeframe: Tháng $new Date().getMonth() + 1 + months,` | `common.timeframe_thang_new_date_getmo` | Common |
| `GenerateBusinessInsightsTool.ts` | 32 | GenerateBusinessInsightsTool | `Tăng trưởng Combo Gội đầu + Ủ tóc Keratin` | `common.tang_truong_combo_goi_dau_u_to` | Common |
| `GenerateBusinessInsightsTool.ts` | 33 | GenerateBusinessInsightsTool | `Khách hàng đặt Gội đầu dưỡng sinh có 65% nhu cầu mua thêm Combo Ủ Keratin.` | `common.khach_hang_dat_goi_dau_duong_s` | Common |
| `GenerateBusinessInsightsTool.ts` | 34 | GenerateBusinessInsightsTool | `Đề xuất nhân viên giới thiệu gói Combo giảm 15% khi thanh toán.` | `common.de_xuat_nhan_vien_gioi_thieu_g` | Common |
| `GenerateBusinessInsightsTool.ts` | 38 | GenerateBusinessInsightsTool | `Khung giờ thấp điểm 13:00 - 15:00 Ngày giữa tuần` | `common.khung_gio_thap_diem_13_00_15_0` | Common |
| `GenerateBusinessInsightsTool.ts` | 39 | GenerateBusinessInsightsTool | `Công suất ghế Salon chỉ đạt 30% từ Thứ 2 đến Thứ 4.` | `common.cong_suat_ghe_salon_chi_dat_30` | Common |
| `GenerateBusinessInsightsTool.ts` | 40 | GenerateBusinessInsightsTool | `Happy Hour giảm 25% làm tóc buổi trưa` | `common.happy_hour_giam_25_lam_toc_buo` | Common |
| `GenerateBusinessInsightsTool.ts` | 40 | GenerateBusinessInsightsTool | `Chạy ưu đãi "Happy Hour giảm 25% làm tóc buổi trưa" trên Zalo/SMS.` | `common.chay_uu_dai_happy_hour_giam_25` | Common |
| `AppointmentAgent.ts` | 74 | AppointmentAgent | `Tôi có thể giúp bạn đặt lịch hẹn, đổi lịch, hủy lịch, kiểm tra lịch trống nhân viên, check-in, check-out và quản lý danh sách chờ. Bạn cần tôi hỗ trợ việc gì?` | `appointment.toi_co_the_giup_ban_dat_lich_h` | Appointment |
| `AppointmentAgent.ts` | 77 | AppointmentAgent | `đặt` | `appointment.dat` | Appointment |
| `AppointmentAgent.ts` | 77 | AppointmentAgent | `tạo lịch` | `appointment.tao_lich` | Appointment |
| `AppointmentAgent.ts` | 77 | AppointmentAgent | `hẹn` | `appointment.hen` | Appointment |
| `AppointmentAgent.ts` | 79 | AppointmentAgent | `ngày` | `appointment.ngay` | Appointment |
| `AppointmentAgent.ts` | 80 | AppointmentAgent | `📅 **Dạ, để đặt lịch hẹn mới, vui lòng cho biết**:\n1. **Tên khách hàng**\n2. **Giờ hẹn & Ngày hẹn** (vd: 15:00 hôm nay)\n3. **Dịch vụ làm** (vd: Gội đầu dưỡng sinh)` | `appointment.da_de_dat_lich_hen_moi_vui_lon` | Appointment |
| `AppointmentAgent.ts` | 86 | AppointmentAgent | `Khách hàng` | `appointment.khach_hang` | Appointment |
| `AppointmentAgent.ts` | 91 | AppointmentAgent | `gội` | `appointment.goi` | Appointment |
| `AppointmentAgent.ts` | 91 | AppointmentAgent | `Gội đầu dưỡng sinh` | `appointment.goi_dau_duong_sinh` | Appointment |
| `AppointmentAgent.ts` | 91 | AppointmentAgent | `Cắt tạo kiểu` | `appointment.cat_tao_kieu` | Appointment |
| `AppointmentAgent.ts` | 99 | AppointmentAgent | `responseContent = 🎉 **Đã kiểm tra lịch trống & Đặt lịch thành công!**\n• **Khách hàng**: $nameClean\n• **Thời gian**: $formattedTime hôm nay ($dateStr)\n• **Nhân viên**: Minh Thu (Thợ chính - *Đã xác nhận không bị trùng lịch*);` | `appointment.responsecontent_da_kiem_tra_li` | Appointment |
| `AppointmentAgent.ts` | 101 | AppointmentAgent | `Không thể đặt lịch hẹn.` | `appointment.khong_the_dat_lich_hen` | Appointment |
| `examples.ts` | 20 | examples | `Đặt lịch hẹn cho Chị Hoa dịch vụ Gội đầu dưỡng sinh lúc 15:00 hôm nay với nhân viên Minh Thu` | `appointment.dat_lich_hen_cho_chi_hoa_dich_` | Appointment |
| `examples.ts` | 21 | examples | `🎉 **Đã kiểm tra hệ thống & Đặt lịch hẹn thành công!**\n• **Khách hàng**: Chị Hoa (0988123456)\n• **Thời gian**: 15:00 hôm nay (2026-07-22)\n• **Nhân viên**: Minh Thu (Thợ chính - *Không bị trùng lịch*)` | `appointment.da_kiem_tra_he_thong_dat_lich_` | Appointment |
| `examples.ts` | 24 | examples | `Chị Hoa` | `appointment.chi_hoa` | Appointment |
| `examples.ts` | 24 | examples | `Gội đầu dưỡng sinh` | `appointment.goi_dau_duong_sinh` | Appointment |
| `examples.ts` | 32 | examples | `Đổi lịch hẹn appt_501 của Chị Hoa sang 16:30 chiều nay` | `appointment.doi_lich_hen_appt_501_cua_chi_` | Appointment |
| `examples.ts` | 33 | examples | `✅ **Đã đổi lịch hẹn thành công**: Lịch hẹn appt_501 đã được cập nhật sang **16:30** chiều nay (Đã xác nhận thợ Minh Thu rảnh giờ này).` | `appointment.da_doi_lich_hen_thanh_cong_lic` | Appointment |
| `examples.ts` | 36 | examples | `Khách bận đột xuất` | `appointment.khach_ban_dot_xuat` | Appointment |
| `examples.ts` | 44 | examples | `Hủy lịch hẹn appt_501 do khách bận việc gia đình` | `appointment.huy_lich_hen_appt_501_do_khach` | Appointment |
| `examples.ts` | 45 | examples | `🚫 **Đã hủy lịch hẹn**: Khung giờ 16:30 của thợ Minh Thu đã được giải phóng trên hệ thống.` | `appointment.da_huy_lich_hen_khung_gio_16_3` | Appointment |
| `examples.ts` | 48 | examples | `Khách bận việc gia đình` | `appointment.khach_ban_viec_gia_dinh` | Appointment |
| `examples.ts` | 56 | examples | `Kiểm tra xem chiều nay lúc 14:00 có những nhân viên nào rảnh lịch?` | `appointment.kiem_tra_xem_chieu_nay_luc_14_` | Appointment |
| `examples.ts` | 57 | examples | `🔎 **Danh sách Nhân viên rảnh lịch lúc 14:00 hôm nay**:\n• **Minh Thu** (Thợ chính) - 🟢 Sẵn sàng\n• **Trần Văn B** (Thợ phụ) - 🟢 Sẵn sàng` | `appointment.danh_sach_nhan_vien_ranh_lich_` | Appointment |
| `examples.ts` | 68 | examples | `Thêm Chị Mai SĐT 0905123456 vào danh sách chờ khung giờ 15:00` | `appointment.them_chi_mai_sdt_0905123456_va` | Appointment |
| `examples.ts` | 69 | examples | `📝 **Đã ghi nhận vào Danh sách chờ**: Chị Mai (0905123456) sẽ được ưu tiên xếp lịch ngay khi có khách hủy lịch lúc 15:00.` | `appointment.da_ghi_nhan_vao_danh_sach_cho_` | Appointment |
| `examples.ts` | 72 | examples | `Chị Mai` | `appointment.chi_mai` | Appointment |
| `examples.ts` | 80 | examples | `Gửi tin nhắn nhắc lịch hẹn appt_501 qua Zalo cho khách hàng` | `appointment.gui_tin_nhan_nhac_lich_hen_app` | Appointment |
| `examples.ts` | 81 | examples | `📲 **Đã gửi tin nhắn nhắc lịch thành công** tới Zalo của khách hàng (SĐT: 0988123456).` | `appointment.da_gui_tin_nhan_nhac_lich_than` | Appointment |
| `examples.ts` | 92 | examples | `Check-in cho khách Chị Hoa lịch hẹn appt_501 đã tới salon` | `appointment.check_in_cho_khach_chi_hoa_lic` | Appointment |
| `examples.ts` | 93 | examples | `🟢 **Check-in thành công**: Lịch hẹn appt_501 đã cập nhật trạng thái **Checked-in** (Khách đã có mặt tại salon).` | `appointment.check_in_thanh_cong_lich_hen_a` | Appointment |
| `examples.ts` | 104 | examples | `Hoàn tất dịch vụ và check-out lịch hẹn appt_501 khách thanh toán chuyển khoản` | `appointment.hoan_tat_dich_vu_va_check_out_` | Appointment |
| `examples.ts` | 105 | examples | `✅ **Check-out thành công**: Đã cập nhật trạng thái lịch hẹn appt_501 thành **Hoàn tất (Completed)**.` | `appointment.check_out_thanh_cong_da_cap_nh` | Appointment |
| `BookAppointmentTool.ts` | 42 | BookAppointmentTool | `Minh Thu (Thợ chính)` | `appointment.minh_thu_tho_chinh` | Appointment |
| `BookAppointmentTool.ts` | 63 | BookAppointmentTool | `error: ⚠️ Double-booking conflict! Nhân viên $assignedStaff đã có lịch hẹn vào lúc $input.startTime ngày $input.date. Vui lòng chọn khung giờ khác: $altTimeStr.,` | `appointment.error_double_booking_conflict_` | Appointment |
| `BookAppointmentTool.ts` | 78 | BookAppointmentTool | `Tự động tạo bởi Appointment Agent (Đã kiểm tra lịch trống)` | `appointment.tu_dong_tao_boi_appointment_ag` | Appointment |
| `CancelAppointmentTool.ts` | 37 | CancelAppointmentTool | `note: Hủy lịch: $input.reason` | `appointment.note_huy_lich_input_reason` | Appointment |
| `CheckInTool.ts` | 36 | CheckInTool | `Khách đã có mặt tại Salon` | `appointment.khach_da_co_mat_tai_salon` | Appointment |
| `CheckOutTool.ts` | 37 | CheckOutTool | `Tiền mặt` | `appointment.tien_mat` | Appointment |
| `FindAvailableEmployeeTool.ts` | 64 | FindAvailableEmployeeTool | `Thợ chính` | `appointment.tho_chinh` | Appointment |
| `RescheduleAppointmentTool.ts` | 62 | RescheduleAppointmentTool | `error: ⚠️ Không thể đổi lịch! Khung giờ $input.newStartTime ngày $input.newDate đã có lịch trùng.,` | `appointment.error_khong_the_doi_lich_khung` | Appointment |
| `RescheduleAppointmentTool.ts` | 70 | RescheduleAppointmentTool | `Khách đổi giờ` | `appointment.khach_doi_gio` | Appointment |
| `WaitingListTool.ts` | 57 | WaitingListTool | `Khách` | `appointment.khach` | Appointment |
| `WaitingListTool.ts` | 61 | WaitingListTool | `Dịch vụ Salon` | `appointment.dich_vu_salon` | Appointment |
| `CashierAgent.ts` | 80 | CashierAgent | `Tôi có thể giúp bạn tạo hóa đơn, thêm dịch vụ/sản phẩm, áp dụng giảm giá/voucher, chia tiền thanh toán, hoàn tiền và in hóa đơn POS. Tất cả hành động liên quan tới tiền đều yêu cầu quản lý xác nhận!` | `common.toi_co_the_giup_ban_tao_hoa_do` | Common |
| `CashierAgent.ts` | 83 | CashierAgent | `tạo hóa đơn` | `common.tao_hoa_don` | Common |
| `CashierAgent.ts` | 83 | CashierAgent | `tính tiền` | `common.tinh_tien` | Common |
| `CashierAgent.ts` | 83 | CashierAgent | `báo giá` | `common.bao_gia` | Common |
| `CashierAgent.ts` | 84 | CashierAgent | `Khách vãng lai` | `common.khach_vang_lai` | Common |
| `CashierAgent.ts` | 94 | CashierAgent | `responseContent = 🧾 **Đã khởi tạo hóa đơn thu ngân mới**:\n• **Mã hóa đơn**: $inv.invoiceNumber\n• **Khách hàng**: $inv.customerName\n• **Trạng thái**: Bản nháp (Draft)\n\n⚠️ *Lưu ý*: Các thao tác thêm tiền/giảm giá sẽ gửi yêu cầu phê duyệt bảo mật trước khi thực thi.;` | `common.responsecontent_da_khoi_tao_ho` | Common |
| `CashierAgent.ts` | 96 | CashierAgent | `responseContent = ⚠️ Yêu cầu tạo hóa đơn đã gửi phê duyệt bảo mật tài chính.;` | `common.responsecontent_yeu_cau_tao_ho` | Common |

## 7. Recommendations Before Implementing i18n
1. **Standardize Core Action Keys**: Centralize basic keys like `common.save`, `common.cancel`, `common.delete`, and `common.edit` to prevent redundant duplicate translation definitions.
2. **Address Text Concatenation**: Avoid patterns like `"Chọn " + item.name`. Instead, define placeholders in translation files (e.g., `"Select {name}"`) and pass options to the `t()` function.
3. **Move Module Constants Inside Components**: Avoid defining static arrays (like tabs, menu structures) outside React component lifecycles. Wrap them in `useMemo` and invoke `t()` inside the component so language updates propagate immediately without page refresh.
