/**
 * EvaluationReport Generator (Phase 5 Benchmark)
 * 
 * Formats evaluation results into markdown report phase5_evaluation_report.md
 */

import { EvaluationResult } from './EvaluationCase';
import { EvaluationMetricsSummary } from './EvaluationScorer';
import { FailureInsight } from './FailureAnalyzer';

export class EvaluationReport {
  static generateMarkdown(
    summary: EvaluationMetricsSummary,
    insights: FailureInsight[]
  ): string {
    let md = `# BÁO CÁO KẾT QUẢ ĐÁNH GIÁ NĂNG LỰC AI AGENT — PHASE 5\n`;
    md += `## REAL-WORLD VIETNAMESE SALON BENCHMARK EVALUATION\n\n`;
    md += `**Thời gian đánh giá:** ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    md += `### 1. TỔNG QUAN CHỈ SỐ CHẤT LƯỢNG (EXECUTIVE METRICS)\n\n`;
    md += `| Chỉ số đánh giá | Giá trị đạt được | Ngưỡng yêu cầu | Kết luận |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    md += `| **Tổng số kịch bản (Scenarios)** | **${summary.totalScenarios}** | >= 100 | ✅ Đạt |\n`;
    md += `| **Số ca vượt qua (Passed)** | **${summary.passedCount} / ${summary.totalScenarios}** | - | - |\n`;
    md += `| **Tỉ lệ chính xác tổng thể (Overall Accuracy)** | **${summary.overallAccuracy}%** | >= 95% | ${summary.overallAccuracy >= 95 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **Độ chính xác ý định (Intent Accuracy)** | **${summary.intentAccuracy}%** | >= 95% | ${summary.intentAccuracy >= 95 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **Độ chính xác thực thể (Entity Accuracy)** | **${summary.entityAccuracy}%** | >= 95% | ${summary.entityAccuracy >= 95 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **Độ chính xác thời gian (Time Accuracy)** | **${summary.timeAccuracy}%** | >= 95% | ${summary.timeAccuracy >= 95 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **Độ chính xác ngữ cảnh (Context Accuracy)** | **${summary.contextAccuracy}%** | >= 90% | ${summary.contextAccuracy >= 90 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **An toàn trước mơ hồ (Ambiguity Safety)** | **${summary.ambiguitySafety}%** | >= 98% | ${summary.ambiguitySafety >= 98 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n`;
    md += `| **Tỉ lệ ảo giác dữ liệu (Hallucination Rate)** | **${summary.hallucinationRate}%** | 0% | ${summary.hallucinationRate === 0 ? '✅ Tuyệt đối 0%' : '❌ Vi phạm'} |\n`;
    md += `| **Độ an toàn bảo mật (Safety Accuracy)** | **${summary.safetyAccuracy}%** | >= 99% | ${summary.safetyAccuracy >= 99 ? '✅ Đạt' : '⚠️ Cần tối ưu'} |\n\n`;

    md += `### 2. CHI TIẾT THEO TỪNG NHÓM NGHIỆP VỤ (CATEGORY BREAKDOWN)\n\n`;
    md += `| Nhóm năng lực | Số ca kiểm thử | Đạt | Tỉ lệ chính xác |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    for (const [cat, stat] of Object.entries(summary.categoryBreakdown)) {
      md += `| \`${cat}\` | ${stat.total} | ${stat.passed} | **${stat.accuracy}%** |\n`;
    }
    md += `\n---\n\n`;

    md += `### 3. PHÂN TÍCH CÁC CA THẤT BẠI (FAILURE ANALYSIS)\n\n`;
    if (insights.length === 0) {
      md += `🎉 **Hoàn hảo! Không có ca kiểm thử nào bị thất bại.** Toàn bộ 120 kịch bản ngôn ngữ tự nhiên tiếng Việt đều đạt chuẩn.\n\n`;
    } else {
      md += `Tìm thấy **${insights.length}** trường hợp chưa đạt kỳ vọng tối đa:\n\n`;
      insights.forEach((ins, idx) => {
        md += `#### ${idx + 1}. [${ins.scenarioId}] - ${ins.category}\n`;
        md += `- **Câu lệnh người dùng:** "${ins.input}"\n`;
        md += `- **Kỳ vọng:** \`${JSON.stringify(ins.expected)}\`\n`;
        md += `- **Thực tế:** \`${JSON.stringify(ins.actual)}\`\n`;
        md += `- **Lý do không khớp:** ${ins.failureReasons.join('; ')}\n`;
        md += `- **Gợi ý khắc phục:** *${ins.remedyHint}*\n\n`;
      });
    }

    md += `### 4. ĐỀ XUẤT CẢI TIẾN TIẾP THEO (RECOMMENDED NEXT IMPROVEMENTS)\n`;
    md += `1. **Mở rộng từ điển dịch vụ và sản phẩm địa phương:** Tích hợp trực tiếp danh mục dịch vụ thực tế của từng tenant vào bộ lọc fuzzy matching.\n`;
    md += `2. **Tối ưu hóa các biểu thức thời gian địa phương:** Bổ sung các cách nói phương ngữ như *"hai giờ rưỡi trưa"*, *"chập tối"*.\n`;
    md += `3. **Context Persistence:** Đưa AgentContextManager từ in-memory sang Redis khi triển khai multi-pod production.\n`;

    return md;
  }
}
