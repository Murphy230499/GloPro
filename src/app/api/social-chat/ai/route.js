import { NextResponse } from 'next/server';

// Candidate models in order of stability and quota availability
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash'
];

/**
 * Call Google Gemini REST API with candidate models and timeout
 */
async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (jsonMode) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
  }

  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      if (data.error) {
        lastError = new Error(`[${model}] ${data.error.message}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

/**
 * Fallback translation using salon domain glossary
 */
function localTranslate(text, targetLang) {
  const dictViToJa = {
    'xin chào': 'こんにちは',
    'chào bạn': 'こんにちは',
    'chào chị': 'こんにちは',
    'dạ': 'はい',
    'nhuộm tóc': 'ヘアカラー',
    'nhuộm': 'ヘアカラー',
    'màu khói': 'スモーキーカラー',
    'dầu gội': 'シャンプー',
    'dầu gội tím': '紫シャンプー',
    'giá bao nhiêu': '料金はおいくらですか？',
    'bảng giá': '料金表',
    'đặt lịch': 'ご予約',
    'cắt tóc': 'ヘアカット',
    'hấp dầu': 'トリートメント',
    'phục hồi': '髪質改善トリートメント',
    'uốn tóc': 'パーマ',
    'gội đầu': 'ヘッドスパ・シャンプー',
    'stylist': 'スタイリスト',
    'mai': '明日',
    'hôm nay': '本日',
    'chiều': '午後',
    'sáng': '午前',
    'được ạ': 'かしこまりました',
    'cảm ơn': 'ありがとうございます'
  };

  const dictJaToVi = {
    'こんにちは': 'Xin chào',
    'ヘアカラー': 'Nhuộm tóc',
    'スモーキーカラー': 'Màu khói',
    '紫シャンプー': 'Dầu gội tím khử vàng',
    'シャンプー': 'Dầu gội',
    '予約': 'Đặt lịch hẹn',
    'ヘアカット': 'Cắt tóc',
    'トリートメント': 'Hấp phục hồi',
    'パーマ': 'Uốn tóc',
    'ありがとうございます': 'Xin cảm ơn bạn',
    'かしこまりました': 'Dạ vâng được ạ'
  };

  if (targetLang === 'ja') {
    let res = text;
    for (const [vi, ja] of Object.entries(dictViToJa)) {
      if (res.toLowerCase().includes(vi)) {
        res = res.replace(new RegExp(vi, 'gi'), ja);
      }
    }
    return `[Dịch AI] ${res}`;
  } else {
    let res = text;
    for (const [ja, vi] of Object.entries(dictJaToVi)) {
      if (res.includes(ja)) {
        res = res.replace(new RegExp(ja, 'g'), vi);
      }
    }
    return `[Bản dịch] ${res}`;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, text, sourceLang, targetLang, conversation, services = [], staff = [], currentDraft = {} } = body;

    // 1. DỊCH THUẬT SONG NGỮ CHUẨN SALON (Translation)
    if (action === 'translate') {
      const src = sourceLang || 'vi';
      const tgt = targetLang || 'ja';

      const systemInstruction = `You are an elite bilingual translation assistant for a high-end luxury salon & spa (GloPro).
Translate accurately, politely, and naturally between Vietnamese, Japanese, English, Korean, and Chinese.
Use authentic professional salon terminology (e.g. "Hair color" = "ヘアカラー", "Ash blonde/grey" = "スモーキーアッシュ", "Purple toner shampoo" = "紫シャンプー", "Olaplex deep treatment" = "オラプレックス集中トリートメント", "Stylist appointment" = "スタイリスト指名予約").
Only return the translation text itself without any markdown quotes or meta explanations.`;

      const prompt = `Translate the following text from ${src} to ${tgt}:\n"${text}"`;

      try {
        const translated = await callGemini(prompt, systemInstruction, false);
        return NextResponse.json({
          success: true,
          translatedText: translated.trim().replace(/^["']|["']$/g, ''),
          sourceLang: src,
          targetLang: tgt
        });
      } catch (err) {
        console.warn('[SocialChat AI] Translate fallback used:', err.message);
        return NextResponse.json({
          success: true,
          translatedText: localTranslate(text, tgt),
          sourceLang: src,
          targetLang: tgt,
          isFallback: true
        });
      }
    }

    // 2. GỢI Ý CÂU TRẢ LỜI THÔNG MINH (3 Smart Reply Suggestions)
    if (action === 'suggest_replies') {
      const messages = conversation?.messages || [];
      const recentCustomerMsgs = messages
        .filter(m => m.senderType === 'customer')
        .slice(-3)
        .map(m => m.contentVi || m.contentJa)
        .join(' | ');

      const serviceNames = (services.length > 0 ? services : [
        { name: 'Nhuộm màu khói / Ash Color', price: 850000 },
        { name: 'Hấp phục hồi Olaplex chuyên sâu', price: 850000 },
        { name: 'Cắt tóc tạo kiểu Stylist Ken', price: 350000 },
        { name: 'Gội đầu dưỡng sinh thảo dược', price: 250000 }
      ]).map(s => `${s.name} (${Number(s.price || 0).toLocaleString()}đ)`).join(', ');

      const staffNames = (staff.length > 0 ? staff : [
        { name: 'Ken Trấn (Top Stylist)' },
        { name: 'Mika Vũ (Color Specialist)' },
        { name: 'Bảo Linh (Senior KTV)' }
      ]).map(st => st.name).join(', ');

      const systemInstruction = `You are GloPro AI Concierge for a luxury salon.
Analyze the customer's chat and generate exactly 3 contextual, polite, and persuasive quick reply suggestions for the receptionist.
Rules:
1. Suggestion 1: Answering service details / product advice with salon expertise.
2. Suggestion 2: Checking availability / proposing available time slots.
3. Suggestion 3: Confirming price or polite call-to-action to secure the booking.
Provide both Vietnamese (textVi) and Japanese (textJa) for each suggestion.
Output MUST be a strict JSON array with 3 objects:
[
  { "id": "sug-1", "intent": "service_advice", "textVi": "...", "textJa": "..." },
  { "id": "sug-2", "intent": "time_proposal", "textVi": "...", "textJa": "..." },
  { "id": "sug-3", "intent": "booking_confirm", "textVi": "...", "textJa": "..." }
]`;

      const prompt = `Customer name: ${conversation?.customerName || 'Khách hàng'}
Recent customer chat: "${recentCustomerMsgs || 'Khách đang hỏi dịch vụ'}"
Current draft info: Service="${currentDraft?.serviceName || 'Chưa rõ'}", Stylist="${currentDraft?.stylist || 'Chưa chọn'}", Date="${currentDraft?.date || 'Chưa rõ'}", Time="${currentDraft?.time || 'Chưa rõ'}"
Salon services: ${serviceNames}
Salon stylists: ${staffNames}

Generate 3 smart suggestions now.`;

      try {
        const jsonStr = await callGemini(prompt, systemInstruction, true);
        const parsed = JSON.parse(jsonStr);
        const suggestions = Array.isArray(parsed) ? parsed : (parsed.suggestions || []);
        return NextResponse.json({
          success: true,
          suggestions
        });
      } catch (err) {
        console.warn('[SocialChat AI] Suggest replies fallback used:', err.message);
        // Fallback intelligent suggestions
        return NextResponse.json({
          success: true,
          suggestions: [
            {
              id: 'sug-fallback-1',
              intent: 'service_advice',
              textVi: 'Dạ bên em có dầu gội tím khử vàng Olaplex No.4P chuyên dùng giữ màu khói chuẩn bền ạ.',
              textJa: '当店ではスモーキーカラーの色持ちを保つオラプレックスNo.4P紫シャンプーをご用意しております。'
            },
            {
              id: 'sug-fallback-2',
              intent: 'time_proposal',
              textVi: 'Dạ stylist Ken có khung giờ trống lúc 14:00 và 16:30 chiều mai, chị chọn giờ nào tiện nhất ạ?',
              textJa: 'スタイリストKenは明日14:00と16:30にご案内可能です。どちらのお時間がよろしいでしょうか？'
            },
            {
              id: 'sug-fallback-3',
              intent: 'booking_confirm',
              textVi: 'Dạ em xin phép giữ chỗ khung giờ này cho chị nhé ạ!',
              textJa: 'かしこまりました。それではこちらのお時間でお席を仮押さえいたします。'
            }
          ],
          isFallback: true
        });
      }
    }

    // 3. TRÍCH XUẤT LỊCH HẸN & KHỚP CƠ SỞ DỮ LIỆU (Smart Booking Draft Extraction)
    if (action === 'extract_booking') {
      const messages = conversation?.messages || [];
      const chatHistory = messages
        .map(m => `${m.senderType === 'customer' ? 'Customer' : 'Staff'}: ${m.contentVi || m.contentJa}`)
        .join('\n');

      const serviceListSummary = (services.length > 0 ? services : [
        { id: 'srv-1', name: 'Nhuộm tóc (Hair Color) chuyên sâu', price: 850000, duration: 90 },
        { id: 'srv-2', name: 'Hấp phục hồi Olaplex chuyên sâu', price: 850000, duration: 60 },
        { id: 'srv-3', name: 'Cắt tóc tạo kiểu Stylist Ken', price: 350000, duration: 45 },
        { id: 'srv-4', name: 'Uốn tóc phục hồi Setting', price: 1200000, duration: 120 }
      ]).map(s => ({ id: s.id, name: s.name, price: s.price || 0, duration: s.duration || 60 }));

      const staffListSummary = (staff.length > 0 ? staff : [
        { id: 'stf-1', name: 'Ken Trấn' },
        { id: 'stf-2', name: 'Mika Vũ' },
        { id: 'stf-3', name: 'Bảo Linh' }
      ]).map(st => ({ id: st.id, name: st.name }));

      const systemInstruction = `You are the GloPro AI Booking Extraction Engine.
Analyze the customer's chat history to extract structured appointment details and MATCH them against the salon's actual database entities.
Entities matching rules:
1. Match customer intent to the closest real service in the provided Service List (return matched serviceId, serviceName, servicePrice, durationMinutes).
2. Match requested stylist to the closest real staff in the provided Staff List (return matched staffId, stylist).
3. Extract date and time.
4. If time is missing or vague, identify missingInfo (e.g. "Cần hỏi giờ hẹn cụ thể").
5. Calculate leadScore (55 = just exploring, 80 = selected service/date, 100 = confirmed time and service).
Output MUST be strict JSON:
{
  "serviceId": "...",
  "serviceName": "...",
  "servicePrice": 850000,
  "durationMinutes": 60,
  "staffId": "...",
  "stylist": "...",
  "branch": "GloPro Flagship Salon",
  "date": "...",
  "time": "...",
  "missingInfo": "...",
  "isComplete": true/false,
  "leadScore": 80,
  "detectedLanguage": "ja"
}`;

      const prompt = `Chat History:\n${chatHistory}\n\nAvailable Services:\n${JSON.stringify(serviceListSummary)}\n\nAvailable Staff:\n${JSON.stringify(staffListSummary)}\n\nCurrent Draft:\n${JSON.stringify(currentDraft)}\n\nExtract and match appointment draft in JSON.`;

      try {
        const jsonStr = await callGemini(prompt, systemInstruction, true);
        const parsedDraft = JSON.parse(jsonStr);

        return NextResponse.json({
          success: true,
          draft: {
            customerName: currentDraft.customerName || conversation?.customerName,
            phone: currentDraft.phone || conversation?.phone,
            ...parsedDraft
          },
          leadScore: parsedDraft.leadScore || 80,
          detectedLanguage: parsedDraft.detectedLanguage || 'ja'
        });
      } catch (err) {
        console.warn('[SocialChat AI] Extract booking fallback used:', err.message);
        // Intelligent heuristics fallback
        let matchedService = serviceListSummary[0];
        const lowerChat = chatHistory.toLowerCase();
        if (lowerChat.includes('olaplex') || lowerChat.includes('hấp') || lowerChat.includes('phục hồi')) {
          matchedService = serviceListSummary.find(s => s.name.toLowerCase().includes('olaplex')) || serviceListSummary[1];
        } else if (lowerChat.includes('nhuộm') || lowerChat.includes('màu') || lowerChat.includes('color')) {
          matchedService = serviceListSummary.find(s => s.name.toLowerCase().includes('nhuộm')) || serviceListSummary[0];
        }

        let matchedStaff = staffListSummary[0];
        if (lowerChat.includes('ken')) matchedStaff = staffListSummary.find(s => s.name.toLowerCase().includes('ken')) || staffListSummary[0];
        else if (lowerChat.includes('mika')) matchedStaff = staffListSummary.find(s => s.name.toLowerCase().includes('mika')) || staffListSummary[1];

        const hasTime = /\b(\d{1,2}[:h]\d{0,2})\b/.test(lowerChat);
        const leadScore = hasTime ? 100 : 80;

        return NextResponse.json({
          success: true,
          draft: {
            customerName: currentDraft.customerName || conversation?.customerName || 'Khách hàng',
            phone: currentDraft.phone || conversation?.phone || '',
            serviceId: matchedService?.id,
            serviceName: matchedService?.name || 'Hấp phục hồi Olaplex chuyên sâu',
            servicePrice: matchedService?.price || 850000,
            durationMinutes: matchedService?.duration || 60,
            staffId: matchedStaff?.id,
            stylist: matchedStaff?.name || 'Ken Trấn',
            branch: 'GloPro Flagship Salon',
            date: currentDraft.date || 'Chiều mai (24/10)',
            time: hasTime ? '14:30' : 'Chưa rõ (cần xác nhận)',
            missingInfo: hasTime ? '' : 'Cần xác nhận giờ cụ thể',
            isComplete: hasTime
          },
          leadScore,
          detectedLanguage: 'ja',
          isFallback: true
        });
      }
    }

    // 4. AI AUTO-PILOT TRẢ LỜI TỰ ĐỘNG (Auto-Reply)
    if (action === 'auto_reply') {
      const messages = conversation?.messages || [];
      const lastCustomerMsg = messages.filter(m => m.senderType === 'customer').slice(-1)[0];
      const customerText = lastCustomerMsg ? (lastCustomerMsg.contentJa || lastCustomerMsg.contentVi) : '';

      const systemInstruction = `You are GloPro AI Concierge, acting as the friendly, courteous Japanese/English/Vietnamese receptionist of a premier salon.
Respond directly to the customer's last message.
Keep it warm, polite, professional, concise, and guiding them to secure an appointment.
Return a JSON object with:
{
  "replyText": "...", // In customer's language (e.g. Japanese)
  "replyTextVi": "...", // In Vietnamese for staff to understand
  "leadScore": 85,
  "missingInfo": "Cần hỏi thêm..."
}`;

      const prompt = `Customer said: "${customerText}"\nCustomer Name: ${conversation?.customerName}\nRespond politely now in JSON.`;

      try {
        const jsonStr = await callGemini(prompt, systemInstruction, true);
        const parsed = JSON.parse(jsonStr);
        return NextResponse.json({
          success: true,
          ...parsed
        });
      } catch (err) {
        return NextResponse.json({
          success: true,
          replyText: 'ご質問ありがとうございます！明日午後のご予約はいかがでしょうか？スタイリストKenも対応可能です。',
          replyTextVi: 'Dạ cảm ơn bạn đã quan tâm! Bạn có muốn đặt lịch vào chiều mai không ạ? Stylist Ken bên mình vẫn còn chỗ trống nhé.',
          leadScore: 85,
          isFallback: true
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (globalErr) {
    console.error('[SocialChat AI API Error]:', globalErr);
    return NextResponse.json({ error: globalErr.message }, { status: 500 });
  }
}
