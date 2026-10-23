/**
 * mockSocialData.js
 * Dữ liệu mẫu chuẩn hóa cho phân hệ GloPro Social Chat & AI Concierge
 * Hỗ trợ 5 kênh mạng xã hội: Zalo OA, Facebook Messenger, WhatsApp, Instagram, Telegram
 * Tích hợp dữ liệu song ngữ (Tiếng Nhật / Tiếng Việt), điểm số chốt lịch và phiếu nháp đặt lịch thông minh.
 */

export const SOCIAL_CHANNELS = [
  { id: 'all', label: 'Tất cả', icon: 'MessagesSquare', color: '#64748B' },
  { id: 'zalo', label: 'Zalo OA', icon: 'MessageCircle', color: '#0068FF' },
  { id: 'facebook', label: 'Facebook', icon: 'Facebook', color: '#1877F2' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'PhoneCall', color: '#25D366' },
  { id: 'instagram', label: 'Instagram', icon: 'Instagram', color: '#E4405F' },
  { id: 'telegram', label: 'Telegram', icon: 'Send', color: '#229ED9' }
];

export const INITIAL_CONVERSATIONS = [
  {
    id: 'conv-1',
    channel: 'zalo',
    channelLabel: 'ZL: 0901 111 222',
    customerName: 'Thảo Lý',
    phone: '0901 111 222',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    lastMessageTime: '19:05',
    unreadCount: 0,
    leadScore: 100, // 100% 予約見込み
    status: 'ai_handled',
    tags: [
      { id: 'bookable', label: 'Có thể đặt lịch', labelJa: '予約可能', color: 'emerald' },
      { id: 'appointment', label: 'Lịch hẹn', labelJa: '予約', color: 'slate' }
    ],
    lastMessage: 'Nếu được em muốn stylist Ken làm giúp em ạ.',
    lastMessageJa: '可能でしたら、スタイリストのKenにお願いしたいです。',
    language: 'ja',
    // Phiếu nháp lịch hẹn do AI trích xuất
    bookingDraft: {
      customerName: 'Thảo Lý',
      phone: '0901 111 222',
      serviceName: 'Hair Color (Nhuộm tóc)',
      serviceCategory: 'Nhuộm màu tự nhiên',
      servicePrice: 850000,
      durationMinutes: 90,
      date: 'Thứ Hai tuần tới (Next Monday)',
      time: 'Chưa rõ (不明)',
      stylist: 'Ken Trấn',
      branch: 'GloPro Flagship Salon',
      missingInfo: 'Cần hỏi giờ cụ thể (具体的な時間)',
      isComplete: false
    },
    crmProfile: {
      tier: 'Hạng Vàng',
      totalSpent: 4850000,
      visitCount: 6,
      lastVisit: '18/09/2026',
      notes: 'Khách thích tone nâu tự nhiên, ưu tiên Ken Trấn, da đầu hơi nhạy cảm.'
    },
    messages: [
      {
        id: 'msg-1-1',
        senderType: 'customer',
        senderName: 'Thảo Lý',
        time: '19:00',
        contentVi: 'Em muốn đặt lịch nhuộm màu nâu tự nhiên tuần sau.',
        contentJa: '来週、ナチュラルブラウンにカラーの予約をしたいです。',
        isInternal: false
      },
      {
        id: 'msg-1-2',
        senderType: 'ai',
        senderName: 'AI Assistant',
        time: '19:01',
        contentVi: 'Dạ chị Thảo Lý ơi, em đang kiểm tra lịch nhuộm màu cho chị.',
        contentJa: 'Thảo Lýさん、カラーの予約スケジュールを確認しております。',
        isInternal: false,
        statusNote: 'Đã lưu (保存済み)'
      },
      {
        id: 'msg-1-3',
        senderType: 'staff',
        senderName: 'Lễ tân Ngọc Mai',
        time: '19:03',
        contentVi: 'Khách thích tone nâu tự nhiên, ưu tiên Ken Trấn.',
        contentJa: 'お客様は自然なブラウン系のトーンがお好みで、Ken Trấnを優先希望です。',
        isInternal: true // GHI CHÚ NỘI BỘ VÀNG (内部メモ)
      },
      {
        id: 'msg-1-4',
        senderType: 'customer',
        senderName: 'Thảo Lý',
        time: '19:05',
        contentVi: 'Nếu được em muốn stylist Ken làm giúp em ạ.',
        contentJa: '可能でしたら、スタイリストのKenにお願いしたいです。',
        isInternal: false
      }
    ],
    aiSuggestions: [
      {
        id: 'sug-1',
        textVi: 'Dạ chị Thảo Lý muốn làm vào khung giờ sáng hay chiều Thứ Hai để em giữ chỗ Ken Trấn cho chị ạ?',
        textJa: 'Thảo Lý様、月曜日の午前と午後のどちらの時間帯がよろしいでしょうか？Kenスタイリスト枠を確保いたします。'
      },
      {
        id: 'sug-2',
        textVi: 'Dạ hiện Thứ Hai stylist Ken còn trống lúc 10:30 sáng và 15:00 chiều, chị chọn khung giờ nào tiện hơn ạ?',
        textJa: '月曜日のKenスタイリストの空きは午前10:30または午後15:00となっております。どちらがよろしいでしょうか？'
      },
      {
        id: 'sug-3',
        textVi: 'Dạ gói nhuộm tone nâu tự nhiên đang có ưu đãi tặng kèm hấp phục hồi collagen, chị ghé làm luôn nhé ạ!',
        textJa: 'ナチュラルブラウンカラーには現在コラーゲントリートメントの特典が付いております。ぜひお越しくださいませ！'
      }
    ]
  },
  {
    id: 'conv-2',
    channel: 'whatsapp',
    channelLabel: 'WA: 0902 222 333',
    customerName: 'Hằng Dương',
    phone: '0902 222 333',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastMessageTime: '18:40',
    unreadCount: 1,
    leadScore: 80, // 80% 予約見込み
    status: 'ai_handled',
    tags: [
      { id: 'ai_replied', label: 'AI đã phản hồi', labelJa: 'AI返信済み', color: 'blue' },
      { id: 'price_check', label: 'Xác nhận giá', labelJa: '料金確認', color: 'slate' }
    ],
    lastMessage: 'Nếu bạn có nhu cầu, chúng tôi có thể đảm bảo lịch tư vấn trong tuần này.',
    lastMessageJa: 'ご希望でしたら、今週のカウンセリングの予約を確保できます。',
    language: 'ja',
    bookingDraft: {
      customerName: 'Hằng Dương',
      phone: '0902 222 333',
      serviceName: 'Uốn sóng lơi Hàn Quốc & Phục hồi',
      serviceCategory: 'Uốn tóc cao cấp',
      servicePrice: 1200000,
      durationMinutes: 120,
      date: 'Cuối tuần này (Thứ 7)',
      time: '14:30',
      stylist: 'Chưa chọn',
      branch: 'GloPro Flagship Salon',
      missingInfo: 'Chưa chọn Stylist',
      isComplete: false
    },
    crmProfile: {
      tier: 'Khách Mới',
      totalSpent: 0,
      visitCount: 0,
      lastVisit: 'Chưa có',
      notes: 'Khách hỏi dịch vụ uốn sóng lơi qua WhatsApp, quan tâm chất lượng thuốc hữu cơ.'
    },
    messages: [
      {
        id: 'msg-2-1',
        senderType: 'customer',
        senderName: 'Hằng Dương',
        time: '18:35',
        contentVi: 'Bên mình có gói uốn sóng lơi kèm dưỡng tóc không em? Giá khoảng bao nhiêu vậy?',
        contentJa: 'トリートメント付きの韓国風ウェーブパーマはありますか？料金はどのくらいですか？',
        isInternal: false
      },
      {
        id: 'msg-2-2',
        senderType: 'ai',
        senderName: 'AI Assistant',
        time: '18:40',
        contentVi: 'Dạ bên em có gói Uốn sóng lơi Collagen hữu cơ trọn gói 1.200.000đ. Nếu chị tiện, em có thể giữ lịch tư vấn và tạo kiểu cho chị trong tuần này ạ.',
        contentJa: 'オーガニックコラーゲンウェーブパーマのパッケージは1,200,000VNDです。ご希望でしたら、今週のカウンセリングの予約を確保できます。',
        isInternal: false
      }
    ],
    aiSuggestions: [
      {
        id: 'sug-2-1',
        textVi: 'Dạ chị Hằng Dương muốn đặt lịch vào Thứ Bảy hay Chủ Nhật tuần này ạ?',
        textJa: 'Hằng様、今週の土曜日と日曜日のどちらでご予約をご希望でしょうか？'
      }
    ]
  },
  {
    id: 'conv-3',
    channel: 'facebook',
    channelLabel: 'FB: Loan Tập',
    customerName: 'Loan Tập',
    phone: '0903 333 444',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    lastMessageTime: '17:55',
    unreadCount: 2,
    leadScore: 100, // 100%
    status: 'needs_human',
    tags: [
      { id: 'needs_human', label: 'Cần người tiếp nhận', labelJa: '有人対応', color: 'amber' },
      { id: 'appointment', label: 'Lịch hẹn', labelJa: '予約', color: 'slate' }
    ],
    lastMessage: 'Hôm nay buổi chiều các lịch khá kín, muốn nhân viên thật xác nhận giúp.',
    lastMessageJa: '今日は午後の予約が詰まっているので、実際の人に確認してほしいです。',
    language: 'ja',
    bookingDraft: {
      customerName: 'Loan Tập',
      phone: '0903 333 444',
      serviceName: 'Cắt tóc nữ & Gội đầu thảo dược',
      serviceCategory: 'Cắt gội',
      servicePrice: 350000,
      durationMinutes: 60,
      date: 'Hôm nay (Today)',
      time: '18:15',
      stylist: 'Stylist bất kỳ',
      branch: 'GloPro Flagship Salon',
      missingInfo: 'Cần xác nhận thợ trống gấp',
      isComplete: true
    },
    crmProfile: {
      tier: 'Hạng Kim Cương',
      totalSpent: 12500000,
      visitCount: 15,
      lastVisit: '02/10/2026',
      notes: 'Khách VIP thân thiết. Thường bận rộn, thích phục vụ nhanh gọn đúng giờ.'
    },
    messages: [
      {
        id: 'msg-3-1',
        senderType: 'customer',
        senderName: 'Loan Tập',
        time: '17:50',
        contentVi: 'Em ơi chiều nay tầm 18h15 chị ghé cắt tóc và gội đầu được không? Gấp quá.',
        contentJa: '今日18:15頃、カットとシャンプーに寄ってもいいですか？急ぎです。',
        isInternal: false
      },
      {
        id: 'msg-3-2',
        senderType: 'customer',
        senderName: 'Loan Tập',
        time: '17:55',
        contentVi: 'Hôm nay buổi chiều các lịch khá kín, muốn nhân viên thật xác nhận giúp xem giường gội có trống không nhé.',
        contentJa: '今日は午後の予約が詰まっているので、実際の人に確認してほしいです。',
        isInternal: false
      }
    ],
    aiSuggestions: [
      {
        id: 'sug-3-1',
        textVi: 'Dạ chị Loan Tập ơi, em kiểm tra thấy lúc 18:15 còn 1 giường gội và thợ trống, em giữ lịch ngay cho chị nhé!',
        textJa: 'Loan様、18:15にシャンプー台とスタイリストの空きがございます。すぐにお席を確保いたします！'
      }
    ]
  },
  {
    id: 'conv-4',
    channel: 'instagram',
    channelLabel: 'IG: ngocanh.beauty',
    customerName: 'Ngọc Ánh',
    phone: '0905 555 666',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    lastMessageTime: '16:50',
    unreadCount: 0,
    leadScore: 55, // 55%
    status: 'ai_handled',
    tags: [
      { id: 'ai_replied', label: 'AI đã phản hồi', labelJa: 'AI返信済み', color: 'blue' },
      { id: 'follow_up', label: 'Chăm sóc', labelJa: 'フォローアップ', color: 'slate' }
    ],
    lastMessage: 'Sau nhuộm, bạn nên dùng dầu gội giữ màu và tránh gội nước quá nóng trong 4 tuần.',
    lastMessageJa: 'カラー後は、色持ち用のシャンプーをご使用いただき、熱すぎるお湯は避けて、4週...',
    language: 'ja',
    bookingDraft: {
      customerName: 'Ngọc Ánh',
      phone: '0905 555 666',
      serviceName: 'Hấp phục hồi Olaplex chuyên sâu',
      serviceCategory: 'Phục hồi tóc',
      servicePrice: 650000,
      durationMinutes: 60,
      date: 'Chưa rõ',
      time: 'Chưa rõ',
      stylist: 'Chưa chọn',
      branch: 'GloPro Flagship Salon',
      missingInfo: 'Khách đang hỏi tư vấn sản phẩm',
      isComplete: false
    },
    crmProfile: {
      tier: 'Hạng Bạc',
      totalSpent: 2100000,
      visitCount: 3,
      lastVisit: '10/10/2026',
      notes: 'Đã nhuộm tóc màu khói tuần trước, đang hỏi cách giữ màu tóc.'
    },
    messages: [
      {
        id: 'msg-4-1',
        senderType: 'customer',
        senderName: 'Ngọc Ánh',
        time: '16:45',
        contentVi: 'Dầu gội giữ màu tóc bên salon có loại nào tốt không ạ? Mình sợ nhanh phai màu khói.',
        contentJa: 'サロンでおすすめのカラーキープシャンプーはありますか？スモーキーカラーが落ちるのが心配です。',
        isInternal: false
      },
      {
        id: 'msg-4-2',
        senderType: 'ai',
        senderName: 'AI Assistant',
        time: '16:50',
        contentVi: 'Dạ sau khi nhuộm màu khói, bạn nên dùng dầu gội tím khử vàng chuyên dụng và tránh gội nước quá nóng trong 4 tuần đầu để giữ màu chuẩn nhất ạ.',
        contentJa: 'カラー後は、色持ち用のシャンプーをご使用いただき、熱すぎるお湯は避けて、4週間ケアすることをおすすめします。',
        isInternal: false
      }
    ],
    aiSuggestions: [
      {
        id: 'sug-4-1',
        textVi: 'Dạ bên em đang có chai dầu gội tím Tigi Bed Head 400ml giá 420.000đ, em gửi ship tận nhà cho chị nhé?',
        textJa: '当店ではティジ（TIGI）カラーケアシャンプー（420,000VND）を取り扱っております。ご自宅への配送も可能です。'
      }
    ]
  },
  {
    id: 'conv-5',
    channel: 'telegram',
    channelLabel: 'TG: @huonggiang_spa',
    customerName: 'Hương Giang',
    phone: '0904 444 555',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
    lastMessageTime: '15:05',
    unreadCount: 0,
    leadScore: 90,
    status: 'ai_handled',
    tags: [
      { id: 'bookable', label: 'Có thể đặt lịch', labelJa: '予約可能', color: 'emerald' },
      { id: 'appointment', label: 'Lịch hẹn', labelJa: '予約', color: 'slate' }
    ],
    lastMessage: 'Dạ lúc 16:30 có lịch hẹn đã được ghi nhận cho chị.',
    lastMessageJa: '16:30にNgọc Ánhの予約が入っているの...',
    language: 'ja',
    bookingDraft: {
      customerName: 'Hương Giang',
      phone: '0904 444 555',
      serviceName: 'Combo Gội đầu dưỡng sinh & Massage cổ vai gáy',
      serviceCategory: 'Dưỡng sinh Spa',
      servicePrice: 450000,
      durationMinutes: 75,
      date: 'Ngày mai (Tomorrow)',
      time: '16:30',
      stylist: 'KTV Mai Lan',
      branch: 'GloPro Flagship Salon',
      missingInfo: 'Đã đầy đủ thông tin',
      isComplete: true
    },
    crmProfile: {
      tier: 'Hạng Vàng',
      totalSpent: 5200000,
      visitCount: 7,
      lastVisit: '25/09/2026',
      notes: 'Thích lực massage vừa phải, dầu gội bưởi thảo mộc thiên nhiên.'
    },
    messages: [
      {
        id: 'msg-5-1',
        senderType: 'customer',
        senderName: 'Hương Giang',
        time: '15:00',
        contentVi: 'Ngày mai 16:30 mình muốn làm combo gội đầu dưỡng sinh 75 phút được không?',
        contentJa: '明日16:30に75分のヘッドスパコースをお願いできますか？',
        isInternal: false
      },
      {
        id: 'msg-5-2',
        senderType: 'ai',
        senderName: 'AI Assistant',
        time: '15:05',
        contentVi: 'Dạ khung giờ 16:30 ngày mai đang có giường spa và KTV Mai Lan sẵn sàng, em đã chuẩn bị phiếu nháp giữ lịch cho chị rồi ạ!',
        contentJa: '明日16:30のお時間、スパベッドとセラピストMai Lanが待機しております。仮予約を承りました！',
        isInternal: false
      }
    ],
    aiSuggestions: [
      {
        id: 'sug-5-1',
        textVi: 'Dạ em bấm xác nhận lịch hẹn 16:30 ngày mai cho chị Hương Giang ngay nhé ạ!',
        textJa: '明日の16:30、Hương Giang様のご予約を直ちに確定いたします！'
      }
    ]
  }
];
