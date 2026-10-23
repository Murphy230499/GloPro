/**
 * socialChatAiService.js
 * Client helper service to communicate with GloPro Social Chat AI Engine
 * Supports translation, smart booking extraction, suggestions, and auto-pilot replies.
 */

export async function callSocialChatAi(action, payload = {}) {
  try {
    const res = await fetch('/api/social-chat/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });

    if (!res.ok) {
      throw new Error(`SocialChat AI error: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[socialChatAiService] Error in action ${action}:`, err);
    throw err;
  }
}

/**
 * 1. Dịch tin nhắn song ngữ 2 chiều (Silent or on-demand)
 */
export async function translateMessage({ text, sourceLang = 'vi', targetLang = 'ja' }) {
  if (!text || !text.trim()) return { translatedText: text };
  try {
    const res = await callSocialChatAi('translate', { text, sourceLang, targetLang });
    return res;
  } catch (err) {
    return { translatedText: text, isFallback: true };
  }
}

/**
 * 2. Lấy 3 gợi ý trả lời thông minh dựa trên ngữ cảnh
 */
export async function getReplySuggestions({ conversation, services = [], staff = [], currentDraft = {} }) {
  try {
    const res = await callSocialChatAi('suggest_replies', {
      conversation,
      services,
      staff,
      currentDraft
    });
    return res.suggestions || [];
  } catch (err) {
    return [
      {
        id: 'sug-default-1',
        intent: 'service_advice',
        textVi: 'Dạ bên em có dầu gội tím khử vàng Olaplex No.4P chuyên dùng giữ màu khói chuẩn bền ạ.',
        textJa: '当店ではスモーキーカラーの色持ちを保つオラプレックスNo.4P紫シャンプーをご用意しております。'
      },
      {
        id: 'sug-default-2',
        intent: 'time_proposal',
        textVi: 'Dạ stylist Ken có khung giờ trống lúc 14:00 và 16:30 chiều mai, chị chọn giờ nào tiện nhất ạ?',
        textJa: 'スタイリストKenは明日14:00と16:30にご案内可能です。どちらのお時間がよろしいでしょうか？'
      },
      {
        id: 'sug-default-3',
        intent: 'booking_confirm',
        textVi: 'Dạ em xin phép giữ chỗ khung giờ này cho chị nhé ạ!',
        textJa: 'かしこまりました。それではこちらのお時間でお席を仮押さえいたします。'
      }
    ];
  }
}

/**
 * 3. Trích xuất phiếu đặt lịch và khớp với dữ liệu thực tế
 */
export async function extractBookingDraft({ conversation, services = [], staff = [], currentDraft = {} }) {
  try {
    const res = await callSocialChatAi('extract_booking', {
      conversation,
      services,
      staff,
      currentDraft
    });
    return res;
  } catch (err) {
    return {
      success: false,
      draft: currentDraft,
      leadScore: conversation?.leadScore || 55
    };
  }
}

/**
 * 4. Tạo phản hồi tự động AI Auto-Pilot
 */
export async function getAutoReply({ conversation, services = [], staff = [] }) {
  try {
    const res = await callSocialChatAi('auto_reply', {
      conversation,
      services,
      staff
    });
    return res;
  } catch (err) {
    return {
      replyText: 'ご質問ありがとうございます！明日午後のご予約はいかがでしょうか？スタイリストKenも対応可能です。',
      replyTextVi: 'Dạ cảm ơn bạn đã quan tâm! Bạn có muốn đặt lịch vào chiều mai không ạ? Stylist Ken bên mình vẫn còn chỗ trống nhé.',
      leadScore: 85
    };
  }
}
