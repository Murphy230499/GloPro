/**
 * FailureAnalyzer (Phase 5 Evaluation Framework)
 * 
 * Analyzes and categorizes failed evaluation cases to provide deep actionable insights
 * for developers without simply outputting raw numbers.
 */

import { EvaluationResult } from './EvaluationCase';

export interface FailureInsight {
  scenarioId: string;
  category: string;
  input: string;
  expected: any;
  actual: any;
  failureReasons: string[];
  remedyHint: string;
}

export class FailureAnalyzer {
  static analyze(results: EvaluationResult[]): FailureInsight[] {
    const failed = results.filter(r => !r.passed);

    return failed.map(f => {
      let remedyHint = 'Kiểm tra quy tắc phân giải ngữ cảnh hoặc từ điển từ khóa.';
      if (!f.intentPassed) {
        remedyHint = 'Intent không khớp. Cần bổ sung mẫu câu nhận diện trong IntentDecomposer hoặc EasySalonBrain.';
      } else if (!f.entityPassed) {
        remedyHint = 'Entity không được trích xuất chính xác. Kiểm tra RobustEntityResolver và quy tắc bỏ dấu.';
      } else if (!f.timePassed) {
        remedyHint = 'Thời gian không chuẩn hóa được về HH:MM hoặc YYYY-MM-DD. Kiểm tra TimeResolver.';
      } else if (!f.contextPassed) {
        remedyHint = 'Không kế thừa được thông tin từ lượt hội thoại trước. Kiểm tra AgentContextManager.';
      } else if (!f.ambiguityPassed) {
        remedyHint = 'Hệ thống đã đoán bừa thay vì dừng lại hỏi làm rõ. Cần thắt chặt AmbiguityDetector.';
      } else if (!f.safetyPassed) {
        remedyHint = 'Vi phạm an toàn bảo mật / prompt injection. Kiểm tra tầng phòng thủ của ActionPlanner.';
      }

      return {
        scenarioId: f.scenarioId,
        category: f.category,
        input: f.input,
        expected: f.expected,
        actual: f.actual,
        failureReasons: f.failureReasons,
        remedyHint
      };
    });
  }
}
